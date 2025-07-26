<?php

declare(strict_types=1);

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use ReflectionClass;

class ControllerTest extends TestCase
{
    private Controller $controller;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Criar uma instância anônima do Controller abstrato para testes
        $this->controller = new class extends Controller {
            public function testSuccessResponse($data = null, $message = 'Operação realizada com sucesso', $status = 200): JsonResponse {
                return $this->successResponse($data, $message, $status);
            }
            
            public function testErrorResponse($message = 'Ocorreu um erro', $errors = null, $status = 400): JsonResponse {
                return $this->errorResponse($message, $errors, $status);
            }
        };
    }

    public function test_success_response_with_data(): void
    {
        $data = ['id' => 1, 'name' => 'Test'];
        $message = 'Dados recuperados com sucesso';
        $status = 200;

        $response = $this->controller->testSuccessResponse($data, $message, $status);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals($status, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($message, $responseData['message']);
        $this->assertEquals($data, $responseData['data']);
    }

    public function test_success_response_without_data(): void
    {
        $message = 'Operação realizada com sucesso';
        $status = 201;

        $response = $this->controller->testSuccessResponse(null, $message, $status);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals($status, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($message, $responseData['message']);
        $this->assertArrayNotHasKey('data', $responseData);
    }

    public function test_success_response_with_default_parameters(): void
    {
        $response = $this->controller->testSuccessResponse();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals('Operação realizada com sucesso', $responseData['message']);
        $this->assertArrayNotHasKey('data', $responseData);
    }

    public function test_error_response_with_errors(): void
    {
        $message = 'Erro de validação';
        $errors = ['email' => ['O email é obrigatório']];
        $status = 422;

        $response = $this->controller->testErrorResponse($message, $errors, $status);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals($status, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals($message, $responseData['message']);
        $this->assertEquals($errors, $responseData['errors']);
    }

    public function test_error_response_without_errors(): void
    {
        $message = 'Erro interno do servidor';
        $status = 500;

        $response = $this->controller->testErrorResponse($message, null, $status);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals($status, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals($message, $responseData['message']);
        $this->assertArrayNotHasKey('errors', $responseData);
    }

    public function test_error_response_with_default_parameters(): void
    {
        $response = $this->controller->testErrorResponse();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(400, $response->getStatusCode());
        
        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals('Ocorreu um erro', $responseData['message']);
        $this->assertArrayNotHasKey('errors', $responseData);
    }

    public function test_success_response_with_empty_array_data(): void
    {
        $data = [];
        $response = $this->controller->testSuccessResponse($data);

        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($data, $responseData['data']);
        $this->assertArrayHasKey('data', $responseData);
    }

    public function test_success_response_with_zero_as_data(): void
    {
        $data = 0;
        $response = $this->controller->testSuccessResponse($data);

        $responseData = json_decode($response->getContent(), true);
        $this->assertTrue($responseData['success']);
        $this->assertEquals($data, $responseData['data']);
        $this->assertArrayHasKey('data', $responseData);
    }

    public function test_error_response_with_empty_array_errors(): void
    {
        $errors = [];
        $response = $this->controller->testErrorResponse('Erro', $errors);

        $responseData = json_decode($response->getContent(), true);
        $this->assertFalse($responseData['success']);
        $this->assertEquals($errors, $responseData['errors']);
        $this->assertArrayHasKey('errors', $responseData);
    }
}