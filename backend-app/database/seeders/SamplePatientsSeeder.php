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
 * Five diverse patient profiles covering the full risk spectrum:
 *
 *  1. Sarah Young    — 28F  Always Low (healthy young female)
 *  2. Robert Chen    — 55M  Always High (established metabolic syndrome)
 *  3. Maria Santos   — 45F  Worsening   (Low → Medium → High over 8 months)
 *  4. David Kim      — 38M  Improving   (High → Medium → Low over 8 months)
 *  5. Priya Patel    — 50F  Borderline  (oscillating Medium)
 */
class SamplePatientsSeeder extends Seeder
{
    // ── helpers ──────────────────────────────────────────────────────────────────

    private function computeDerived(float $tg, float $fg, float $hdl, float $bmi): array
    {
        $tyg = log($tg * $fg / 2);

        return [
            'tyg_index' => round($tyg, 4),
            'tg_hdl_ratio' => round($tg / $hdl, 4),
            'tyg_bmi' => round($tyg * $bmi, 4),
        ];
    }

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

    /**
     * Create one patient with their full test history.
     *
     * @param  array<string, mixed>  $profile  User + profile details
     * @param  array<int, array<string, mixed>>  $tests  Timeline (oldest first)
     */
    private function createPatient(array $profile, array $tests): void
    {
        if (User::where('email', $profile['email'])->exists()) {
            return;
        }

        $user = User::factory()->create([
            'name' => $profile['name'],
            'email' => $profile['email'],
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        UserProfile::create([
            'user_id' => $user->id,
            'sex' => $profile['sex'],
            'date_of_birth' => Carbon::now()->subYears($profile['age'])->toDateString(),
            'height' => $profile['height'],
        ]);

        $sexCode = $profile['sex'] === 'Male' ? 0 : 1;
        $age = $profile['age'];
        $prevLevel = null;

        foreach ($tests as $t) {
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
                'fastapi_response_ms' => rand(140, 750),
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
                'is_read' => $t['months_ago'] > 1,
            ]);

            $prevLevel = $level;
        }
    }

    // ── run ───────────────────────────────────────────────────────────────────────

    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════════════
        // 1. SARAH YOUNG — 28F — Always Low Risk (consistently healthy)
        // ══════════════════════════════════════════════════════════════════════
        $this->createPatient(
            ['name' => 'Sarah Young', 'email' => 'sarah@livercare.test', 'sex' => 'Female', 'age' => 28, 'height' => 165],
            [
                [
                    'months_ago' => 6, 'risk_score' => 0.12,
                    'bmi' => 21.4, 'body_weight' => 58.2, 'waist_circumference' => 72,
                    'alt' => 18, 'ast' => 16, 'ggt' => 18,
                    'triglycerides' => 78,  'hdl' => 72, 'total_cholesterol' => 162,
                    'fasting_glucose' => 82, 'hba1c' => 5.1,
                    'blood_pressure_systolic' => 112, 'blood_pressure_diastolic' => 72,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 5, 'risk_score' => 0.10,
                    'bmi' => 21.2, 'body_weight' => 57.8, 'waist_circumference' => 71,
                    'alt' => 16, 'ast' => 15, 'ggt' => 17,
                    'triglycerides' => 72,  'hdl' => 75, 'total_cholesterol' => 158,
                    'fasting_glucose' => 80, 'hba1c' => 5.0,
                    'blood_pressure_systolic' => 110, 'blood_pressure_diastolic' => 70,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 4, 'risk_score' => 0.14,
                    'bmi' => 21.6, 'body_weight' => 58.8, 'waist_circumference' => 73,
                    'alt' => 19, 'ast' => 17, 'ggt' => 19,
                    'triglycerides' => 82,  'hdl' => 70, 'total_cholesterol' => 165,
                    'fasting_glucose' => 85, 'hba1c' => 5.1,
                    'blood_pressure_systolic' => 114, 'blood_pressure_diastolic' => 73,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 3, 'risk_score' => 0.11,
                    'bmi' => 21.3, 'body_weight' => 58.0, 'waist_circumference' => 71,
                    'alt' => 17, 'ast' => 15, 'ggt' => 16,
                    'triglycerides' => 75,  'hdl' => 74, 'total_cholesterol' => 160,
                    'fasting_glucose' => 81, 'hba1c' => 5.0,
                    'blood_pressure_systolic' => 111, 'blood_pressure_diastolic' => 71,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 2, 'risk_score' => 0.13,
                    'bmi' => 21.5, 'body_weight' => 58.5, 'waist_circumference' => 72,
                    'alt' => 18, 'ast' => 16, 'ggt' => 18,
                    'triglycerides' => 80,  'hdl' => 71, 'total_cholesterol' => 163,
                    'fasting_glucose' => 83, 'hba1c' => 5.1,
                    'blood_pressure_systolic' => 113, 'blood_pressure_diastolic' => 72,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 1, 'risk_score' => 0.09,
                    'bmi' => 21.0, 'body_weight' => 57.2, 'waist_circumference' => 70,
                    'alt' => 15, 'ast' => 14, 'ggt' => 15,
                    'triglycerides' => 68,  'hdl' => 78, 'total_cholesterol' => 155,
                    'fasting_glucose' => 78, 'hba1c' => 4.9,
                    'blood_pressure_systolic' => 108, 'blood_pressure_diastolic' => 68,
                    'has_fatty_liver' => false,
                ],
            ]
        );

        // ══════════════════════════════════════════════════════════════════════
        // 2. ROBERT CHEN — 55M — Always High Risk (established metabolic syndrome)
        // ══════════════════════════════════════════════════════════════════════
        $this->createPatient(
            ['name' => 'Robert Chen', 'email' => 'robert@livercare.test', 'sex' => 'Male', 'age' => 55, 'height' => 172],
            [
                [
                    'months_ago' => 6, 'risk_score' => 0.74,
                    'bmi' => 33.8, 'body_weight' => 100.2, 'waist_circumference' => 110,
                    'alt' => 88, 'ast' => 70, 'ggt' => 102,
                    'triglycerides' => 248, 'hdl' => 32, 'total_cholesterol' => 262,
                    'fasting_glucose' => 142, 'hba1c' => 7.0,
                    'blood_pressure_systolic' => 148, 'blood_pressure_diastolic' => 96,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 5, 'risk_score' => 0.78,
                    'bmi' => 34.2, 'body_weight' => 101.4, 'waist_circumference' => 111,
                    'alt' => 92, 'ast' => 74, 'ggt' => 108,
                    'triglycerides' => 258, 'hdl' => 30, 'total_cholesterol' => 268,
                    'fasting_glucose' => 148, 'hba1c' => 7.3,
                    'blood_pressure_systolic' => 152, 'blood_pressure_diastolic' => 98,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 4, 'risk_score' => 0.82,
                    'bmi' => 34.8, 'body_weight' => 103.1, 'waist_circumference' => 113,
                    'alt' => 105, 'ast' => 84, 'ggt' => 118,
                    'triglycerides' => 272, 'hdl' => 28, 'total_cholesterol' => 275,
                    'fasting_glucose' => 155, 'hba1c' => 7.6,
                    'blood_pressure_systolic' => 156, 'blood_pressure_diastolic' => 100,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 3, 'risk_score' => 0.80,
                    'bmi' => 34.5, 'body_weight' => 102.2, 'waist_circumference' => 112,
                    'alt' => 98, 'ast' => 80, 'ggt' => 112,
                    'triglycerides' => 265, 'hdl' => 29, 'total_cholesterol' => 270,
                    'fasting_glucose' => 152, 'hba1c' => 7.5,
                    'blood_pressure_systolic' => 154, 'blood_pressure_diastolic' => 99,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 2, 'risk_score' => 0.76,
                    'bmi' => 34.0, 'body_weight' => 100.8, 'waist_circumference' => 110,
                    'alt' => 90, 'ast' => 72, 'ggt' => 105,
                    'triglycerides' => 252, 'hdl' => 31, 'total_cholesterol' => 264,
                    'fasting_glucose' => 145, 'hba1c' => 7.2,
                    'blood_pressure_systolic' => 150, 'blood_pressure_diastolic' => 97,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 1, 'risk_score' => 0.79,
                    'bmi' => 34.3, 'body_weight' => 101.7, 'waist_circumference' => 111,
                    'alt' => 95, 'ast' => 76, 'ggt' => 110,
                    'triglycerides' => 260, 'hdl' => 30, 'total_cholesterol' => 267,
                    'fasting_glucose' => 150, 'hba1c' => 7.4,
                    'blood_pressure_systolic' => 152, 'blood_pressure_diastolic' => 98,
                    'has_fatty_liver' => true,
                ],
            ]
        );

        // ══════════════════════════════════════════════════════════════════════
        // 3. MARIA SANTOS — 45F — Worsening trajectory (Low → Medium → High)
        // ══════════════════════════════════════════════════════════════════════
        $this->createPatient(
            ['name' => 'Maria Santos', 'email' => 'maria@livercare.test', 'sex' => 'Female', 'age' => 45, 'height' => 162],
            [
                [
                    'months_ago' => 8, 'risk_score' => 0.18,
                    'bmi' => 22.8, 'body_weight' => 59.8, 'waist_circumference' => 78,
                    'alt' => 20, 'ast' => 18, 'ggt' => 22,
                    'triglycerides' => 88,  'hdl' => 68, 'total_cholesterol' => 172,
                    'fasting_glucose' => 86, 'hba1c' => 5.2,
                    'blood_pressure_systolic' => 116, 'blood_pressure_diastolic' => 75,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 7, 'risk_score' => 0.24,
                    'bmi' => 23.5, 'body_weight' => 61.7, 'waist_circumference' => 80,
                    'alt' => 24, 'ast' => 21, 'ggt' => 26,
                    'triglycerides' => 98,  'hdl' => 64, 'total_cholesterol' => 178,
                    'fasting_glucose' => 90, 'hba1c' => 5.3,
                    'blood_pressure_systolic' => 119, 'blood_pressure_diastolic' => 77,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 6, 'risk_score' => 0.38,
                    'bmi' => 25.8, 'body_weight' => 67.8, 'waist_circumference' => 86,
                    'alt' => 38, 'ast' => 32, 'ggt' => 44,
                    'triglycerides' => 145, 'hdl' => 50, 'total_cholesterol' => 205,
                    'fasting_glucose' => 102, 'hba1c' => 5.7,
                    'blood_pressure_systolic' => 126, 'blood_pressure_diastolic' => 82,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 5, 'risk_score' => 0.46,
                    'bmi' => 27.2, 'body_weight' => 71.4, 'waist_circumference' => 90,
                    'alt' => 48, 'ast' => 40, 'ggt' => 56,
                    'triglycerides' => 165, 'hdl' => 46, 'total_cholesterol' => 218,
                    'fasting_glucose' => 110, 'hba1c' => 6.0,
                    'blood_pressure_systolic' => 131, 'blood_pressure_diastolic' => 85,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 4, 'risk_score' => 0.55,
                    'bmi' => 28.8, 'body_weight' => 75.6, 'waist_circumference' => 95,
                    'alt' => 60, 'ast' => 50, 'ggt' => 70,
                    'triglycerides' => 188, 'hdl' => 42, 'total_cholesterol' => 232,
                    'fasting_glucose' => 118, 'hba1c' => 6.2,
                    'blood_pressure_systolic' => 136, 'blood_pressure_diastolic' => 88,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 3, 'risk_score' => 0.67,
                    'bmi' => 30.4, 'body_weight' => 79.8, 'waist_circumference' => 101,
                    'alt' => 76, 'ast' => 62, 'ggt' => 88,
                    'triglycerides' => 218, 'hdl' => 37, 'total_cholesterol' => 248,
                    'fasting_glucose' => 128, 'hba1c' => 6.6,
                    'blood_pressure_systolic' => 142, 'blood_pressure_diastolic' => 92,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 2, 'risk_score' => 0.73,
                    'bmi' => 31.6, 'body_weight' => 82.9, 'waist_circumference' => 104,
                    'alt' => 88, 'ast' => 72, 'ggt' => 100,
                    'triglycerides' => 238, 'hdl' => 34, 'total_cholesterol' => 258,
                    'fasting_glucose' => 138, 'hba1c' => 7.0,
                    'blood_pressure_systolic' => 148, 'blood_pressure_diastolic' => 95,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 1, 'risk_score' => 0.77,
                    'bmi' => 32.4, 'body_weight' => 85.1, 'waist_circumference' => 107,
                    'alt' => 95, 'ast' => 78, 'ggt' => 108,
                    'triglycerides' => 252, 'hdl' => 32, 'total_cholesterol' => 265,
                    'fasting_glucose' => 145, 'hba1c' => 7.3,
                    'blood_pressure_systolic' => 152, 'blood_pressure_diastolic' => 97,
                    'has_fatty_liver' => true,
                ],
            ]
        );

        // ══════════════════════════════════════════════════════════════════════
        // 4. DAVID KIM — 38M — Improving trajectory (High → Medium → Low)
        // ══════════════════════════════════════════════════════════════════════
        $this->createPatient(
            ['name' => 'David Kim', 'email' => 'david@livercare.test', 'sex' => 'Male', 'age' => 38, 'height' => 176],
            [
                [
                    'months_ago' => 8, 'risk_score' => 0.82,
                    'bmi' => 34.5, 'body_weight' => 106.8, 'waist_circumference' => 114,
                    'alt' => 112, 'ast' => 90, 'ggt' => 125,
                    'triglycerides' => 278, 'hdl' => 28, 'total_cholesterol' => 282,
                    'fasting_glucose' => 162, 'hba1c' => 8.0,
                    'blood_pressure_systolic' => 160, 'blood_pressure_diastolic' => 104,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 7, 'risk_score' => 0.76,
                    'bmi' => 33.2, 'body_weight' => 102.8, 'waist_circumference' => 111,
                    'alt' => 98, 'ast' => 80, 'ggt' => 112,
                    'triglycerides' => 258, 'hdl' => 30, 'total_cholesterol' => 272,
                    'fasting_glucose' => 152, 'hba1c' => 7.6,
                    'blood_pressure_systolic' => 155, 'blood_pressure_diastolic' => 100,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 6, 'risk_score' => 0.68,
                    'bmi' => 31.8, 'body_weight' => 98.4, 'waist_circumference' => 108,
                    'alt' => 82, 'ast' => 66, 'ggt' => 95,
                    'triglycerides' => 232, 'hdl' => 34, 'total_cholesterol' => 258,
                    'fasting_glucose' => 140, 'hba1c' => 7.0,
                    'blood_pressure_systolic' => 148, 'blood_pressure_diastolic' => 96,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 5, 'risk_score' => 0.58,
                    'bmi' => 30.2, 'body_weight' => 93.5, 'waist_circumference' => 104,
                    'alt' => 66, 'ast' => 54, 'ggt' => 78,
                    'triglycerides' => 205, 'hdl' => 38, 'total_cholesterol' => 242,
                    'fasting_glucose' => 128, 'hba1c' => 6.5,
                    'blood_pressure_systolic' => 141, 'blood_pressure_diastolic' => 92,
                    'has_fatty_liver' => true,
                ],
                [
                    'months_ago' => 4, 'risk_score' => 0.49,
                    'bmi' => 28.6, 'body_weight' => 88.5, 'waist_circumference' => 99,
                    'alt' => 52, 'ast' => 44, 'ggt' => 62,
                    'triglycerides' => 182, 'hdl' => 42, 'total_cholesterol' => 228,
                    'fasting_glucose' => 116, 'hba1c' => 6.1,
                    'blood_pressure_systolic' => 135, 'blood_pressure_diastolic' => 88,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 3, 'risk_score' => 0.38,
                    'bmi' => 26.8, 'body_weight' => 83.0, 'waist_circumference' => 94,
                    'alt' => 40, 'ast' => 34, 'ggt' => 48,
                    'triglycerides' => 155, 'hdl' => 48, 'total_cholesterol' => 210,
                    'fasting_glucose' => 104, 'hba1c' => 5.8,
                    'blood_pressure_systolic' => 128, 'blood_pressure_diastolic' => 84,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 2, 'risk_score' => 0.25,
                    'bmi' => 25.0, 'body_weight' => 77.4, 'waist_circumference' => 88,
                    'alt' => 28, 'ast' => 24, 'ggt' => 32,
                    'triglycerides' => 118, 'hdl' => 56, 'total_cholesterol' => 188,
                    'fasting_glucose' => 94, 'hba1c' => 5.4,
                    'blood_pressure_systolic' => 120, 'blood_pressure_diastolic' => 78,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 1, 'risk_score' => 0.17,
                    'bmi' => 23.8, 'body_weight' => 73.6, 'waist_circumference' => 84,
                    'alt' => 22, 'ast' => 19, 'ggt' => 25,
                    'triglycerides' => 98,  'hdl' => 64, 'total_cholesterol' => 175,
                    'fasting_glucose' => 86, 'hba1c' => 5.1,
                    'blood_pressure_systolic' => 115, 'blood_pressure_diastolic' => 75,
                    'has_fatty_liver' => false,
                ],
            ]
        );

        // ══════════════════════════════════════════════════════════════════════
        // 5. PRIYA PATEL — 50F — Borderline (oscillating Medium risk)
        // ══════════════════════════════════════════════════════════════════════
        $this->createPatient(
            ['name' => 'Priya Patel', 'email' => 'priya@livercare.test', 'sex' => 'Female', 'age' => 50, 'height' => 158],
            [
                [
                    'months_ago' => 6, 'risk_score' => 0.42,
                    'bmi' => 27.5, 'body_weight' => 68.6, 'waist_circumference' => 90,
                    'alt' => 42, 'ast' => 36, 'ggt' => 48,
                    'triglycerides' => 158, 'hdl' => 48, 'total_cholesterol' => 212,
                    'fasting_glucose' => 105, 'hba1c' => 5.8,
                    'blood_pressure_systolic' => 128, 'blood_pressure_diastolic' => 83,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 5, 'risk_score' => 0.35,
                    'bmi' => 26.8, 'body_weight' => 66.9, 'waist_circumference' => 88,
                    'alt' => 36, 'ast' => 30, 'ggt' => 42,
                    'triglycerides' => 142, 'hdl' => 52, 'total_cholesterol' => 205,
                    'fasting_glucose' => 99, 'hba1c' => 5.6,
                    'blood_pressure_systolic' => 124, 'blood_pressure_diastolic' => 80,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 4, 'risk_score' => 0.51,
                    'bmi' => 28.4, 'body_weight' => 70.8, 'waist_circumference' => 93,
                    'alt' => 52, 'ast' => 44, 'ggt' => 58,
                    'triglycerides' => 172, 'hdl' => 45, 'total_cholesterol' => 220,
                    'fasting_glucose' => 112, 'hba1c' => 6.0,
                    'blood_pressure_systolic' => 132, 'blood_pressure_diastolic' => 86,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 3, 'risk_score' => 0.44,
                    'bmi' => 27.8, 'body_weight' => 69.3, 'waist_circumference' => 91,
                    'alt' => 44, 'ast' => 38, 'ggt' => 50,
                    'triglycerides' => 162, 'hdl' => 47, 'total_cholesterol' => 215,
                    'fasting_glucose' => 108, 'hba1c' => 5.9,
                    'blood_pressure_systolic' => 129, 'blood_pressure_diastolic' => 84,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 2, 'risk_score' => 0.56,
                    'bmi' => 29.2, 'body_weight' => 72.8, 'waist_circumference' => 95,
                    'alt' => 58, 'ast' => 48, 'ggt' => 65,
                    'triglycerides' => 185, 'hdl' => 43, 'total_cholesterol' => 228,
                    'fasting_glucose' => 116, 'hba1c' => 6.2,
                    'blood_pressure_systolic' => 134, 'blood_pressure_diastolic' => 87,
                    'has_fatty_liver' => false,
                ],
                [
                    'months_ago' => 1, 'risk_score' => 0.48,
                    'bmi' => 28.0, 'body_weight' => 69.8, 'waist_circumference' => 92,
                    'alt' => 46, 'ast' => 40, 'ggt' => 52,
                    'triglycerides' => 165, 'hdl' => 46, 'total_cholesterol' => 217,
                    'fasting_glucose' => 110, 'hba1c' => 5.9,
                    'blood_pressure_systolic' => 130, 'blood_pressure_diastolic' => 85,
                    'has_fatty_liver' => false,
                ],
            ]
        );
    }
}
