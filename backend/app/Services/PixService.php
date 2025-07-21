<?php

namespace App\Services;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PixService
{
    public function __construct()
    {
    }

    /**
     * Gera uma nova cobrança PIX
     */
    public function generatePixPayment(
        User $user, 
        float $amount = 0, 
        string $description = null
    ): PixPayment {
        $pixPayment = PixPayment::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'description' => $description,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(
                config('pix.expiration_minutes', 10)
            )
        ]);

        Log::info('PIX payment generated', [
            'user_id' => $user->id,
            'pix_id' => $pixPayment->id,
            'token' => $pixPayment->token,
            'amount' => $amount
        ]);

        return $pixPayment;
    }

    /**
     * ✅ Confirma um pagamento PIX pelo token
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
                'token' => $token
            ]);

            return [
                'success' => false,
                'message' => 'PIX expirado',
                'status' => 'expired',
                'pix' => $pixPayment
            ];
        }

        if ($pixPayment->isPaid()) {
            return [
                'success' => true,
                'message' => 'PIX já foi pago anteriormente',
                'status' => 'already_paid',
                'pix' => $pixPayment
            ];
        }

        $success = $pixPayment->markAsPaid();

        if ($success) {
            Log::info('PIX payment confirmed', [
                'pix_id' => $pixPayment->id,
                'token' => $token,
                'user_id' => $pixPayment->user_id
            ]);

            return [
                'success' => true,
                'message' => 'Pagamento confirmado com sucesso!',
                'status' => 'paid',
                'pix' => $pixPayment
            ];
        }

        return [
            'success' => false,
            'message' => 'Erro ao confirmar pagamento',
            'status' => 'error'
        ];
    }

    /**
     * Processa PIX expirados
     */
    public function processExpiredPixPayments(): int
    {
        $expiredCount = PixPayment::expired()->count();
        
        PixPayment::expired()->update([
            'status' => 'expired'
        ]);

        Log::info("Processed {$expiredCount} expired PIX payments");

        return $expiredCount;
    }

    /**
     * Gera estatísticas gerais do sistema
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
