<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class FeatureMismatchException extends Exception
{
    private array $missingFeatures;

    public function __construct(array $missingFeatures = [])
    {
        $this->missingFeatures = $missingFeatures;
        parent::__construct('Feature mismatch between training data and incoming request: '.implode(', ', $missingFeatures));
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'feature_mismatch',
            'message' => $this->getMessage(),
            'missing_features' => $this->missingFeatures,
        ], 500);
    }
}
