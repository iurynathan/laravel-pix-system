<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrCodeApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private PixService $pixService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->pixService = app(PixService::class);
    }

    public function test_can_access_qr_code_image_for_valid_pix(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 50.00, 'QR Code Test');

        $response = $this->get("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'image/png')
                 ->assertHeader('Cache-Control', 'max-age=300, public');
    }

    public function test_returns_404_for_nonexistent_pix_token(): void
    {
        $response = $this->get('/api/pix/qrcode/invalid-token');

        $response->assertStatus(404);
    }

    public function test_returns_410_for_expired_pix(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 30.00);
        
        $pix->update(['expires_at' => now()->subMinutes(1)]);

        $response = $this->get("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(410);
    }

    public function test_qr_code_endpoint_is_public(): void
    {
        $otherUser = User::factory()->create();
        $pix = $this->pixService->generatePixPayment($otherUser, 25.00);

        $response = $this->get("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'image/png');
    }

    public function test_qr_code_includes_proper_headers(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 75.00);

        $response = $this->get("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'image/png')
                 ->assertHeader('Cache-Control', 'max-age=300, public')
                 ->assertHeader('Content-Disposition', 'inline; filename="pix-qrcode.png"');
    }
}