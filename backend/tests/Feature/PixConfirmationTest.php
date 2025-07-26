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

    public function test_it_can_confirm_pix_payment_via_api_route()
    {
        $pixPayment = $this->pixService->generatePixPayment($this->user, 25.00);

        $response = $this->postJson("/api/pix/{$pixPayment->token}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'status' => 'paid',
                 ]);
        
        $this->assertDatabaseHas('pix_payments', [
            'id' => $pixPayment->id,
            'status' => 'paid'
        ]);
    }

    public function test_it_allows_public_confirmation_of_any_valid_pix()
    {
        $anotherUser = User::factory()->create();
        $pixPayment = $this->pixService->generatePixPayment($anotherUser, 50.00);

        $response = $this->postJson("/api/pix/{$pixPayment->token}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'status' => 'paid',
                 ]);
                 
        $this->assertDatabaseHas('pix_payments', [
            'id' => $pixPayment->id,
            'status' => 'paid'
        ]);
    }

    public function test_it_returns_not_found_for_invalid_token_on_confirmation_route()
    {
        $response = $this->postJson("/api/pix/invalid-token");

        $response->assertStatus(404);
    }
}
