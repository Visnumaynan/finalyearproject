<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\BloodTest>
 */
class BloodTestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'test_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'alt' => fake()->numberBetween(7, 56), // U/L - Normal: 7-56
            'ast' => fake()->numberBetween(10, 40), // U/L - Normal: 10-40
            'ggt' => fake()->numberBetween(8, 61), // U/L - Normal: 8-61 (Female), 9-48 (Male)
            'triglycerides' => fake()->numberBetween(50, 250), // mg/dL
            'hdl' => fake()->numberBetween(40, 100), // mg/dL
            'total_cholesterol' => fake()->numberBetween(150, 300), // mg/dL
            'fasting_glucose' => fake()->numberBetween(70, 150), // mg/dL - Normal: <100
            'hba1c' => fake()->numberBetween(50, 100), // mmol/mol (or 4.5-6.5% in old units)
            'bmi' => fake()->randomFloat(2, 18, 40), // kg/m² - Normal: 18.5-24.9
            'waist_circumference' => fake()->numberBetween(60, 120), // cm
            'blood_pressure_systolic' => fake()->numberBetween(90, 180), // mmHg
            'blood_pressure_diastolic' => fake()->numberBetween(60, 120), // mmHg
        ];
    }
}
