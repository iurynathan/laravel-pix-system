<?php
// tests/Feature/PixGenerationTest.php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PixPayment;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class PixGenerationTest extends TestCase
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

    public function test_it_can_generate_a_pix_payment()
    {
        $pixPayment = $this->pixService->generatePixPayment(
            user: $this->user,
            amount: 99.90,
            description: 'Teste de PIX'
        );

        $this->assertInstanceOf(PixPayment::class, $pixPayment);
        $this->assertEquals($this->user->id, $pixPayment->user_id);
        $this->assertEquals(99.90, $pixPayment->amount);
        $this->assertEquals('Teste de PIX', $pixPayment->description);
        $this->assertEquals('generated', $pixPayment->status);
        $this->assertNotNull($pixPayment->token);
        $this->assertNotNull($pixPayment->expires_at);
        
        $this->assertDatabaseHas('pix_payments', [
            'user_id' => $this->user->id,
            'amount' => 99.90,
            'status' => 'generated'
        ]);
    }

    public function test_it_generates_unique_token_for_each_pix()
    {
        $pix1 = $this->pixService->generatePixPayment($this->user, 10.00);
        $pix2 = $this->pixService->generatePixPayment($this->user, 20.00);

        $this->assertNotEquals($pix1->token, $pix2->token);
        $this->assertTrue(\Illuminate\Support\Str::isUuid($pix1->token));
        $this->assertTrue(\Illuminate\Support\Str::isUuid($pix2->token));
    }

    public function test_it_sets_expiration_time_correctly()
    {
        config(['pix.expiration_minutes' => 15]);
        $beforeGeneration = Carbon::now();

        $pixPayment = $this->pixService->generatePixPayment($this->user, 50.00);

        $expectedExpiration = $beforeGeneration->addMinutes(15);
        $this->assertTrue(
            $pixPayment->expires_at->between(
                $expectedExpiration->subSeconds(5),
                $expectedExpiration->addSeconds(5)
            )
        );
    }

    public function test_it_can_generate_pix_without_amount_and_description()
    {
        $pixPayment = $this->pixService->generatePixPayment($this->user);

        $this->assertEquals(0, $pixPayment->amount);
        $this->assertNull($pixPayment->description);
        $this->assertEquals('generated', $pixPayment->status);
    }

    public function test_user_can_have_multiple_pix_payments()
    {
        $pix1 = $this->pixService->generatePixPayment($this->user, 10.00);
        $pix2 = $this->pixService->generatePixPayment($this->user, 20.00);
        $pix3 = $this->pixService->generatePixPayment($this->user, 30.00);

        $this->assertEquals(3, $this->user->pixPayments()->count());
        
        $amounts = $this->user->pixPayments()->pluck('amount')->toArray();
        $this->assertContains(10.00, $amounts);
        $this->assertContains(20.00, $amounts);
        $this->assertContains(30.00, $amounts);
    }
}