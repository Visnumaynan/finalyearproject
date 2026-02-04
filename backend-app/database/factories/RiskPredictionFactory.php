<?php

namespace Database\Factories;

use App\Models\BloodTest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RiskPrediction>
 */
class RiskPredictionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $riskScore = fake()->randomFloat(4, 0, 1);

        // Determine risk level based on score
        if ($riskScore < 0.33) {
            $riskLevel = 'Low';
        } elseif ($riskScore < 0.67) {
            $riskLevel = 'Medium';
        } else {
            $riskLevel = 'High';
        }

        return [
            'user_id' => User::factory(),
            'blood_test_id' => BloodTest::factory(),
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'model_used' => 'insulin_resistance_v1',
            'prediction_date' => now(),
        ];
    }
}
