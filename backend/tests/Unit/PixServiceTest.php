<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PixService;
use App\Models\PixPayment;
use App\Models\User;
use App\Exceptions\PixPaymentException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Exception;

class PixServiceTest extends TestCase
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

    public function test_generate_pix_payment_successfully(): void
    {
        Log::shouldReceive('info')->once();

        $pix = $this->pixService->generatePixPayment($this->user, 100.50, 'Test payment');

        $this->assertInstanceOf(PixPayment::class, $pix);
        $this->assertEquals($this->user->id, $pix->user_id);
        $this->assertEquals(100.50, $pix->amount);
        $this->assertEquals('Test payment', $pix->description);
        $this->assertEquals('generated', $pix->status);
        $this->assertNotNull($pix->token);
        $this->assertNotNull($pix->expires_at);
    }

    public function test_generate_pix_payment_without_amount_and_description(): void
    {
        Log::shouldReceive('info')->once();

        $pix = $this->pixService->generatePixPayment($this->user);

        $this->assertEquals(0, $pix->amount);
        $this->assertNull($pix->description);
        $this->assertEquals('generated', $pix->status);
    }

    public function test_generate_pix_payment_throws_exception_on_database_error(): void
    {
        Log::shouldReceive('error')->once();
        
        DB::shouldReceive('transaction')->andThrow(new Exception('Database error'));

        $this->expectException(PixPaymentException::class);
        $this->expectExceptionMessage('Falha ao gerar cobrança PIX: Database error');

        $this->pixService->generatePixPayment($this->user, 100);
    }

    public function test_confirm_payment_with_nonexistent_token(): void
    {
        $result = $this->pixService->confirmPayment('nonexistent-token');

        $this->assertFalse($result['success']);
        $this->assertEquals('PIX não encontrado', $result['message']);
        $this->assertEquals('not_found', $result['status']);
    }

    public function test_confirm_payment_with_expired_pix(): void
    {
        Log::shouldReceive('info')->once();

        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'expires_at' => Carbon::now()->subMinutes(1),
            'status' => 'generated'
        ]);

        $result = $this->pixService->confirmPayment($pix->token);

        $this->assertFalse($result['success']);
        $this->assertEquals('PIX expirado', $result['message']);
        $this->assertEquals('expired', $result['status']);
        $this->assertArrayHasKey('pix', $result);
        
        $pix->refresh();
        $this->assertEquals('expired', $pix->status);
    }

    public function test_confirm_payment_with_already_paid_pix(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'paid_at' => Carbon::now()
        ]);

        $result = $this->pixService->confirmPayment($pix->token);

        $this->assertTrue($result['success']);
        $this->assertEquals('PIX já foi pago anteriormente', $result['message']);
        $this->assertEquals('already_paid', $result['status']);
        $this->assertArrayHasKey('pix', $result);
    }

    public function test_confirm_payment_successfully(): void
    {
        Log::shouldReceive('info')->once();

        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $result = $this->pixService->confirmPayment($pix->token);

        $this->assertTrue($result['success']);
        $this->assertEquals('Pagamento confirmado com sucesso!', $result['message']);
        $this->assertEquals('paid', $result['status']);
        $this->assertArrayHasKey('pix', $result);
        
        $pix->refresh();
        $this->assertEquals('paid', $pix->status);
        $this->assertNotNull($pix->paid_at);
    }

    public function test_confirm_payment_handles_database_exception(): void
    {
        Log::shouldReceive('error')->once();
        
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        DB::shouldReceive('transaction')->andThrow(new Exception('Database error'));

        $result = $this->pixService->confirmPayment($pix->token);

        $this->assertFalse($result['success']);
        $this->assertEquals('Erro interno ao confirmar pagamento', $result['message']);
        $this->assertEquals('internal_error', $result['status']);
    }

    public function test_process_expired_pix_payments_successfully(): void
    {
        Log::shouldReceive('info')->once();

        PixPayment::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->subMinutes(1)
        ]);

        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'expires_at' => Carbon::now()->addMinutes(15)
        ]);

        $expiredCount = $this->pixService->processExpiredPixPayments();

        $this->assertEquals(3, $expiredCount);
        $this->assertEquals(3, PixPayment::where('status', 'expired')->count());
        $this->assertEquals(1, PixPayment::where('status', 'generated')->count());
    }

    public function test_process_expired_pix_payments_handles_exception(): void
    {
        Log::shouldReceive('error')->once();

        $this->mock(PixPayment::class, function ($mock) {
            $mock->shouldReceive('expired')->andThrow(new Exception('Database error'));
        });

        $expiredCount = $this->pixService->processExpiredPixPayments();

        $this->assertEquals(0, $expiredCount);
    }

    public function test_get_system_statistics(): void
    {
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100
        ]);
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'amount' => 200
        ]);
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'expired',
            'amount' => 50
        ]);

        $stats = $this->pixService->getSystemStatistics();

        $this->assertEquals(3, $stats['total_pix']);
        $this->assertEquals(1, $stats['generated']);
        $this->assertEquals(1, $stats['paid']);
        $this->assertEquals(1, $stats['expired']);
        $this->assertEquals(200.0, $stats['total_amount']);
        $this->assertEquals(33.33, $stats['conversion_rate']);
    }

    public function test_get_system_statistics_with_no_payments(): void
    {
        $stats = $this->pixService->getSystemStatistics();

        $this->assertEquals(0, $stats['total_pix']);
        $this->assertEquals(0, $stats['generated']);
        $this->assertEquals(0, $stats['paid']);
        $this->assertEquals(0, $stats['expired']);
        $this->assertEquals(0.0, $stats['total_amount']);
        $this->assertEquals(0, $stats['conversion_rate']);
    }

    public function test_get_system_statistics_with_filters(): void
    {
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100,
            'description' => 'Test payment'
        ]);
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'amount' => 200,
            'description' => 'Another payment'
        ]);

        // Test with status filter
        $stats = $this->pixService->getSystemStatistics(['status' => 'paid']);
        $this->assertEquals(1, $stats['total_pix']);
        $this->assertEquals(0, $stats['generated']);
        $this->assertEquals(1, $stats['paid']);

        // Test with search filter
        $stats = $this->pixService->getSystemStatistics(['search' => 'Test']);
        $this->assertEquals(1, $stats['total_pix']);
        $this->assertEquals(1, $stats['generated']);
        $this->assertEquals(0, $stats['paid']);
    }

    public function test_get_user_statistics(): void
    {
        $otherUser = User::factory()->create();
        
        // User payments
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100
        ]);
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'amount' => 200
        ]);
        
        // Other user payment (should not be included)
        PixPayment::factory()->create([
            'user_id' => $otherUser->id,
            'status' => 'paid',
            'amount' => 300
        ]);

        $stats = $this->pixService->getUserStatistics($this->user);

        $this->assertEquals(2, $stats['total_pix']);
        $this->assertEquals(1, $stats['generated']);
        $this->assertEquals(1, $stats['paid']);
        $this->assertEquals(0, $stats['expired']);
        $this->assertEquals(200.0, $stats['total_amount']);
        $this->assertEquals(50.0, $stats['conversion_rate']);
    }

    public function test_get_user_statistics_with_filters(): void
    {
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100,
            'description' => 'Test payment'
        ]);
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'paid',
            'amount' => 200,
            'description' => 'Another payment'
        ]);

        // Test with status filter
        $stats = $this->pixService->getUserStatistics($this->user, ['status' => 'generated']);
        $this->assertEquals(1, $stats['total_pix']);
        $this->assertEquals(1, $stats['generated']);
        $this->assertEquals(0, $stats['paid']);

        // Test with search filter
        $stats = $this->pixService->getUserStatistics($this->user, ['search' => 'Test']);
        $this->assertEquals(1, $stats['total_pix']);
        $this->assertEquals(1, $stats['generated']);
        $this->assertEquals(0, $stats['paid']);
    }

    public function test_get_timeline_data_structure(): void
    {
        // Create some test data
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100
        ]);

        // Mock the cache to avoid MySQL CONVERT_TZ function in SQLite tests
        Cache::shouldReceive('remember')
            ->once()
            ->andReturn([
                [
                    'date' => '2025-01-25',
                    'generated' => 1,
                    'paid' => 0,
                    'expired' => 0,
                    'total' => 1,
                    'amount' => 100.0
                ]
            ]);

        $timeline = $this->pixService->getTimelineData($this->user, 1);

        $this->assertIsArray($timeline);
        $this->assertArrayHasKey('date', $timeline[0]);
        $this->assertArrayHasKey('generated', $timeline[0]);
        $this->assertArrayHasKey('paid', $timeline[0]);
        $this->assertArrayHasKey('expired', $timeline[0]);
        $this->assertArrayHasKey('total', $timeline[0]);
        $this->assertArrayHasKey('amount', $timeline[0]);
    }

    public function test_get_system_timeline_data_structure(): void
    {
        $otherUser = User::factory()->create();
        
        PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'generated',
            'amount' => 100
        ]);

        // Mock the cache to avoid MySQL CONVERT_TZ function in SQLite tests
        Cache::shouldReceive('remember')
            ->once()
            ->andReturn([
                [
                    'date' => '2025-01-25',
                    'generated' => 1,
                    'paid' => 0,
                    'expired' => 0,
                    'total' => 1,
                    'amount' => 100.0
                ]
            ]);

        $timeline = $this->pixService->getSystemTimelineData(1);

        $this->assertIsArray($timeline);
        $this->assertArrayHasKey('date', $timeline[0]);
        $this->assertArrayHasKey('generated', $timeline[0]);
        $this->assertArrayHasKey('paid', $timeline[0]);
        $this->assertArrayHasKey('expired', $timeline[0]);
        $this->assertArrayHasKey('total', $timeline[0]);
        $this->assertArrayHasKey('amount', $timeline[0]);
    }

    public function test_clear_statistics_cache(): void
    {
        Cache::shouldReceive('flush')->once();
        
        $this->pixService->clearStatisticsCache();
        
        // Test passes if no exception is thrown and cache flush is called
        $this->assertTrue(true);
    }
}