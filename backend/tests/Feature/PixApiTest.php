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
                                 'remaining_time'
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
        $responses = [];
        
        for ($i = 0; $i < 15; $i++) {
            $responses[] = $this->actingAs($this->user, 'sanctum')
                                ->postJson('/api/pix', ['amount' => 1.00]);
        }

        $blocked = collect($responses)->filter(fn($response) => $response->status() === 429);
        $this->assertGreaterThan(0, $blocked->count(), 'Rate limiting should block some requests');
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
        
        $qrCodeBase64 = $response->json('data.qr_code_base64');
        $this->assertNotNull($qrCodeBase64);
        $this->assertIsString($qrCodeBase64);
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
}