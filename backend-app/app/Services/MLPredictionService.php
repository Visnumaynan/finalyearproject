<?php

namespace App\Services;

use App\Exceptions\FeatureMismatchException;
use App\Exceptions\MLPredictionException;
use App\Models\Alert;
use App\Models\BloodTest;
use App\Models\DerivedFeature;
use App\Models\RiskPrediction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLPredictionService
{
    /** Required keys from BloodTest::toFeatureArray() — must all be present before calling FastAPI */
    private const REQUIRED_FEATURES = [
        'has_fatty_liver',
        'bmi', 'waist_circumference', 'body_weight',
        'alt', 'ast',
    ];

    private const RISK_ORDER = ['Low' => 1, 'Medium' => 2, 'High' => 3];

    private string $baseUrl;

    private int $timeout;

    private string $internalToken;

    public function __construct()
    {
        $this->baseUrl = config('services.fastapi.url');
        $this->timeout = config('services.fastapi.timeout');
        $this->internalToken = config('services.fastapi.token');
    }

    /**
     * Full pipeline: store derived features → call FastAPI → store prediction → maybe alert.
     *
     * @throws MLPredictionException
     * @throws FeatureMismatchException
     */
    public function processBloodTest(BloodTest $bloodTest): RiskPrediction
    {
        $features = $bloodTest->toFeatureArray();
        $this->validateFeatureKeys($features);

        $this->storeDerivedFeatures($bloodTest, $features);

        $startMs = (int) round(microtime(true) * 1000);
        $response = $this->callFastApi($features);
        $elapsedMs = (int) round(microtime(true) * 1000) - $startMs;

        $prediction = RiskPrediction::create([
            'user_id' => $bloodTest->user_id,
            'blood_test_id' => $bloodTest->id,
            'risk_score' => $response['probability'],
            'risk_level' => ucfirst(strtolower($response['risk'])),
            'model_used' => 'nafld_lgbm_v1',
            'prediction_date' => now(),
            'fastapi_response_ms' => $elapsedMs,
            'feature_snapshot' => $features,
        ]);

        $this->maybeCreateAlert($bloodTest->user_id, $prediction);

        Log::info('NAFLD prediction stored', [
            'user_id' => $bloodTest->user_id,
            'prediction_id' => $prediction->id,
            'risk_level' => $prediction->risk_level,
            'risk_score' => $prediction->risk_score,
            'response_ms' => $elapsedMs,
        ]);

        return $prediction;
    }

    /**
     * Verify FastAPI is reachable.
     */
    public function healthCheck(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");

            return $response->ok();
        } catch (\Exception $e) {
            Log::warning('FastAPI health check failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * @param  array<string, float|null>  $features
     *
     * @throws FeatureMismatchException
     */
    private function validateFeatureKeys(array $features): void
    {
        $missing = array_values(array_diff(self::REQUIRED_FEATURES, array_keys($features)));
        if (! empty($missing)) {
            throw new FeatureMismatchException($missing);
        }
    }

    /**
     * Compute and persist derived features.
     * Values arrive in mg/dL (suffixed _mgdl); convert to mmol/L for TYG formula
     * which must match the notebook: TYG = ln(TG_mmol × Glucose_mmol / 2).
     *
     * @param  array<string, float|null>  $features
     */
    private function storeDerivedFeatures(BloodTest $bloodTest, array $features): void
    {
        $tgMgdl = $features['triglycerides_mgdl'] ?? null;
        $hdlMgdl = $features['hdl_mgdl'] ?? null;
        $glucoseMgdl = $features['fasting_glucose_mgdl'] ?? null;
        $bmi = $features['bmi'] ?? null;
        $waist = $features['waist_circumference'] ?? null;

        // Convert to mmol/L — same conversion factors as model.py
        $tgMmol = $tgMgdl ? $tgMgdl / 88.57 : null;
        $hdlMmol = $hdlMgdl ? $hdlMgdl / 38.67 : null;
        $glucoseMmol = $glucoseMgdl ? $glucoseMgdl / 18.0 : null;

        // TYG = ln(TG_mmol × Glucose_mmol / 2) — matches notebook exactly
        $tygIndex = ($tgMmol && $glucoseMmol && $tgMmol > 0 && $glucoseMmol > 0)
            ? log($tgMmol * $glucoseMmol / 2)
            : null;

        $tgHdlRatio = ($tgMmol && $hdlMmol && $hdlMmol > 0) ? $tgMmol / $hdlMmol : null;
        $tygBmi = ($tygIndex !== null && $bmi) ? $tygIndex * $bmi : null;

        DerivedFeature::updateOrCreate(
            ['blood_test_id' => $bloodTest->id],
            [
                'tyg_index' => $tygIndex,
                'tg_hdl_ratio' => $tgHdlRatio,
                'tyg_bmi' => $tygBmi,
            ]
        );
    }

    /**
     * POST to FastAPI /predict with full error handling.
     *
     * @param  array<string, float|null>  $features
     * @return array{prediction: int, probability: float, risk: string}
     *
     * @throws MLPredictionException
     */
    private function callFastApi(array $features): array
    {
        try {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Internal-Token' => $this->internalToken,
                ])
                ->post("{$this->baseUrl}/predict", $features);

            if ($response->serverError()) {
                Log::error('FastAPI 5xx error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new MLPredictionException(
                    "FastAPI returned HTTP {$response->status()}: ".$response->body(),
                    502
                );
            }

            if ($response->clientError()) {
                Log::error('FastAPI 4xx – feature/validation error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new MLPredictionException(
                    'FastAPI rejected the input (HTTP '.$response->status().'). '.
                    'Possible feature mismatch or invalid values.',
                    422
                );
            }

            $data = $response->json();

            // Guard: ensure the contract is met
            if (
                ! isset($data['prediction'], $data['probability'], $data['risk']) ||
                ! is_numeric($data['probability']) ||
                ! in_array(strtoupper($data['risk']), ['LOW', 'MEDIUM', 'HIGH'], true)
            ) {
                Log::error('FastAPI returned malformed response', ['body' => $data]);
                throw new MLPredictionException('FastAPI returned an unexpected response structure.');
            }

            return [
                'prediction' => (int) $data['prediction'],
                'probability' => (float) $data['probability'],
                'risk' => strtoupper($data['risk']),
            ];

        } catch (ConnectionException $e) {
            Log::error('FastAPI unreachable', ['message' => $e->getMessage()]);
            throw new MLPredictionException(
                'The AI prediction service is currently unreachable. Blood test data has been saved; prediction will be retried.',
                503
            );
        }
    }

    /**
     * Create an Alert when risk escalates or crosses the high threshold.
     */
    private function maybeCreateAlert(int $userId, RiskPrediction $current): void
    {
        $previous = RiskPrediction::query()
            ->where('user_id', $userId)
            ->where('id', '!=', $current->id)
            ->latest('prediction_date')
            ->first();

        $currentLevel = self::RISK_ORDER[$current->risk_level] ?? 0;
        $previousLevel = $previous ? (self::RISK_ORDER[$previous->risk_level] ?? 0) : 0;

        // Always alert when HIGH
        if ($currentLevel >= 3) {
            Alert::create([
                'user_id' => $userId,
                'risk_prediction_id' => $current->id,
                'alert_type' => 'Critical',
                'previous_risk_level' => $previous?->risk_level ?? 'None',
                'current_risk_level' => $current->risk_level,
                'message' => 'Your NAFLD risk is assessed as HIGH. Please consult a physician immediately.',
                'is_read' => false,
            ]);

            return;
        }

        // Alert when risk has escalated from a lower level
        if ($currentLevel > $previousLevel) {
            Alert::create([
                'user_id' => $userId,
                'risk_prediction_id' => $current->id,
                'alert_type' => 'Warning',
                'previous_risk_level' => $previous?->risk_level ?? 'None',
                'current_risk_level' => $current->risk_level,
                'message' => "Your NAFLD risk has increased from {$previous?->risk_level} to {$current->risk_level}. Consider consulting a healthcare provider.",
                'is_read' => false,
            ]);
        }
    }
}
