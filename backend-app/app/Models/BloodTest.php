<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class BloodTest extends Model
{
    use HasFactory, SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'test_date',
        // Liver enzymes (IU/L)
        'alt', 'ast', 'ggt',
        // Lipids (mg/dL — stored in mg/dL, FastAPI converts to mmol/L)
        'triglycerides', 'hdl', 'total_cholesterol',
        // Glycemic
        'fasting_glucose', 'hba1c',
        // Anthropometric
        'bmi', 'body_weight', 'waist_circumference',
        // Blood pressure (mmHg)
        'blood_pressure_systolic', 'blood_pressure_diastolic',
        // Clinical flags
        'has_fatty_liver',
    ];

    protected function casts(): array
    {
        return [
            'test_date' => 'date',
            'alt' => 'float',
            'ast' => 'float',
            'ggt' => 'float',
            'triglycerides' => 'float',
            'hdl' => 'float',
            'total_cholesterol' => 'float',
            'fasting_glucose' => 'float',
            'hba1c' => 'float',
            'bmi' => 'float',
            'body_weight' => 'float',
            'waist_circumference' => 'float',
            'blood_pressure_systolic' => 'float',
            'blood_pressure_diastolic' => 'float',
            'has_fatty_liver' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function derivedFeature(): HasOne
    {
        return $this->hasOne(DerivedFeature::class);
    }

    public function riskPrediction(): HasOne
    {
        return $this->hasOne(RiskPrediction::class);
    }

    /**
     * Build the payload sent to FastAPI.
     *
     * - Lipids/glucose arrive in mg/dL from the form and are stored as mg/dL.
     * - FastAPI receives them with suffixed keys (_mgdl) and converts internally.
     * - Sex and age come from the User's profile.
     *
     * @return array<string, mixed>
     */
    public function toFeatureArray(): array
    {
        $profile = $this->user->profile;

        $sex = match ($profile?->sex) {
            'Male' => 0,
            'Female' => 1,
            default => null,
        };

        $age = $profile?->date_of_birth
            ? (int) $profile->date_of_birth->diffInYears(now())
            : null;

        return [
            // Demographic (from UserProfile)
            'sex' => $sex,
            'age' => $age,
            // Clinical flags
            'has_fatty_liver' => $this->has_fatty_liver ? 1 : 0,
            // Anthropometric
            'bmi' => $this->bmi,
            'waist_circumference' => $this->waist_circumference,
            'body_weight' => $this->body_weight,
            // Liver enzymes (IU/L — no conversion needed)
            'alt' => $this->alt,
            'ast' => $this->ast,
            'ggt' => $this->ggt,
            // Lipids — send in mg/dL, FastAPI converts to mmol/L
            'triglycerides_mgdl' => $this->triglycerides,
            'hdl_mgdl' => $this->hdl,
            'total_cholesterol_mgdl' => $this->total_cholesterol,
            // Glycemic
            'fasting_glucose_mgdl' => $this->fasting_glucose,
            'hba1c' => $this->hba1c,
            // Blood pressure (mmHg — no conversion needed)
            'blood_pressure_systolic' => $this->blood_pressure_systolic,
            'blood_pressure_diastolic' => $this->blood_pressure_diastolic,
        ];
    }
}
