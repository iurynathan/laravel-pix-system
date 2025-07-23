<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Exceptions\PixPaymentException;
use Exception;

class PixPaymentExceptionTest extends TestCase
{
    public function test_exception_can_be_created_with_message(): void
    {
        $exception = new PixPaymentException('Test message');

        $this->assertEquals('Test message', $exception->getMessage());
        $this->assertEquals(0, $exception->getCode());
        $this->assertNull($exception->getPrevious());
    }

    public function test_exception_can_be_created_with_custom_code(): void
    {
        $exception = new PixPaymentException('Test message', 422);

        $this->assertEquals('Test message', $exception->getMessage());
        $this->assertEquals(422, $exception->getCode());
    }

    public function test_exception_can_be_created_with_previous_exception(): void
    {
        $previous = new Exception('Previous exception');
        $exception = new PixPaymentException('Test message', 500, $previous);

        $this->assertEquals('Test message', $exception->getMessage());
        $this->assertEquals(500, $exception->getCode());
        $this->assertSame($previous, $exception->getPrevious());
    }

    public function test_exception_render_method_returns_json_response(): void
    {
        $exception = new PixPaymentException('Test error message', 500);
        
        $response = $exception->render();

        $this->assertEquals(422, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertFalse($content['success']);
        $this->assertEquals('Test error message', $content['message']);
        $this->assertEquals(500, $content['code']);
    }

    public function test_exception_render_method_with_default_status_code(): void
    {
        $exception = new PixPaymentException('Default error');
        
        $response = $exception->render();

        $this->assertEquals(422, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertFalse($content['success']);
        $this->assertEquals('Default error', $content['message']);
        $this->assertEquals(0, $content['code']);
    }
}