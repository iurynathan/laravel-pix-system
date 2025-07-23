<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Return a standardized success response
     */
    protected function successResponse(
        mixed $data = null, 
        string $message = 'Operação realizada com sucesso', 
        int $status = 200
    ): JsonResponse {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $status);
    }

    /**
     * Return a standardized error response
     */
    protected function errorResponse(
        string $message = 'Ocorreu um erro', 
        mixed $errors = null, 
        int $status = 400
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }
}