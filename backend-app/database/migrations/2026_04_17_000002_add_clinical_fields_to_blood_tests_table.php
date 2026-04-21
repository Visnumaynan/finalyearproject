<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blood_tests', function (Blueprint $table) {
            if (! Schema::hasColumn('blood_tests', 'body_weight')) {
                // Body weight in kg — required by the trained model
                $table->decimal('body_weight', 5, 2)->nullable()->after('bmi');
            }
            if (! Schema::hasColumn('blood_tests', 'has_fatty_liver')) {
                // Known fatty liver at time of test (0=No, 1=Yes)
                $table->boolean('has_fatty_liver')->default(false)->after('body_weight');
            }
        });
    }

    public function down(): void
    {
        Schema::table('blood_tests', function (Blueprint $table) {
            $table->dropColumnIfExists(['body_weight', 'has_fatty_liver']);
        });
    }
};
