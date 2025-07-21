<?php
// tests/Feature/PixConfirmationTest.php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PixPayment;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PixConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private PixService $pixService;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->pixService = new PixService();
        $this->user = User::factory()->create();
    }

    public function test_it_can_confirm_a_valid_pix_payment()
    {
        $pixPayment = $this->pixService->generatePixPayment($this->user, 100.00);

        $result = $this->pixService->confirmPayment($pixPayment->token);

        $this->assertTrue($result['success']);
        $this->assertEquals('paid', $result['status']);
        $this->assertEquals('Pagamento confirmado com sucesso!', $result['message']);
        
        $this->assertDatabaseHas('pix_payments', [
            'id' => $pixPayment->id,
            'status' => 'paid'
        ]);
        
        $pixPayment->refresh();
        $this->assertNotNull($pixPayment->paid_at);
        $this->assertEquals('paid', $pixPayment->status);
    }

    public function test_it_returns_error_for_non_existent_token()
    {
        $result = $this->pixService->confirmPayment('non-existent-token');

        $this->assertFalse($result['success']);
        $this->assertEquals('not_found', $result['status']);
        $this->assertEquals('PIX não encontrado', $result['message']);
    }

    public function test_it_marks_expired_pix_when_trying_to_confirm()
    {
        $pixPayment = PixPayment::create([
            'user_id' => $this->user->id,
            'token' => \Illuminate\Support\Str::uuid(),
            'amount' => 50.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(5)
        ]);

        $result = $this->pixService->confirmPayment($pixPayment->token);

        $this->assertFalse($result['success']);
        $this->assertEquals('expired', $result['status']);
        $this->assertEquals('PIX expirado', $result['message']);
        
        $this->assertDatabaseHas('pix_payments', [
            'id' => $pixPayment->id,
            'status' => 'expired'
        ]);
    }

    public function test_it_handles_already_paid_pix()
    {
        $pixPayment = $this->pixService->generatePixPayment($this->user, 75.00);
        $pixPayment->markAsPaid();

        $result = $this->pixService->confirmPayment($pixPayment->token);

        $this->assertTrue($result['success']);
        $this->assertEquals('already_paid', $result['status']);
        $this->assertEquals('PIX já foi pago anteriormente', $result['message']);
    }

    public function test_it_can_access_pix_confirmation_via_http()
    {
        $pixPayment = $this->pixService->generatePixPayment($this->user, 25.00);

        $response = $this->get("/pix/{$pixPayment->token}");

        $response->assertStatus(200);
        
        $pixPayment->refresh();
        $this->assertEquals('paid', $pixPayment->status);
    }

    public function test_it_shows_expired_status_when_accessing_expired_pix()
    {
        $pixPayment = PixPayment::create([
            'user_id' => $this->user->id,
            'token' => \Illuminate\Support\Str::uuid(),
            'amount' => 30.00,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        $response = $this->get("/pix/{$pixPayment->token}");

        $response->assertStatus(200);
        $response->assertSee('expirado');
        
        $pixPayment->refresh();
        $this->assertEquals('expired', $pixPayment->status);
    }
}
