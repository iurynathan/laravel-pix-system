<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\PixPayment;
use App\Models\User;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class CleanupExpiredPixCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_processes_expired_pix_payments(): void
    {
        $user = User::factory()->create();

        PixPayment::factory()->count(3)->create([
            'user_id' => $user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        PixPayment::factory()->create([
            'user_id' => $user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $this->artisan('pix:cleanup-expired')
            ->expectsOutput('Starting PIX cleanup...')
            ->expectsOutput('Processed 3 expired PIX payments')
            ->assertExitCode(0);

        $this->assertEquals(3, PixPayment::where('status', 'expired')->count());
        $this->assertEquals(1, PixPayment::where('status', 'generated')->count());
    }

    public function test_command_handles_no_expired_payments(): void
    {
        $user = User::factory()->create();

        PixPayment::factory()->count(2)->create([
            'user_id' => $user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $this->artisan('pix:cleanup-expired')
            ->expectsOutput('Starting PIX cleanup...')
            ->expectsOutput('Processed 0 expired PIX payments')
            ->assertExitCode(0);

        $this->assertEquals(0, PixPayment::where('status', 'expired')->count());
        $this->assertEquals(2, PixPayment::where('status', 'generated')->count());
    }

    public function test_command_is_disabled_when_config_is_false(): void
    {
        config(['pix.cleanup.schedule_enabled' => false]);

        $this->artisan('pix:cleanup-expired')
            ->expectsOutput('PIX cleanup is disabled')
            ->assertExitCode(0);
    }

    public function test_command_uses_pix_service(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->create([
            'user_id' => $user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        $this->mock(PixService::class, function ($mock) {
            $mock->shouldReceive('processExpiredPixPayments')
                ->once()
                ->andReturn(1);
        });

        $this->artisan('pix:cleanup-expired')
            ->expectsOutput('Starting PIX cleanup...')
            ->expectsOutput('Processed 1 expired PIX payments')
            ->assertExitCode(0);
    }
}