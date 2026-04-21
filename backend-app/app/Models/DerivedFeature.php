<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DerivedFeature extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'blood_test_id',
        'tyg_index',
        'tg_hdl_ratio',
        'tyg_bmi',
    ];

    protected function casts(): array
    {
        return [
            'tyg_index' => 'float',
            'tg_hdl_ratio' => 'float',
            'tyg_bmi' => 'float',
        ];
    }

    public function bloodTest(): BelongsTo
    {
        return $this->belongsTo(BloodTest::class);
    }
}
