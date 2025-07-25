<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\PixPayment;
use App\Models\User;
use App\Services\PixService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PixPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private PixService $pixService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->pixService = app(PixService::class);
    }

    public function test_dashboard_loads_under_300ms_with_1000_records(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->count(1000)->create(['user_id' => $user->id]);

        $startTime = microtime(true);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/pix/statistics');

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(300, $executionTime, 
            "Dashboard took {$executionTime}ms, should be under 300ms");
    }

    public function test_pix_listing_performance_with_1000_records(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->count(1000)->create(['user_id' => $user->id]);

        $startTime = microtime(true);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/pix?per_page=50');

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(300, $executionTime,
            "PIX listing with 1000 records took {$executionTime}ms, should be under 300ms");
    }

    public function test_search_performance_with_large_dataset(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->count(1000)->create([
            'user_id' => $user->id,
            'description' => 'Pagamento teste'
        ]);

        $startTime = microtime(true);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/pix?search=teste&per_page=10');

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(150, $executionTime,
            "Search took {$executionTime}ms, should be under 150ms");
    }

    public function test_statistics_cache_performance(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->count(100)->create(['user_id' => $user->id]);

        $startTime = microtime(true);
        $this->pixService->getUserStatistics($user);
        $firstCallTime = microtime(true) - $startTime;

        $startTime = microtime(true);
        $this->pixService->getUserStatistics($user);
        $secondCallTime = microtime(true) - $startTime;

        $this->assertLessThan($firstCallTime, $secondCallTime);
        $this->assertLessThan(0.01, $secondCallTime);
    }

    public function test_memory_usage_with_large_dataset(): void
    {
        $user = User::factory()->create();
        
        PixPayment::factory()->count(2000)->create(['user_id' => $user->id]);

        $initialMemory = memory_get_usage(true);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/pix?per_page=50');

        $finalMemory = memory_get_usage(true);
        $memoryUsed = ($finalMemory - $initialMemory) / 1024 / 1024;

        $response->assertStatus(200);
        $this->assertLessThan(16, $memoryUsed, 
            "Memory usage was {$memoryUsed}MB, should be under 16MB");
    }
}