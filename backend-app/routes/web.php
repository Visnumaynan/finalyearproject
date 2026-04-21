<?php

use App\Http\Controllers\BloodTestController;
use App\Models\Alert;
use App\Models\RiskPrediction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $userId = Auth::id();

        $predictions = RiskPrediction::query()
            ->where('user_id', $userId)
            ->whereHas('bloodTest')
            ->orderBy('prediction_date')
            ->get(['risk_score', 'risk_level', 'prediction_date']);

        $latest = $predictions->last();
        $previous = $predictions->count() >= 2 ? $predictions->nth(2)->last() : null;

        $distribution = $predictions->groupBy('risk_level')->map->count();

        $trend = null;
        if ($latest && $previous) {
            $diff = round(($latest->risk_score - $previous->risk_score) * 100, 1);
            $trend = ['diff' => $diff, 'direction' => $diff >= 0 ? 'up' : 'down'];
        }

        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();
        $unreadAlerts = $authUser
            ->alerts()
            ->unread()
            ->whereIn('alert_type', ['Critical', 'Warning'])
            ->latest()
            ->take(5)
            ->get(['id', 'alert_type', 'message', 'current_risk_level', 'created_at']);

        return Inertia::render('Dashboard', [
            'latest' => $latest ? [
                'risk_score' => round($latest->risk_score * 100, 1),
                'risk_level' => $latest->risk_level,
                'prediction_date' => $latest->prediction_date?->toDateString(),
            ] : null,
            'trend' => $trend,
            'distribution' => [
                'Low' => $distribution->get('Low', 0),
                'Medium' => $distribution->get('Medium', 0),
                'High' => $distribution->get('High', 0),
            ],
            'trendSeries' => $predictions->map(fn ($p) => [
                'date' => $p->prediction_date?->toDateString(),
                'score' => round($p->risk_score * 100, 1),
            ])->values(),
            'recentTests' => RiskPrediction::query()
                ->where('user_id', $userId)
                ->whereHas('bloodTest')
                ->with('bloodTest:id,test_date')
                ->latest('prediction_date')
                ->take(8)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'date' => $p->prediction_date?->toDateString(),
                    'score' => round($p->risk_score * 100, 1),
                    'risk_level' => $p->risk_level,
                ]),
            'unreadAlerts' => $unreadAlerts->map(fn ($a) => [
                'id' => $a->id,
                'alert_type' => $a->alert_type,
                'message' => $a->message,
                'risk_level' => $a->current_risk_level,
            ]),
        ]);
    })->name('dashboard');

    // Blood tests + prediction flow
    Route::resource('blood-tests', BloodTestController::class)
        ->only(['index', 'create', 'store', 'show', 'destroy']);
    Route::post('blood-tests/{blood_test}/retry', [BloodTestController::class, 'retry'])
        ->name('blood-tests.retry');

    // Dismiss a single alert permanently
    Route::post('alerts/{alert}/dismiss', function (Alert $alert) {
        abort_unless($alert->user_id === Auth::id(), 403);
        $alert->markRead();

        return back();
    })->name('alerts.dismiss');
});

require __DIR__.'/settings.php';
