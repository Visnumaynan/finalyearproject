<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DerivedFeature extends Model
{
    use HasFactory;

    protected $fillable = ['blood_test_id', 'tyg_index', 'tg_hdl_ratio', 'tyg_bmi'];
    public $timestamps = false;
}
