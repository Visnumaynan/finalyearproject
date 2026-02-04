<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BloodTest extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'test_date', 'alt', 'ast', 'ggt', 'triglycerides', 'hdl', 'total_cholesterol', 'fasting_glucose', 'hba1c', 'bmi', 'waist_circumference', 'blood_pressure_systolic', 'blood_pressure_diastolic'];
    public $timestamps = false;
}
