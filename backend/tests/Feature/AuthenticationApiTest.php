<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthenticationApiTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'user' => ['id', 'name', 'email'],
                         'access_token',
                         'token_type'
                     ],
                     'message'
                 ]);

        $this->assertDatabaseHas('users', [
            'name' => $userData['name'],
            'email' => $userData['email'],
        ]);
    }

    public function test_user_cannot_register_with_invalid_email(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_user_cannot_register_with_mismatched_passwords(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => 'password123',
            'password_confirmation' => 'different_password',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_user_cannot_register_with_existing_email(): void
    {
        $existingUser = User::factory()->create();

        $userData = [
            'name' => $this->faker->name,
            'email' => $existingUser->email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $userData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt($password = 'password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => $password,
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'access_token',
                         'token_type'
                     ],
                     'message'
                 ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Credenciais inválidas'
                 ]);
    }

    public function test_user_cannot_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Credenciais inválidas'
                 ]);
    }

    public function test_authenticated_user_can_access_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'user' => ['id', 'name', 'email'],
                         'pix_stats' => [
                             'total',
                             'generated', 
                             'paid',
                             'expired',
                             'total_amount'
                         ]
                     ]
                 ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/auth/logout');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Logout realizado com sucesso'
                 ]);

        // Verificar se o token foi revogado
        $this->assertDatabaseMissing('personal_access_tokens', [
            'name' => 'test-token',
        ]);
    }

    public function test_unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    public function test_user_profile_includes_pix_statistics(): void
    {
        $user = User::factory()->create();
        
        // Criar alguns PIX para testar estatísticas
        $user->pixPayments()->create([
            'token' => (string) \Illuminate\Support\Str::uuid(),
            'amount' => 10.00,
            'status' => 'generated',
            'expires_at' => now()->addMinutes(15),
        ]);

        $user->pixPayments()->create([
            'token' => (string) \Illuminate\Support\Str::uuid(),
            'amount' => 20.00,
            'status' => 'paid',
            'expires_at' => now()->addMinutes(15),
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'data' => [
                         'pix_stats' => [
                             'total' => 2,
                             'paid' => 1,
                             'expired' => 0,
                         ]
                     ]
                 ]);
    }
}