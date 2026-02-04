<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\BloodTest;
use App\Models\DerivedFeature;
use App\Models\RiskPrediction;
use App\Models\Alert;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create profile for test user
        UserProfile::factory()->create([
            'user_id' => $testUser->id,
        ]);

        // Create 5 blood tests for test user
        $bloodTests = BloodTest::factory(5)->create([
            'user_id' => $testUser->id,
        ]);

        // Create derived features for each blood test
        foreach ($bloodTests as $bloodTest) {
            DerivedFeature::factory()->create([
                'blood_test_id' => $bloodTest->id,
            ]);

            // Create risk prediction for each blood test
            $riskPrediction = RiskPrediction::factory()->create([
                'user_id' => $testUser->id,
                'blood_test_id' => $bloodTest->id,
            ]);

            // Create alert for each risk prediction
            Alert::factory()->create([
                'user_id' => $testUser->id,
                'risk_prediction_id' => $riskPrediction->id,
            ]);
        }

        // Create additional sample users with their data
        $users = User::factory(10)->create();

        foreach ($users as $user) {
            // Create profile
            UserProfile::factory()->create([
                'user_id' => $user->id,
            ]);

            // Create 3 blood tests per user
            $bloodTests = BloodTest::factory(3)->create([
                'user_id' => $user->id,
            ]);

            foreach ($bloodTests as $bloodTest) {
                // Create derived features
                DerivedFeature::factory()->create([
                    'blood_test_id' => $bloodTest->id,
                ]);

                // Create risk prediction
                $riskPrediction = RiskPrediction::factory()->create([
                    'user_id' => $user->id,
                    'blood_test_id' => $bloodTest->id,
                ]);

                // Create alert
                Alert::factory()->create([
                    'user_id' => $user->id,
                    'risk_prediction_id' => $riskPrediction->id,
                ]);
            }
        }
    }
}
