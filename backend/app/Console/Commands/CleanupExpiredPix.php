<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\PixService;
use Illuminate\Console\Command;

class CleanupExpiredPix extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pix:cleanup-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark expired PIX payments as expired';

    /**
     * Execute the console command.
     */
    public function handle(PixService $pixService): int
    {
        $startTime = now();
        
        if (!config('pix.cleanup.schedule_enabled', true)) {
            $this->info('[' . $startTime->format('Y-m-d H:i:s') . '] PIX cleanup is disabled');
            return self::SUCCESS;
        }

        $this->info('[' . $startTime->format('Y-m-d H:i:s') . '] Starting PIX cleanup...');
        
        try {
            $expiredCount = $pixService->processExpiredPixPayments();
            
            $endTime = now();
            $duration = $endTime->diffInMilliseconds($startTime);
            
            $this->info('[' . $endTime->format('Y-m-d H:i:s') . '] Processed ' . $expiredCount . ' expired PIX payments in ' . $duration . 'ms');
            
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('[' . now()->format('Y-m-d H:i:s') . '] Error during PIX cleanup: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}