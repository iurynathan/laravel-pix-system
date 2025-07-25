<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PixApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $user;
    private PixService $pixService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->pixService = app(PixService::class);
    }

    public function test_authenticated_user_can_create_pix_payment(): void
    {
        $pixData = [
            'amount' => 25.50,
            'description' => 'Pagamento de teste'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/pix', $pixData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'id',
                         'token',
                         'amount',
                         'description',
                         'status',
                         'expires_at',
                         'qr_code_url',
                         'remaining_time'
                     ],
                     'message'
                 ]);

        $this->assertDatabaseHas('pix_payments', [
            'user_id' => $this->user->id,
            'amount' => 25.50,
            'description' => 'Pagamento de teste',
            'status' => 'generated'
        ]);
    }

    public function test_unauthenticated_user_cannot_create_pix_payment(): void
    {
        $pixData = [
            'amount' => 25.50,
            'description' => 'Pagamento de teste'
        ];

        $response = $this->postJson('/api/pix', $pixData);

        $response->assertStatus(401);
    }

    public function test_user_cannot_create_pix_with_invalid_amount(): void
    {
        $pixData = [
            'amount' => -10.00,
            'description' => 'Pagamento inválido'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/pix', $pixData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['amount']);
    }

    public function test_user_cannot_create_pix_with_amount_below_minimum(): void
    {
        $pixData = [
            'amount' => 0.005,
            'description' => 'Pagamento muito baixo'
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/pix', $pixData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['amount']);
    }

    public function test_user_can_create_pix_without_description(): void
    {
        $pixData = [
            'amount' => 15.00
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/pix', $pixData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('pix_payments', [
            'user_id' => $this->user->id,
            'amount' => 15.00,
            'description' => null,
            'status' => 'generated'
        ]);
    }

    public function test_authenticated_user_can_list_their_pix_payments(): void
    {
        $pix1 = $this->pixService->generatePixPayment($this->user, 10.00, 'PIX 1');
        $pix2 = $this->pixService->generatePixPayment($this->user, 20.00, 'PIX 2');

        $otherUser = User::factory()->create();
        $this->pixService->generatePixPayment($otherUser, 30.00, 'PIX Outro');

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'data' => [
                             '*' => [
                                 'id',
                                 'token', 
                                 'amount',
                                 'description',
                                 'status',
                                 'expires_at',
                                 'qr_code_url',
                              ]
                         ],
                         'meta'
                     ]
                 ]);

        $responseData = $response->json('data.data');
        $this->assertCount(2, $responseData);
        
        $returnedIds = collect($responseData)->pluck('id')->toArray();
        $this->assertContains($pix1->id, $returnedIds);
        $this->assertContains($pix2->id, $returnedIds);
    }

    public function test_unauthenticated_user_cannot_list_pix_payments(): void
    {
        $response = $this->getJson('/api/pix');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_show_their_pix_payment(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 50.00, 'PIX Detalhe');

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/pix/{$pix->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'id',
                         'token',
                         'amount',
                         'description',
                         'status',
                         'expires_at',
                         'qr_code_url',
                         'remaining_time'
                     ]
                 ]);

        $this->assertEquals($pix->id, $response->json('data.id'));
        $this->assertEquals(50.00, $response->json('data.amount'));
        $this->assertEquals('PIX Detalhe', $response->json('data.description'));
    }

    public function test_user_cannot_show_another_users_pix_payment(): void
    {
        $otherUser = User::factory()->create();
        $pix = $this->pixService->generatePixPayment($otherUser, 50.00);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/pix/{$pix->id}");

        $response->assertStatus(404);
    }

    public function test_authenticated_user_can_delete_their_generated_pix(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 30.00);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/pix/{$pix->id}");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'PIX deletado com sucesso'
                 ]);

        $this->assertDatabaseMissing('pix_payments', [
            'id' => $pix->id
        ]);
    }

    public function test_user_cannot_delete_paid_pix(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 30.00);
        $pix->markAsPaid();

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/pix/{$pix->id}");

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Não é possível deletar um PIX que já foi pago.'
                 ]);

        $this->assertDatabaseHas('pix_payments', [
            'id' => $pix->id,
            'status' => 'paid'
        ]);
    }

    public function test_user_cannot_delete_another_users_pix(): void
    {
        $otherUser = User::factory()->create();
        $pix = $this->pixService->generatePixPayment($otherUser, 30.00);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/pix/{$pix->id}");

        // Pode retornar 404 (model binding) ou 422 (policy executed)
        $this->assertContains($response->status(), [404, 422]);
    }

    public function test_pix_listing_supports_status_filter(): void
    {
        $pix1 = $this->pixService->generatePixPayment($this->user, 10.00);
        $pix2 = $this->pixService->generatePixPayment($this->user, 20.00);
        $pix2->markAsPaid();

        $pix3 = $this->pixService->generatePixPayment($this->user, 30.00);
        $pix3->update(['expires_at' => now()->subMinutes(1)]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix?status=paid');

        $response->assertStatus(200);
        
        $responseData = $response->json('data.data');
        $this->assertCount(1, $responseData);
        $this->assertEquals($pix2->id, $responseData[0]['id']);
    }

    public function test_pix_listing_supports_pagination(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            $this->pixService->generatePixPayment($this->user, $i * 1.0);
        }

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix?per_page=10');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'data',
                         'meta' => [
                             'current_page',
                             'per_page',
                             'total'
                         ]
                     ]
                 ]);

        $this->assertEquals(10, $response->json('data.meta.per_page'));
        $this->assertEquals(25, $response->json('data.meta.total'));
    }

    public function test_rate_limiting_on_pix_creation(): void
    {
        // Mock do rate limiter para simular o comportamento esperado
        \Illuminate\Support\Facades\RateLimiter::shouldReceive('tooManyAttempts')
            ->once()
            ->andReturn(true);
            
        \Illuminate\Support\Facades\RateLimiter::shouldReceive('availableIn')
            ->once()
            ->andReturn(60);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/pix', ['amount' => 1.00]);

        // Com o mock, deve retornar 429
        $response->assertStatus(429)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Muitas tentativas. Tente novamente em 60 segundos.'
                 ]);
    }

    public function test_pix_includes_qr_code_url_in_response(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 25.00);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/pix/{$pix->id}");

        $response->assertStatus(200);
        
        $qrCodeUrl = $response->json('data.qr_code_url');
        $this->assertNotNull($qrCodeUrl);
        $this->assertStringContainsString("/api/pix/qrcode/{$pix->token}", $qrCodeUrl);
        
        // qr_code_base64 removido do ListResource por performance
        // $qrCodeBase64 = $response->json('data.qr_code_base64');
        // $this->assertNotNull($qrCodeBase64);
        // $this->assertIsString($qrCodeBase64);
    }

    public function test_pix_includes_remaining_time_in_response(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 25.00);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/pix/{$pix->id}");

        $response->assertStatus(200);
        
        $remainingTime = $response->json('data.remaining_time');
        $this->assertIsInt($remainingTime);
        $this->assertGreaterThan(0, $remainingTime);
        $this->assertLessThanOrEqual(15 * 60, $remainingTime);
    }

    public function test_user_can_get_statistics(): void
    {
        $this->pixService->generatePixPayment($this->user, 100.00);
        $this->pixService->generatePixPayment($this->user, 200.00);
        
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/statistics');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'total_pix',
                         'generated',
                         'paid',
                         'expired',
                         'total_amount',
                         'conversion_rate'
                     ]
                 ]);

        $this->assertEquals(2, $response->json('data.total_pix'));
        $this->assertEquals(2, $response->json('data.generated'));
        $this->assertEquals(0, $response->json('data.paid'));
    }

    public function test_admin_can_get_system_statistics(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $otherUser = User::factory()->create();
        
        $this->pixService->generatePixPayment($this->user, 100.00);
        $this->pixService->generatePixPayment($otherUser, 200.00);
        
        $response = $this->actingAs($admin, 'sanctum')
                         ->getJson('/api/pix/statistics');

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('data.total_pix'));
    }

    public function test_user_can_get_timeline_data(): void
    {
        $this->pixService->generatePixPayment($this->user, 100.00);
        $this->pixService->generatePixPayment($this->user, 200.00);
        
        // Mock PixService to avoid CONVERT_TZ issues in SQLite
        $timelineData = array_fill(0, 7, [
            'date' => '2025-01-25',
            'generated' => 1,
            'paid' => 0,
            'expired' => 0,
            'total' => 1,
            'amount' => 100.0
        ]);
        
        $this->mock(\App\Services\PixService::class, function ($mock) use ($timelineData) {
            $mock->shouldReceive('getTimelineData')
                ->once()
                ->andReturn($timelineData);
        });

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/timeline?days=7');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         '*' => [
                             'date',
                             'generated',
                             'paid',
                             'expired',
                             'total',
                             'amount'
                         ]
                     ]
                 ]);

        $this->assertCount(7, $response->json('data'));
    }

    public function test_admin_can_get_system_timeline_data(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $otherUser = User::factory()->create();
        
        $this->pixService->generatePixPayment($this->user, 100.00);
        $this->pixService->generatePixPayment($otherUser, 200.00);
        
        // Mock PixService to avoid CONVERT_TZ issues in SQLite
        $timelineData = array_fill(0, 5, [
            'date' => '2025-01-25',
            'generated' => 1,
            'paid' => 0,
            'expired' => 0,
            'total' => 1,
            'amount' => 100.0
        ]);
        
        $this->mock(\App\Services\PixService::class, function ($mock) use ($timelineData) {
            $mock->shouldReceive('getSystemTimelineData')
                ->once()
                ->andReturn($timelineData);
        });
        
        $response = $this->actingAs($admin, 'sanctum')
                         ->getJson('/api/pix/timeline?days=5');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_timeline_respects_days_limit(): void
    {
        // Mock PixService to avoid CONVERT_TZ issues in SQLite
        $timelineData = array_fill(0, 90, [
            'date' => '2025-01-25',
            'generated' => 0,
            'paid' => 0,
            'expired' => 0,
            'total' => 0,
            'amount' => 0.0
        ]);
        
        $this->mock(\App\Services\PixService::class, function ($mock) use ($timelineData) {
            $mock->shouldReceive('getTimelineData')
                ->once()
                ->with($this->user, 90) // Should be limited to 90
                ->andReturn($timelineData);
        });

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/timeline?days=100');

        $response->assertStatus(200);
        // Should be limited to max 90 days
        $this->assertCount(90, $response->json('data'));
    }

    public function test_qrcode_endpoint_returns_image_for_valid_pix(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 50.00);

        $response = $this->getJson("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(200)
                 ->assertHeader('Content-Type', 'image/png')
                 ->assertHeader('Cache-Control', 'max-age=300, public');
    }

    public function test_qrcode_endpoint_returns_404_for_invalid_token(): void
    {
        $response = $this->getJson('/api/pix/qrcode/invalid-token');

        $response->assertStatus(404);
    }

    public function test_qrcode_endpoint_returns_410_for_expired_pix(): void
    {
        $pix = \App\Models\PixPayment::create([
            'user_id' => $this->user->id,
            'token' => \Illuminate\Support\Str::uuid(),
            'amount' => 50.00,
            'status' => 'generated',
            'expires_at' => \Carbon\Carbon::now()->subMinutes(5)
        ]);

        $response = $this->getJson("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(410);
    }

    public function test_qrcode_endpoint_is_public(): void
    {
        $pix = $this->pixService->generatePixPayment($this->user, 30.00);

        // Test without authentication
        $response = $this->getJson("/api/pix/qrcode/{$pix->token}");

        $response->assertStatus(200);
    }

    public function test_statistics_with_filters(): void
    {
        $pix1 = $this->pixService->generatePixPayment($this->user, 100.00, 'Test payment');
        $pix2 = $this->pixService->generatePixPayment($this->user, 200.00, 'Another payment');
        
        // Test with status filter
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/statistics?status=generated');

        $response->assertStatus(200);
        $this->assertEquals(2, $response->json('data.generated'));

        // Test with search filter
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/statistics?search=Test');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('data.total_pix'));
    }

    public function test_statistics_error_handling(): void
    {
        // Test with invalid filter
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/pix/statistics?invalid_param=test');

        $response->assertStatus(200); // Should still work, ignoring invalid params
    }

}