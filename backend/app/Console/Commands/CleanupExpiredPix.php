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
        if (!config('pix.cleanup.schedule_enabled', true)) {
            $this->info('PIX cleanup is disabled');
            return self::SUCCESS;
        }

        $this->info('Starting PIX cleanup...');
        
        $expiredCount = $pixService->processExpiredPixPayments();
        
        $this->info("Processed {$expiredCount} expired PIX payments");
        
        return self::SUCCESS;
    }
}