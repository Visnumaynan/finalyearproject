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
        Schema::create('risk_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('blood_test_id')->constrained('blood_tests')->onDelete('cascade');
            $table->decimal('risk_score', 5, 4); // 0.0000 to 1.0000
            $table->enum('risk_level', ['Low', 'Medium', 'High']);
            $table->string('model_used')->default('insulin_resistance_v1'); // Model version/name
            $table->timestamp('prediction_date')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            $table->softDeletes(); // Optional: for soft deletes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_predictions');
    }
};
