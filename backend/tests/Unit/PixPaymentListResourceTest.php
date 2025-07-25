<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Resources\PixPaymentListResource;
use App\Models\PixPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class PixPaymentListResourceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create(['is_admin' => false]);
        $this->admin = User::factory()->create(['is_admin' => true]);
    }

    public function test_resource_for_regular_user(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 100.50,
            'description' => 'Test payment'
        ]);

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->user);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertEquals($pix->id, $result['id']);
        $this->assertEquals($pix->token, $result['token']);
        $this->assertEquals(100.50, $result['amount']);
        $this->assertEquals('Test payment', $result['description']);
        $this->assertEquals($pix->status, $result['status']);
        $this->assertArrayNotHasKey('user', $result);
        $this->assertArrayHasKey('qr_code_url', $result);
        $this->assertStringContainsString($pix->token, $result['qr_code_url']);
    }

    public function test_resource_for_admin_with_user_loaded(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 200.75,
            'description' => 'Admin test payment'
        ]);

        // Load the user relationship
        $pix->load('user');

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->admin);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertEquals($pix->id, $result['id']);
        $this->assertEquals($pix->token, $result['token']);
        $this->assertEquals(200.75, $result['amount']);
        $this->assertEquals('Admin test payment', $result['description']);
        $this->assertEquals($pix->status, $result['status']);
        
        // Admin should see user data when relationship is loaded
        $this->assertArrayHasKey('user', $result);
        $this->assertEquals($this->user->id, $result['user']['id']);
        $this->assertEquals($this->user->name, $result['user']['name']);
        $this->assertEquals($this->user->email, $result['user']['email']);
    }

    public function test_resource_for_admin_without_user_loaded(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 150.25,
            'description' => 'Admin test without user'
        ]);

        // Don't load the user relationship
        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->admin);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertEquals($pix->id, $result['id']);
        $this->assertEquals($pix->token, $result['token']);
        $this->assertEquals(150.25, $result['amount']);
        
        // Admin should not see user data when relationship is not loaded
        $this->assertArrayNotHasKey('user', $result);
    }

    public function test_resource_for_admin_with_null_user(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 75.00,
            'description' => 'Test with null user'
        ]);

        // Simulate a scenario where user relationship is loaded but is null
        $pix->setRelation('user', null);

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->admin);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertEquals($pix->id, $result['id']);
        $this->assertEquals($pix->token, $result['token']);
        $this->assertEquals(75.00, $result['amount']);
        
        // Should not include user data when user is null
        $this->assertArrayNotHasKey('user', $result);
    }

    public function test_resource_handles_null_dates(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'paid_at' => null
        ]);

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->user);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertNull($result['paid_at']);
        $this->assertNotNull($result['expires_at']);
        $this->assertNotNull($result['created_at']);
        $this->assertNotNull($result['updated_at']);
    }

    public function test_resource_formats_dates_correctly(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'paid_at' => now()
        ]);

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->user);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        // Check that dates are in ISO format (allow for timezone and milliseconds variations)
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $result['expires_at']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $result['paid_at']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $result['created_at']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $result['updated_at']);
    }

    public function test_resource_without_authenticated_user(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'amount' => 50.00
        ]);

        $request = Request::create('/api/pix');
        // No user set in request

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertEquals($pix->id, $result['id']);
        $this->assertEquals(50.00, $result['amount']);
        
        // Should not include user data when no authenticated user
        $this->assertArrayNotHasKey('user', $result);
    }

    public function test_qr_code_url_generation(): void
    {
        $pix = PixPayment::factory()->create([
            'user_id' => $this->user->id,
            'token' => 'test-token-12345'
        ]);

        $request = Request::create('/api/pix');
        $request->setUserResolver(fn() => $this->user);

        $resource = new PixPaymentListResource($pix);
        $result = $resource->toArray($request);

        $this->assertArrayHasKey('qr_code_url', $result);
        $this->assertStringContainsString('test-token-12345', $result['qr_code_url']);
        $this->assertStringContainsString('/api/pix/qrcode/', $result['qr_code_url']);
    }
}