<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class MLPredictionException extends Exception
{
    public function __construct(string $message = 'ML service failed to return a prediction', int $code = 503)
    {
        parent::__construct($message, $code);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'ml_service_error',
            'message' => $this->getMessage(),
        ], $this->getCode() ?: 503);
    }
}
