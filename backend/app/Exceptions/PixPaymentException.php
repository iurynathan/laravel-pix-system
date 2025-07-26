<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;

class PixPaymentException extends Exception
{
    public function __construct(
        string $message = 'Erro no pagamento PIX', 
        int $code = 0, 
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render()
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'code' => $this->getCode()
        ], 422);
    }
}