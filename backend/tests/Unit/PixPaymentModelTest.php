<?php
// tests/Unit/PixPaymentModelTest.php

namespace Tests\Unit;

use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PixPaymentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_uuid_token_automatically()
    {
        $user = User::factory()->create();

        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'status' => 'generated'
        ]);

        // Assert
        $this->assertNotNull($pix->token);
        $this->assertTrue(\Illuminate\Support\Str::isUuid($pix->token));
    }

    public function test_it_sets_expiration_time_automatically()
    {
        config(['pix.expiration_minutes' => 10]);
        $user = User::factory()->create();
        
        Carbon::setTestNow(now());

        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 50.00
        ]);

        $this->assertNotNull($pix->expires_at);
        $this->assertEquals(now()->addMinutes(10)->timestamp, $pix->expires_at->timestamp);

        Carbon::setTestNow();
    }

    public function test_it_correctly_identifies_expired_pix()
    {
        $user = User::factory()->create();
        
        $expiredPix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(5)
        ]);

        $activePix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 200.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(5)
        ]);

        $this->assertTrue($expiredPix->isExpired());
        $this->assertFalse($activePix->isExpired());
    }

    public function test_it_can_mark_pix_as_paid()
    {
        $user = User::factory()->create();
        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 150.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(10)
        ]);

        $result = $pix->markAsPaid();

        $this->assertTrue($result);
        $this->assertEquals('paid', $pix->status);
        $this->assertNotNull($pix->paid_at);
        $this->assertTrue($pix->isPaid());
    }

    public function test_it_cannot_mark_expired_pix_as_paid()
    {
        $user = User::factory()->create();
        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 100.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(5)
        ]);

        $result = $pix->markAsPaid();

        $this->assertFalse($result);
        $this->assertEquals('generated', $pix->status);
        $this->assertNull($pix->paid_at);
    }

    public function test_it_generates_correct_qr_code_url()
    {
        $user = User::factory()->create();
        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 75.00
        ]);

        $qrUrl = $pix->getQrCodeUrl();

        $expectedUrl = route('api.pix.qrcode', ['token' => $pix->token]);
        $this->assertEquals($expectedUrl, $qrUrl);
        $this->assertStringContainsString("/api/pix/qrcode/{$pix->token}", $qrUrl);
    }

    public function test_it_calculates_remaining_time_correctly()
    {
        Carbon::setTestNow(now());
        $user = User::factory()->create();
        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'expires_at' => now()->addMinutes(5)
        ]);

        $remainingTime = $pix->getRemainingTime();
        $this->assertGreaterThan(290, $remainingTime);
        $this->assertLessThan(310, $remainingTime);
        Carbon::setTestNow();
    }

    public function test_it_returns_zero_remaining_time_for_expired_pix()
    {
        $user = User::factory()->create();
        $pix = PixPayment::create([
            'user_id' => $user->id,
            'amount' => 50.00,
            'expires_at' => now()->subMinutes(5)
        ]);

        $this->assertEquals(0, $pix->getRemainingTime());
    }
}
