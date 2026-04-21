<?php

namespace App\Http\Controllers;

use App\Exceptions\FeatureMismatchException;
use App\Exceptions\MLPredictionException;
use App\Http\Requests\StoreBloodTestRequest;
use App\Models\BloodTest;
use App\Services\MLPredictionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class BloodTestController extends Controller
{
    public function __construct(private MLPredictionService $mlService) {}

    public function index(): Response
    {
        $tests = BloodTest::query()
            ->where('user_id', Auth::id())
            ->with(['riskPrediction', 'derivedFeature'])
            ->orderByDesc('test_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (BloodTest $t) => [
                'id' => $t->id,
                'test_date' => $t->test_date?->toDateString(),
                'prediction' => $t->riskPrediction ? [
                    'id' => $t->riskPrediction->id,
                    'risk_score' => $t->riskPrediction->risk_score,
                    'risk_level' => $t->riskPrediction->risk_level,
                    'model_used' => $t->riskPrediction->model_used,
                    'date' => $t->riskPrediction->prediction_date?->toDateTimeString(),
                ] : null,
                'derived' => $t->derivedFeature ? [
                    'tyg_index' => $t->derivedFeature->tyg_index,
                    'tg_hdl_ratio' => $t->derivedFeature->tg_hdl_ratio,
                    'tyg_bmi' => $t->derivedFeature->tyg_bmi,
                ] : null,
            ]);

        $unreadAlerts = Auth::user()
            ->alerts()
            ->unread()
            ->whereIn('alert_type', ['Critical', 'Warning'])
            ->latest('created_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'alert_type' => $a->alert_type,
                'message' => $a->message,
                'previous_risk' => $a->previous_risk_level,
                'current_risk' => $a->current_risk_level,
            ]);

        $latestPrediction = Auth::user()->riskPredictions()
            ->latest('prediction_date')
            ->first();

        return Inertia::render('BloodTest/Index', [
            'tests' => $tests,
            'unreadAlerts' => $unreadAlerts,
            'latestPrediction' => $latestPrediction ? [
                'risk_score' => $latestPrediction->risk_score,
                'risk_level' => $latestPrediction->risk_level,
                'date' => $latestPrediction->prediction_date?->toDateTimeString(),
            ] : null,
            'aiAvailable' => $this->mlService->healthCheck(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('BloodTest/Create', [
            'aiAvailable' => $this->mlService->healthCheck(),
        ]);
    }

    public function store(StoreBloodTestRequest $request): RedirectResponse
    {
        $bloodTest = BloodTest::create([
            ...$request->validated(),
            'user_id' => Auth::id(),
        ]);

        // Eager-load the user profile so toFeatureArray() can read sex + date_of_birth
        $bloodTest->load('user.profile');

        try {
            $prediction = $this->mlService->processBloodTest($bloodTest);

            return redirect()
                ->route('blood-tests.index')
                ->with('success', sprintf(
                    'Analysis complete — Risk: %s (%.1f%%)',
                    $prediction->risk_level,
                    $prediction->risk_percentage
                ));

        } catch (FeatureMismatchException $e) {
            Log::critical('Feature mismatch on blood test store', [
                'blood_test_id' => $bloodTest->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()
                ->route('blood-tests.index')
                ->with('warning', 'Blood test saved, but prediction failed due to a model configuration issue. Please contact support.');

        } catch (MLPredictionException $e) {
            // Blood test data is already saved — graceful degradation
            return redirect()
                ->route('blood-tests.index')
                ->with('warning', 'Blood test saved. '.$e->getMessage());
        }
    }

    public function show(BloodTest $bloodTest): Response
    {
        abort_unless($bloodTest->user_id === Auth::id(), 403);

        $bloodTest->load(['riskPrediction.alerts', 'derivedFeature']);

        return Inertia::render('BloodTest/Show', [
            'test' => $bloodTest,
        ]);
    }

    public function destroy(BloodTest $bloodTest): RedirectResponse
    {
        abort_unless($bloodTest->user_id === Auth::id(), 403);

        $bloodTest->delete();

        return redirect()->route('blood-tests.index')
            ->with('success', 'Test record deleted.');
    }

    public function retry(BloodTest $bloodTest): RedirectResponse
    {
        abort_unless($bloodTest->user_id === Auth::id(), 403);

        if ($bloodTest->riskPrediction) {
            return redirect()->route('blood-tests.index')
                ->with('warning', 'This test already has a prediction.');
        }

        $bloodTest->load('user.profile');

        try {
            $prediction = $this->mlService->processBloodTest($bloodTest);

            return redirect()->route('blood-tests.index')
                ->with('success', sprintf(
                    'Prediction complete — Risk: %s (%.1f%%)',
                    $prediction->risk_level,
                    $prediction->risk_percentage
                ));

        } catch (FeatureMismatchException $e) {
            return redirect()->route('blood-tests.index')
                ->with('warning', 'Prediction failed due to a model configuration issue.');

        } catch (MLPredictionException $e) {
            return redirect()->route('blood-tests.index')
                ->with('warning', 'AI service unreachable. '.$e->getMessage());
        }
    }
}
