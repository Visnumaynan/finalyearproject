<?php

namespace Database\Factories;

use App\Models\RiskPrediction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Alert>
 */
class AlertFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $alertType = fake()->randomElement(['Warning', 'Critical', 'Info']);

        $messages = [
            'Warning' => [
                'Your triglyceride levels are elevated. Consider lifestyle changes.',
                'Your fasting glucose is higher than normal. Monitor your diet.',
                'Your BMI suggests you may be overweight. Consult a healthcare provider.',
            ],
            'Critical' => [
                'Your risk score indicates high insulin resistance. Seek immediate medical advice.',
                'Your blood glucose is critically high. Schedule an appointment with your doctor.',
                'Your risk prediction shows critical risk level. Medical intervention recommended.',
            ],
            'Info' => [
                'Your latest blood test results are available.',
                'Reminder: Schedule your next blood test.',
                'Your health metrics have been updated.',
            ],
        ];

        return [
            'user_id' => User::factory(),
            'risk_prediction_id' => RiskPrediction::factory(),
            'alert_type' => $alertType,
            'message' => fake()->randomElement($messages[$alertType]),
            'is_read' => fake()->boolean(30), // 30% chance of being read
        ];
    }
}
