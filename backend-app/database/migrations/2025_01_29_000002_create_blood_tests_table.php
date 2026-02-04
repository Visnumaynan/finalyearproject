<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('blood_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('test_date');
            $table->decimal('alt', 8, 2)->nullable(); // Alanine Aminotransferase (U/L)
            $table->decimal('ast', 8, 2)->nullable(); // Aspartate Aminotransferase (U/L)
            $table->decimal('ggt', 8, 2)->nullable(); // Gamma-Glutamyl Transferase (U/L)
            $table->decimal('triglycerides', 8, 2)->nullable(); // (mg/dL)
            $table->decimal('hdl', 8, 2)->nullable(); // HDL Cholesterol (mg/dL)
            $table->decimal('total_cholesterol', 8, 2)->nullable(); // (mg/dL)
            $table->decimal('fasting_glucose', 8, 2)->nullable(); // (mg/dL)
            $table->decimal('hba1c', 8, 2)->nullable(); // (%)
            $table->decimal('bmi', 8, 2)->nullable(); // Body Mass Index
            $table->decimal('waist_circumference', 8, 2)->nullable(); // (cm)
            $table->decimal('blood_pressure_systolic', 8, 2)->nullable(); // (mmHg)
            $table->decimal('blood_pressure_diastolic', 8, 2)->nullable(); // (mmHg)
            $table->timestamp('created_at')->useCurrent();
            $table->softDeletes(); // Optional: for soft deletes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blood_tests');
    }
};
