<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\BloodTest;
use App\Models\DerivedFeature;
use App\Models\RiskPrediction;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo User — James Anderson (42yo Male)
 *
 * 12-month clinical narrative:
 *   Months -12..-11 → Low risk    (healthy baseline)
 *   Months -10..-8  → Medium risk (lifestyle deterioration)
 *   Months  -7..-5  → High risk   (metabolic syndrome peak)
 *   Months  -4..-3  → Medium risk (treatment response)
 *   Months  -2..-1  → Low risk    (full recovery)
 *
 * Login: demo@livercare.test / password
 */
class DemoUserSeeder extends Seeder
{
    // ── helpers ──────────────────────────────────────────────────────────────────

    /** Compute TYG-derived features. */
    private function computeDerived(float $tg, float $fg, float $hdl, float $bmi): array
    {
        $tyg = log($tg * $fg / 2);

        return [
            'tyg_index' => round($tyg, 4),
            'tg_hdl_ratio' => round($tg / $hdl, 4),
            'tyg_bmi' => round($tyg * $bmi, 4),
        ];
    }

    /** Build feature_snapshot stored on the RiskPrediction. */
    private function featureSnapshot(array $t, int $sexCode, int $age): array
    {
        return [
            'sex' => $sexCode,
            'age' => $age,
            'has_fatty_liver' => $t['has_fatty_liver'] ? 1 : 0,
            'bmi' => $t['bmi'],
            'body_weight' => $t['body_weight'],
            'waist_circumference' => $t['waist_circumference'],
            'alt' => $t['alt'],
            'ast' => $t['ast'],
            'ggt' => $t['ggt'],
            'triglycerides_mgdl' => $t['triglycerides'],
            'hdl_mgdl' => $t['hdl'],
            'total_cholesterol_mgdl' => $t['total_cholesterol'],
            'fasting_glucose_mgdl' => $t['fasting_glucose'],
            'hba1c' => $t['hba1c'],
            'blood_pressure_systolic' => $t['blood_pressure_systolic'],
            'blood_pressure_diastolic' => $t['blood_pressure_diastolic'],
        ];
    }

    /** Choose alert type and message based on risk-level transition. */
    private function alertMeta(?string $prev, string $curr): array
    {
        $key = $prev ? "{$prev}→{$curr}" : 'first';

        return match ($key) {
            'Low→High', 'Medium→High' => ['Critical', "Risk escalated from {$prev} to {$curr}. Seek immediate medical attention."],
            'Low→Medium' => ['Warning',  'Risk elevated from Low to Medium. Consider consulting a healthcare provider.'],
            'High→Medium' => ['Warning',  'Risk reduced from High to Medium. Continue treatment and monitoring.'],
            'High→Low', 'Medium→Low' => ['Info',     "Risk returned to {$curr}. Excellent progress — keep up the healthy habits."],
            default => ['Info',     "Your latest liver risk assessment is available: {$curr} risk level."],
        };
    }

    // ── run ───────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        if (User::where('email', 'D')->exists()) {
            return;
        }

        // 12-month timeline — oldest entry first, newest last.
        // Values are clinically coherent: worse biomarkers correspond to higher scores.
        $timeline = [
            // ── LOW RISK (baseline) ──────────────────────────────────────────
            [
                'months_ago' => 12, 'risk_score' => 0.16,
                'bmi' => 23.1, 'body_weight' => 73.2, 'waist_circumference' => 84,
                'alt' => 22, 'ast' => 20, 'ggt' => 24,
                'triglycerides' => 95,  'hdl' => 65, 'total_cholesterol' => 178,
                'fasting_glucose' => 88, 'hba1c' => 5.2,
                'blood_pressure_systolic' => 118, 'blood_pressure_diastolic' => 76,
                'has_fatty_liver' => false,
            ],
            [
                'months_ago' => 11, 'risk_score' => 0.20,
                'bmi' => 23.4, 'body_weight' => 74.1, 'waist_circumference' => 85,
                'alt' => 25, 'ast' => 22, 'ggt' => 26,
                'triglycerides' => 102, 'hdl' => 62, 'total_cholesterol' => 182,
                'fasting_glucose' => 91, 'hba1c' => 5.3,
                'blood_pressure_systolic' => 120, 'blood_pressure_diastolic' => 78,
                'has_fatty_liver' => false,
            ],
            // ── MEDIUM RISK (deterioration) ──────────────────────────────────
            [
                'months_ago' => 10, 'risk_score' => 0.36,
                'bmi' => 25.6, 'body_weight' => 81.1, 'waist_circumference' => 91,
                'alt' => 38, 'ast' => 32, 'ggt' => 42,
                'triglycerides' => 148, 'hdl' => 48, 'total_cholesterol' => 208,
                'fasting_glucose' => 104, 'hba1c' => 5.7,
                'blood_pressure_systolic' => 128, 'blood_pressure_diastolic' => 84,
                'has_fatty_liver' => false,
            ],
            [
                'months_ago' => 9, 'risk_score' => 0.44,
                'bmi' => 26.8, 'body_weight' => 84.9, 'waist_circumference' => 94,
                'alt' => 48, 'ast' => 40, 'ggt' => 55,
                'triglycerides' => 168, 'hdl' => 44, 'total_cholesterol' => 218,
                'fasting_glucose' => 112, 'hba1c' => 5.9,
                'blood_pressure_systolic' => 133, 'blood_pressure_diastolic' => 87,
                'has_fatty_liver' => false,
            ],
            [
                'months_ago' => 8, 'risk_score' => 0.53,
                'bmi' => 28.2, 'body_weight' => 89.4, 'waist_circumference' => 98,
                'alt' => 58, 'ast' => 48, 'ggt' => 68,
                'triglycerides' => 185, 'hdl' => 41, 'total_cholesterol' => 228,
                'fasting_glucose' => 120, 'hba1c' => 6.1,
                'blood_pressure_systolic' => 138, 'blood_pressure_diastolic' => 90,
                'has_fatty_liver' => false,
            ],
            // ── HIGH RISK (metabolic syndrome peak) ──────────────────────────
            [
                'months_ago' => 7, 'risk_score' => 0.69,
                'bmi' => 30.5, 'body_weight' => 96.6, 'waist_circumference' => 103,
                'alt' => 78, 'ast' => 62, 'ggt' => 88,
                'triglycerides' => 225, 'hdl' => 36, 'total_cholesterol' => 248,
                'fasting_glucose' => 135, 'hba1c' => 6.6,
                'blood_pressure_systolic' => 145, 'blood_pressure_diastolic' => 94,
                'has_fatty_liver' => true,
            ],
            [
                'months_ago' => 6, 'risk_score' => 0.78,
                'bmi' => 32.1, 'body_weight' => 101.7, 'waist_circumference' => 108,
                'alt' => 98, 'ast' => 78, 'ggt' => 108,
                'triglycerides' => 258, 'hdl' => 31, 'total_cholesterol' => 268,
                'fasting_glucose' => 148, 'hba1c' => 7.2,
                'blood_pressure_systolic' => 152, 'blood_pressure_diastolic' => 98,
                'has_fatty_liver' => true,
            ],
            [
                'months_ago' => 5, 'risk_score' => 0.84,
                'bmi' => 33.4, 'body_weight' => 105.8, 'waist_circumference' => 112,
                'alt' => 110, 'ast' => 88, 'ggt' => 120,
                'triglycerides' => 272, 'hdl' => 29, 'total_cholesterol' => 278,
                'fasting_glucose' => 158, 'hba1c' => 7.8,
                'blood_pressure_systolic' => 158, 'blood_pressure_diastolic' => 102,
                'has_fatty_liver' => true,
            ],
            // ── MEDIUM RISK (treatment response) ─────────────────────────────
            [
                'months_ago' => 4, 'risk_score' => 0.61,
                'bmi' => 31.2, 'body_weight' => 98.8, 'waist_circumference' => 106,
                'alt' => 72, 'ast' => 58, 'ggt' => 82,
                'triglycerides' => 218, 'hdl' => 38, 'total_cholesterol' => 245,
                'fasting_glucose' => 132, 'hba1c' => 6.5,
                'blood_pressure_systolic' => 143, 'blood_pressure_diastolic' => 92,
                'has_fatty_liver' => true,
            ],
            [
                'months_ago' => 3, 'risk_score' => 0.47,
                'bmi' => 29.1, 'body_weight' => 92.2, 'waist_circumference' => 100,
                'alt' => 52, 'ast' => 44, 'ggt' => 62,
                'triglycerides' => 185, 'hdl' => 44, 'total_cholesterol' => 228,
                'fasting_glucose' => 118, 'hba1c' => 6.1,
                'blood_pressure_systolic' => 136, 'blood_pressure_diastolic' => 88,
                'has_fatty_liver' => false,
            ],
            // ── LOW RISK (recovery) ───────────────────────────────────────────
            [
                'months_ago' => 2, 'risk_score' => 0.26,
                'bmi' => 26.4, 'body_weight' => 83.6, 'waist_circumference' => 92,
                'alt' => 35, 'ast' => 28, 'ggt' => 38,
                'triglycerides' => 128, 'hdl' => 54, 'total_cholesterol' => 198,
                'fasting_glucose' => 98, 'hba1c' => 5.6,
                'blood_pressure_systolic' => 124, 'blood_pressure_diastolic' => 82,
                'has_fatty_liver' => false,
            ],
            [
                'months_ago' => 1, 'risk_score' => 0.18,
                'bmi' => 24.2, 'body_weight' => 76.7, 'waist_circumference' => 86,
                'alt' => 26, 'ast' => 22, 'ggt' => 28,
                'triglycerides' => 105, 'hdl' => 62, 'total_cholesterol' => 185,
                'fasting_glucose' => 90, 'hba1c' => 5.3,
                'blood_pressure_systolic' => 119, 'blood_pressure_diastolic' => 77,
                'has_fatty_liver' => false,
            ],
        ];

        // ── create the demo user ───────────────────────────────────────────────
        $user = User::factory()->create([
            'name' => 'James Anderson',
            'email' => 'demo@livercare.test',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'sex' => 'Male',
            'date_of_birth' => Carbon::now()->subYears(42)->subMonths(3)->toDateString(),
            'height' => 178,
        ]);

        $sexCode = 0; // Male = 0 per toFeatureArray()
        $age = 42;
        $prevLevel = null;

        foreach ($timeline as $t) {
            $testDate = Carbon::now()
                ->subMonths($t['months_ago'])
                ->startOfMonth()
                ->toDateString();

            $bt = BloodTest::create([
                'user_id' => $user->id,
                'test_date' => $testDate,
                'alt' => $t['alt'],
                'ast' => $t['ast'],
                'ggt' => $t['ggt'],
                'triglycerides' => $t['triglycerides'],
                'hdl' => $t['hdl'],
                'total_cholesterol' => $t['total_cholesterol'],
                'fasting_glucose' => $t['fasting_glucose'],
                'hba1c' => $t['hba1c'],
                'bmi' => $t['bmi'],
                'body_weight' => $t['body_weight'],
                'waist_circumference' => $t['waist_circumference'],
                'blood_pressure_systolic' => $t['blood_pressure_systolic'],
                'blood_pressure_diastolic' => $t['blood_pressure_diastolic'],
                'has_fatty_liver' => $t['has_fatty_liver'],
            ]);

            $derived = $this->computeDerived(
                $t['triglycerides'],
                $t['fasting_glucose'],
                $t['hdl'],
                $t['bmi'],
            );

            DerivedFeature::create([
                'blood_test_id' => $bt->id,
                'tyg_index' => $derived['tyg_index'],
                'tg_hdl_ratio' => $derived['tg_hdl_ratio'],
                'tyg_bmi' => $derived['tyg_bmi'],
            ]);

            $score = (float) $t['risk_score'];
            $level = match (true) {
                $score >= 0.67 => 'High',
                $score >= 0.33 => 'Medium',
                default => 'Low',
            };

            $prediction = RiskPrediction::create([
                'user_id' => $user->id,
                'blood_test_id' => $bt->id,
                'risk_score' => $score,
                'risk_level' => $level,
                'model_used' => 'insulin_resistance_v1',
                'prediction_date' => $testDate,
                'fastapi_response_ms' => rand(140, 680),
                'feature_snapshot' => $this->featureSnapshot($t, $sexCode, $age),
            ]);

            [$alertType, $message] = $this->alertMeta($prevLevel, $level);

            Alert::create([
                'user_id' => $user->id,
                'risk_prediction_id' => $prediction->id,
                'alert_type' => $alertType,
                'previous_risk_level' => $prevLevel,
                'current_risk_level' => $level,
                'message' => $message,
                'is_read' => $t['months_ago'] > 2,
            ]);

            $prevLevel = $level;
        }
    }
}
