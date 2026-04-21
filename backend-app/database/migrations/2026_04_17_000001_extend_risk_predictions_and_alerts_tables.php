<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns to risk_predictions if they don't exist
        Schema::table('risk_predictions', function (Blueprint $table) {
            if (! Schema::hasColumn('risk_predictions', 'fastapi_response_ms')) {
                $table->unsignedInteger('fastapi_response_ms')->nullable()->after('prediction_date');
            }
            if (! Schema::hasColumn('risk_predictions', 'feature_snapshot')) {
                $table->json('feature_snapshot')->nullable()->after('fastapi_response_ms');
            }
        });

        // Extend alerts table with previous/current risk columns + read_at
        Schema::table('alerts', function (Blueprint $table) {
            if (! Schema::hasColumn('alerts', 'previous_risk_level')) {
                $table->string('previous_risk_level', 20)->nullable()->after('alert_type');
            }
            if (! Schema::hasColumn('alerts', 'current_risk_level')) {
                $table->string('current_risk_level', 20)->nullable()->after('previous_risk_level');
            }
            if (! Schema::hasColumn('alerts', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('is_read');
            }
        });
    }

    public function down(): void
    {
        Schema::table('risk_predictions', function (Blueprint $table) {
            $table->dropColumnIfExists(['fastapi_response_ms', 'feature_snapshot']);
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropColumnIfExists(['previous_risk_level', 'current_risk_level', 'read_at']);
        });
    }
};
