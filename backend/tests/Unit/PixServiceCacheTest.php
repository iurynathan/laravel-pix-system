<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\PixPayment;
use App\Models\User;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PixServiceCacheTest extends TestCase
{
    use RefreshDatabase;

    private PixService $pixService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pixService = app(PixService::class);
    }

    public function test_system_statistics_are_cached(): void
    {
        $user = User::factory()->create();
        PixPayment::factory()->create(['user_id' => $user->id, 'status' => 'paid']);

        Cache::flush();

        $stats1 = $this->pixService->getSystemStatistics();
        $stats2 = $this->pixService->getSystemStatistics();

        $this->assertEquals($stats1, $stats2);
        $cacheKey = 'pix_system_statistics_' . md5(serialize([]));
        $this->assertTrue(Cache::has($cacheKey));
    }

    public function test_user_statistics_are_cached(): void
    {
        $user = User::factory()->create();
        PixPayment::factory()->create(['user_id' => $user->id, 'status' => 'paid']);

        Cache::flush();

        $stats1 = $this->pixService->getUserStatistics($user);
        $stats2 = $this->pixService->getUserStatistics($user);

        $this->assertEquals($stats1, $stats2);
        $cacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize([]));
        $this->assertTrue(Cache::has($cacheKey));
    }

    public function test_cache_is_cleared_when_pix_is_generated(): void
    {
        $user = User::factory()->create();
        
        $this->pixService->getUserStatistics($user);
        $cacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize([]));
        $this->assertTrue(Cache::has($cacheKey));

        $this->pixService->generatePixPayment($user, 100.0, 'Test PIX');

        $userCacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize([]));
        $systemCacheKey = 'pix_system_statistics_' . md5(serialize([]));
        $this->assertFalse(Cache::has($userCacheKey));
        $this->assertFalse(Cache::has($systemCacheKey));
    }

    public function test_cache_is_cleared_when_pix_is_confirmed(): void
    {
        $user = User::factory()->create();
        $pixPayment = PixPayment::factory()->create(['user_id' => $user->id]);

        $this->pixService->getUserStatistics($user);
        $cacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize([]));
        $this->assertTrue(Cache::has($cacheKey));

        $this->pixService->confirmPayment($pixPayment->token);

        $userCacheKey = "pix_user_statistics_{$user->id}_" . md5(serialize([]));
        $systemCacheKey = 'pix_system_statistics_' . md5(serialize([]));
        $this->assertFalse(Cache::has($userCacheKey));
        $this->assertFalse(Cache::has($systemCacheKey));
    }

    public function test_statistics_performance_improvement(): void
    {
        $user = User::factory()->create();
        PixPayment::factory()->count(100)->create(['user_id' => $user->id]);

        Cache::flush();

        $startTime = microtime(true);
        $this->pixService->getUserStatistics($user);
        $firstCallTime = microtime(true) - $startTime;

        $startTime = microtime(true);
        $this->pixService->getUserStatistics($user);
        $secondCallTime = microtime(true) - $startTime;

        $this->assertLessThan($firstCallTime, $secondCallTime);
        $this->assertLessThan(0.01, $secondCallTime);
    }
}