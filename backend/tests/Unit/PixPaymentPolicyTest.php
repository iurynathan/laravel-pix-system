<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\PixPayment;
use App\Models\User;
use App\Policies\PixPaymentPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class PixPaymentPolicyTest extends TestCase
{
    use RefreshDatabase;

    private PixPaymentPolicy $policy;
    private User $user;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new PixPaymentPolicy();
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    public function test_view_any_allows_all_users(): void
    {
        $result = $this->policy->viewAny($this->user);

        $this->assertTrue($result);
    }

    public function test_view_allows_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id
        ]);

        $result = $this->policy->view($this->user, $pixPayment);

        $this->assertTrue($result);
    }

    public function test_view_denies_non_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->otherUser->id
        ]);

        $result = $this->policy->view($this->user, $pixPayment);

        $this->assertFalse($result);
    }

    public function test_create_allows_all_users(): void
    {
        $result = $this->policy->create($this->user);

        $this->assertTrue($result);
    }

    public function test_update_allows_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id
        ]);

        $result = $this->policy->update($this->user, $pixPayment);

        $this->assertTrue($result);
    }

    public function test_update_denies_non_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->otherUser->id
        ]);

        $result = $this->policy->update($this->user, $pixPayment);

        $this->assertFalse($result);
    }

    public function test_delete_allows_owner_with_unpaid_pix(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated'
        ]);

        $result = $this->policy->delete($this->user, $pixPayment);

        $this->assertTrue($result->allowed());
    }

    public function test_delete_denies_non_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->otherUser->id,
            'status' => 'generated'
        ]);

        $result = $this->policy->delete($this->user, $pixPayment);

        $this->assertTrue($result->denied());
        $this->assertEquals('Você não tem permissão para deletar este PIX.', $result->message());
    }

    public function test_delete_denies_paid_pix(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'paid_at' => Carbon::now()
        ]);

        $result = $this->policy->delete($this->user, $pixPayment);

        $this->assertTrue($result->denied());
        $this->assertEquals('Não é possível deletar um PIX que já foi pago.', $result->message());
    }

    public function test_confirm_allows_owner_with_valid_pix(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $result = $this->policy->confirm($this->user, $pixPayment);

        $this->assertTrue($result->allowed());
    }

    public function test_confirm_denies_non_owner(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->otherUser->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $result = $this->policy->confirm($this->user, $pixPayment);

        $this->assertTrue($result->denied());
        $this->assertEquals('Você não tem permissão para confirmar este PIX.', $result->message());
    }

    public function test_confirm_denies_expired_pix(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        $result = $this->policy->confirm($this->user, $pixPayment);

        $this->assertTrue($result->denied());
        $this->assertEquals('Este PIX não pode ser confirmado no momento.', $result->message());
    }

    public function test_confirm_denies_already_paid_pix(): void
    {
        $pixPayment = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'paid_at' => Carbon::now()
        ]);

        $result = $this->policy->confirm($this->user, $pixPayment);

        $this->assertTrue($result->denied());
        $this->assertEquals('Este PIX não pode ser confirmado no momento.', $result->message());
    }
}