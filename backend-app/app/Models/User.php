<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function profile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function bloodTests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BloodTest::class);
    }

    public function riskPredictions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(RiskPrediction::class);
    }

    public function alerts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function latestPrediction(): ?\Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(RiskPrediction::class)->latestOfMany('prediction_date');
    }
}
