<?php

namespace Database\Factories;

use App\Models\BloodTest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DerivedFeature>
 */
class DerivedFeatureFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $triglycerides = fake()->numberBetween(50, 250);
        $hdl = fake()->numberBetween(40, 100);
        $bmi = fake()->randomFloat(2, 18, 40);
        $fasting_glucose = fake()->numberBetween(70, 150);

        // Calculate TYG Index: ln(triglycerides * fasting glucose / 2)
        $tyg_index = log(($triglycerides * $fasting_glucose) / 2);

        // Calculate TG/HDL Ratio
        $tg_hdl_ratio = $triglycerides / $hdl;

        // Calculate TYG-BMI
        $tyg_bmi = $tyg_index * $bmi;

        return [
            'blood_test_id' => BloodTest::factory(),
            'tyg_index' => round($tyg_index, 4),
            'tg_hdl_ratio' => round($tg_hdl_ratio, 4),
            'tyg_bmi' => round($tyg_bmi, 4),
        ];
    }
}
