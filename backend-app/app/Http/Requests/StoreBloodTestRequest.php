<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBloodTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Date
            'test_date' => ['required', 'date', 'before_or_equal:today'],

            // Anthropometric — REQUIRED by model
            'bmi' => ['required', 'numeric', 'min:10', 'max:100'],
            'body_weight' => ['required', 'numeric', 'min:10', 'max:400'],
            'waist_circumference' => ['required', 'numeric', 'min:30', 'max:300'],

            // Liver enzymes (IU/L) — REQUIRED by model
            'alt' => ['required', 'numeric', 'min:0', 'max:5000'],
            'ast' => ['required', 'numeric', 'min:0', 'max:5000'],
            'ggt' => ['nullable', 'numeric', 'min:0', 'max:5000'],

            // Clinical flag
            'has_fatty_liver' => ['required', 'boolean'],

            // Lipids (mg/dL) — nullable but strongly recommended
            'triglycerides' => ['nullable', 'numeric', 'min:0', 'max:2000'],
            'hdl' => ['nullable', 'numeric', 'min:5', 'max:500'],
            'total_cholesterol' => ['nullable', 'numeric', 'min:0', 'max:1000'],

            // Glycemic
            'fasting_glucose' => ['nullable', 'numeric', 'min:40', 'max:1000'],
            'hba1c' => ['nullable', 'numeric', 'min:1', 'max:20'],

            // Blood pressure (mmHg)
            'blood_pressure_systolic' => ['nullable', 'numeric', 'min:60', 'max:300'],
            'blood_pressure_diastolic' => ['nullable', 'numeric', 'min:40', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'test_date.before_or_equal' => 'Test date cannot be in the future.',
            'bmi.required' => 'BMI is required.',
            'body_weight.required' => 'Body weight is required.',
            'waist_circumference.required' => 'Waist circumference is required.',
            'alt.required' => 'ALT (Alanine Aminotransferase) is required.',
            'ast.required' => 'AST (Aspartate Aminotransferase) is required.',
            'has_fatty_liver.required' => 'Please indicate whether fatty liver is present.',
            'fasting_glucose.min' => 'Fasting glucose must be at least 40 mg/dL.',
            'hdl.min' => 'HDL must be at least 5 mg/dL.',
        ];
    }

    public function prepareForValidation(): void
    {
        $numericFields = [
            'alt', 'ast', 'ggt', 'triglycerides', 'hdl', 'total_cholesterol',
            'fasting_glucose', 'hba1c', 'bmi', 'body_weight', 'waist_circumference',
            'blood_pressure_systolic', 'blood_pressure_diastolic',
        ];

        $casted = [];
        foreach ($numericFields as $field) {
            $value = $this->input($field);
            if ($value !== null && $value !== '') {
                $casted[$field] = (float) trim((string) $value);
            }
        }

        // Normalise has_fatty_liver to boolean
        $fattyLiver = $this->input('has_fatty_liver');
        if ($fattyLiver !== null) {
            $casted['has_fatty_liver'] = filter_var($fattyLiver, FILTER_VALIDATE_BOOLEAN);
        }

        if (! empty($casted)) {
            $this->merge($casted);
        }
    }
}
