<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RiskPrediction extends Model
{
    use HasFactory, SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'blood_test_id',
        'risk_score',
        'risk_level',
        'model_used',
        'prediction_date',
        'fastapi_response_ms',
        'feature_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'risk_score' => 'float',
            'prediction_date' => 'datetime',
            'fastapi_response_ms' => 'integer',
            'feature_snapshot' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bloodTest(): BelongsTo
    {
        return $this->belongsTo(BloodTest::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function getRiskPercentageAttribute(): float
    {
        return round($this->risk_score * 100, 2);
    }

    public function getPredictionLabelAttribute(): string
    {
        return $this->risk_score >= 0.5 ? 'NAFLD Present' : 'No NAFLD';
    }
}
