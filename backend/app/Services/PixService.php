<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;
use App\Exceptions\PixPaymentException;
use Illuminate\Support\Facades\DB;

class PixService
{
    /**
     * Generate a new PIX payment
     * 
     * @throws PixPaymentException
     */
    public function generatePixPayment(
        User $user,
        float $amount = 0,
        ?string $description = null
    ): PixPayment {
        try {
            return DB::transaction(function () use ($user, $amount, $description) {
                $pixPayment = PixPayment::create([
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'description' => $description,
                    'status' => 'generated',
                    'expires_at' => Carbon::now()->addMinutes(
                        config('pix.expiration_minutes', 15)
                    )
                ]);
    
                Log::info('PIX payment generated', [
                    'user_id' => $user->id,
                    'pix_id' => $pixPayment->id,
                    'amount' => $amount
                ]);
    
                return $pixPayment;
            });
        } catch (Exception $e) {
            Log::error('Failed to generate PIX payment', [
                'user_id' => $user->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            throw new PixPaymentException('Falha ao gerar cobrança PIX: ' . $e->getMessage(), 500, $e);
        }
    }

    /**
     * Confirm a PIX payment by token
     *
     * @return array<string, mixed>
     */
    public function confirmPayment(string $token): array
    {
        $pixPayment = PixPayment::where('token', $token)->first();

        if (!$pixPayment) {
            return [
                'success' => false,
                'message' => 'PIX não encontrado',
                'status' => 'not_found'
            ];
        }

        if ($pixPayment->isExpired()) {
            $pixPayment->markAsExpired();
            
            Log::info('PIX payment expired', [
                'pix_id' => $pixPayment->id,
            ]);

            return [
                'success' => false,
                'message' => 'PIX expirado',
                'status' => 'expired',
                'pix' => $pixPayment->toApiResponse()
            ];
        }

        if ($pixPayment->isPaid()) {
            return [
                'success' => true,
                'message' => 'PIX já foi pago anteriormente',
                'status' => 'already_paid',
                'pix' => $pixPayment->toApiResponse()
            ];
        }

        try {
            return DB::transaction(function () use ($pixPayment) {
                $success = $pixPayment->markAsPaid();
    
                if ($success) {
                    Log::info('PIX payment confirmed', [
                        'pix_id' => $pixPayment->id,
                        'user_id' => $pixPayment->user_id
                    ]);
        
                    return [
                        'success' => true,
                        'message' => 'Pagamento confirmado com sucesso!',
                        'status' => 'paid',
                        'pix' => $pixPayment->toApiResponse()
                    ];
                }
    
                return [
                    'success' => false,
                    'message' => 'Erro ao confirmar pagamento',
                    'status' => 'error'
                ];
            });
        } catch (Exception $e) {
            Log::error('Failed to confirm PIX payment', [
                'pix_id' => $pixPayment->id,
                'token' => $token,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'message' => 'Erro interno ao confirmar pagamento',
                'status' => 'internal_error'
            ];
        }
    }

    /**
     * Process expired PIX payments
     */
    public function processExpiredPixPayments(): int
    {
        try {
            $expiredCount = PixPayment::expired()->count();
            
            PixPayment::expired()->update([
                'status' => 'expired'
            ]);
    
            Log::info("Processed {$expiredCount} expired PIX payments");
    
            return $expiredCount;
        } catch (Exception $e) {
            Log::error('Failed to process expired PIX payments', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Generate system-wide PIX statistics
     *
     * @return array<string, mixed>
     */
    public function getSystemStatistics(): array
    {
        $stats = PixPayment::selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN status = "generated" THEN 1 ELSE 0 END) as generated,
            SUM(CASE WHEN status = "paid" THEN 1 ELSE 0 END) as paid,
            SUM(CASE WHEN status = "expired" THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END) as total_amount
        ')->first();

        return [
            'total_pix' => $stats->total ?? 0,
            'generated' => $stats->generated ?? 0,
            'paid' => $stats->paid ?? 0,
            'expired' => $stats->expired ?? 0,
            'total_amount' => number_format($stats->total_amount ?? 0, 2, ',', '.'),
            'conversion_rate' => $stats->total > 0 
                ? round(($stats->paid / $stats->total) * 100, 2) 
                : 0
        ];
    }
}