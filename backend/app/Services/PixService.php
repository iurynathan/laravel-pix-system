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
use Illuminate\Support\Facades\Cache;

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
                        config('pix.expiration_minutes', 10)
                    )
                ]);
    
                Log::info('PIX payment generated', [
                    'user_id' => $user->id,
                    'pix_id' => $pixPayment->id,
                    'amount' => $amount
                ]);

                $this->clearStatisticsCache();
    
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

            $this->clearStatisticsCache();

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

                    $this->clearStatisticsCache();
        
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

            $this->clearStatisticsCache();
    
            return $expiredCount;
        } catch (Exception $e) {
            Log::error('Failed to process expired PIX payments', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Generate system-wide PIX statistics with Redis cache
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function getSystemStatistics(array $filters = []): array
    {
        $cacheKey = 'pix_system_statistics_' . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 60, function () use ($filters) {
            $query = PixPayment::query();
            
            // Aplicar filtros
            if (!empty($filters['status'])) {
                $query->byStatus($filters['status']);
            }
            
            if (!empty($filters['search'])) {
                $query->search($filters['search']);
            }
            
            $query->byDateRange($filters['start_date'] ?? null, $filters['end_date'] ?? null);
            $query->byValueRange($filters['min_value'] ?? null, $filters['max_value'] ?? null);
            
            $stats = $query->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as `generated`,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as total_amount
            ', ['generated', 'paid', 'expired', 'paid'])->first();

            return [
                'total_pix' => (int) ($stats->total ?? 0),
                'generated' => (int) ($stats->generated ?? 0),
                'paid' => (int) ($stats->paid ?? 0),
                'expired' => (int) ($stats->expired ?? 0),
                'total_amount' => (float) ($stats->total_amount ?? 0),
                'conversion_rate' => $stats->total > 0 
                    ? round(($stats->paid / $stats->total) * 100, 2) 
                    : 0
            ];
        });
    }

    /**
     * Get user-specific PIX statistics with cache
     *
     * @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function getUserStatistics(User $user, array $filters = []): array
    {
        $cacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize($filters));
        
        return Cache::remember($cacheKey, 60, function () use ($user, $filters) {
            $query = $user->pixPayments();
            
            // Aplicar filtros
            if (!empty($filters['status'])) {
                $query->byStatus($filters['status']);
            }
            
            if (!empty($filters['search'])) {
                $query->search($filters['search']);
            }
            
            $query->byDateRange($filters['start_date'] ?? null, $filters['end_date'] ?? null);
            $query->byValueRange($filters['min_value'] ?? null, $filters['max_value'] ?? null);
            
            $stats = $query->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as `generated`,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN status = ? THEN amount ELSE 0 END) as total_amount
            ', ['generated', 'paid', 'expired', 'paid'])
            ->first();

            return [
                'total_pix' => (int) ($stats->total ?? 0),
                'generated' => (int) ($stats->generated ?? 0),
                'paid' => (int) ($stats->paid ?? 0),
                'expired' => (int) ($stats->expired ?? 0),
                'total_amount' => (float) ($stats->total_amount ?? 0),
                'conversion_rate' => $stats->total > 0 
                    ? round(($stats->paid / $stats->total) * 100, 2) 
                    : 0
            ];
        });
    }

    /**
     * Get timeline data for charts
     *
     * @return array<string, mixed>
     */
    public function getTimelineData(User $user, int $days = 30): array
    {
        $cacheKey = "pix_timeline_{$user->id}_{$days}";
        
        return Cache::remember($cacheKey, 300, function () use ($user, $days) {
            // Usar fuso horário de São Paulo para cálculos
            $timezone = 'America/Sao_Paulo';
            $startDate = Carbon::now($timezone)->subDays($days - 1)->startOfDay()->utc();
            $endDate = Carbon::now($timezone)->endOfDay()->utc();
            
            // Query otimizada usando agregação SQL
            $timelineData = $user->pixPayments()
                ->selectRaw("
                    DATE(CONVERT_TZ(created_at, 'UTC', 'America/Sao_Paulo')) as date,
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = ? THEN 1 END) as `generated`,
                    COUNT(CASE WHEN status = ? THEN 1 END) as paid,
                    COUNT(CASE WHEN status = ? THEN 1 END) as expired,
                    COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as amount
                ", ['generated', 'paid', 'expired', 'paid'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupByRaw("DATE(CONVERT_TZ(created_at, 'UTC', 'America/Sao_Paulo'))")
                ->orderBy('date')
                ->get()
                ->keyBy('date');
            
            // Gerar timeline completo (incluindo dias sem dados)
            $timeline = [];
            for ($i = 0; $i < $days; $i++) {
                $date = Carbon::now($timezone)->subDays($days - 1 - $i);
                $dateStr = $date->format('Y-m-d');
                
                $dayData = $timelineData->get($dateStr);
                $timeline[] = [
                    'date' => $dateStr,
                    'generated' => $dayData ? (int) $dayData->generated : 0,
                    'paid' => $dayData ? (int) $dayData->paid : 0,
                    'expired' => $dayData ? (int) $dayData->expired : 0,
                    'total' => $dayData ? (int) $dayData->total : 0,
                    'amount' => $dayData ? (float) $dayData->amount : 0.0,
                ];
            }
            
            return $timeline;
        });
    }

    /**
     * Get system-wide timeline data for admin users
     *
     * @return array<string, mixed>
     */
    public function getSystemTimelineData(int $days = 30): array
    {
        $cacheKey = "pix_system_timeline_{$days}";
        
        return Cache::remember($cacheKey, 300, function () use ($days) {
            // Usar fuso horário de São Paulo para cálculos
            $timezone = 'America/Sao_Paulo';
            $startDate = Carbon::now($timezone)->subDays($days - 1)->startOfDay()->utc();
            $endDate = Carbon::now($timezone)->endOfDay()->utc();
            
            // Query otimizada usando agregação SQL para todo o sistema
            $timelineData = PixPayment::selectRaw("
                    DATE(CONVERT_TZ(created_at, 'UTC', 'America/Sao_Paulo')) as date,
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = ? THEN 1 END) as `generated`,
                    COUNT(CASE WHEN status = ? THEN 1 END) as paid,
                    COUNT(CASE WHEN status = ? THEN 1 END) as expired,
                    COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as amount
                ", ['generated', 'paid', 'expired', 'paid'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupByRaw("DATE(CONVERT_TZ(created_at, 'UTC', 'America/Sao_Paulo'))")
                ->orderBy('date')
                ->get()
                ->keyBy('date');
            
            // Gerar timeline completo (incluindo dias sem dados)
            $timeline = [];
            for ($i = 0; $i < $days; $i++) {
                $date = Carbon::now($timezone)->subDays($days - 1 - $i);
                $dateStr = $date->format('Y-m-d');
                
                $dayData = $timelineData->get($dateStr);
                $timeline[] = [
                    'date' => $dateStr,
                    'generated' => $dayData ? (int) $dayData->generated : 0,
                    'paid' => $dayData ? (int) $dayData->paid : 0,
                    'expired' => $dayData ? (int) $dayData->expired : 0,
                    'total' => $dayData ? (int) $dayData->total : 0,
                    'amount' => $dayData ? (float) $dayData->amount : 0.0,
                ];
            }
            
            return $timeline;
        });
    }

    /**
     * Clear statistics cache when PIX status changes
     */
    public function clearStatisticsCache(): void
    {
        // Como as chaves agora incluem hash dos filtros, vamos limpar o cache geral
        // Uma abordagem mais robusta seria usar tags de cache, mas flush é mais simples
        Cache::flush();
    }
}