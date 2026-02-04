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
        Schema::create('derived_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blood_test_id')->constrained('blood_tests')->onDelete('cascade');
            $table->decimal('tyg_index', 8, 4)->nullable(); // Triglyceride-Glucose Index
            $table->decimal('tg_hdl_ratio', 8, 4)->nullable(); // Triglyceride-to-HDL Ratio
            $table->decimal('tyg_bmi', 8, 4)->nullable(); // TYG-BMI Index
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('derived_features');
    }
};
