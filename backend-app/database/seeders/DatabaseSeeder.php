<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Execution order:
     *  1. DemoUserSeeder      — James Anderson (demo@livercare.test / password)
     *                           12-month narrative: healthy → sick → recovered
     *  2. SamplePatientsSeeder — 5 distinct clinical profiles for UI testing
     */
    public function run(): void
    {
        $this->call([
            DemoUserSeeder::class,
            SamplePatientsSeeder::class,
        ]);
    }
}
