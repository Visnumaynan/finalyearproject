<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiskPrediction extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'blood_test_id', 'risk_score', 'risk_level', 'model_used', 'prediction_date'];
    public $timestamps = false;
}
