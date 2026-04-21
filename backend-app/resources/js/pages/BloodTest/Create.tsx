import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import AppLayout from '@/layouts/AppLayout';

function Field({
    label,
    unit,
    required,
    error,
    children,
}: {
    label: string;
    unit?: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-[#666]">
                {label}
                {unit && <span className="ml-1 text-[#444]">{unit}</span>}
                {required && <span className="ml-1 text-red-400">*</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    placeholder,
    step = '0.1',
    min,
    max,
    unit,
}: {
    value: number | null;
    onChange: (v: number | null) => void;
    placeholder?: string;
    step?: string;
    min?: string;
    max?: string;
    unit?: string;
}) {
    return (
        <div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-[#1A1A1A] transition focus-within:border-white/20">
            <input
                type="number"
                step={step}
                min={min}
                max={max}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder={placeholder}
                className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none"
            />
            {unit && (
                <span className="flex items-center border-l border-white/[0.06] px-3 text-xs text-[#444]">
                    {unit}
                </span>
            )}
        </div>
    );
}

export default function Create({ aiAvailable }: { aiAvailable: boolean }) {
    const { data, setData, post, processing, errors } = useForm({
        test_date: new Date().toISOString().slice(0, 10),
        bmi: null as number | null,
        body_weight: null as number | null,
        waist_circumference: null as number | null,
        alt: null as number | null,
        ast: null as number | null,
        ggt: null as number | null,
        has_fatty_liver: false,
        triglycerides: null as number | null,
        hdl: null as number | null,
        total_cholesterol: null as number | null,
        fasting_glucose: null as number | null,
        hba1c: null as number | null,
        blood_pressure_systolic: null as number | null,
        blood_pressure_diastolic: null as number | null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/blood-tests');
    }

    return (
        <AppLayout>
            <Head title="Add New Test" />

            <div className="min-h-screen bg-[#0D0D0D] text-white">
                {/* Header */}
                <div className="border-b border-white/[0.06] px-4 py-4 md:px-8 md:py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-[#555]">
                                <Link href="/blood-tests" className="flex items-center gap-1 transition hover:text-white">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back
                                </Link>
                                <ChevronRight className="h-3.5 w-3.5 text-[#333]" />
                                <span className="text-white">Add New Test</span>
                            </div>
                            <p className="mt-1 hidden text-sm text-[#555] sm:block">
                                Enter your health details to get your liver risk assessment
                            </p>
                        </div>
                        {!aiAvailable && (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400" />
                                <span className="text-xs text-amber-300">AI offline — test will be saved &amp; predicted later</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} noValidate>
                    <div className="px-4 py-4 md:px-8 md:py-6">
                        <div className="mx-auto max-w-4xl">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 md:p-8"
                            >
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                                    {/* Left: Personal */}
                                    <div>
                                        <p className="mb-5 text-sm font-semibold text-[#888]">Personal Information</p>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="BMI" unit="kg/m²" required error={errors.bmi}>
                                                    <NumberInput value={data.bmi} onChange={(v) => setData('bmi', v)} placeholder="e.g. 24.5" min="10" />
                                                </Field>
                                                <Field label="Body Weight" unit="kg" required error={errors.body_weight}>
                                                    <NumberInput value={data.body_weight} onChange={(v) => setData('body_weight', v)} placeholder="e.g. 75" min="10" />
                                                </Field>
                                            </div>

                                            <Field label="Waist Circumference" unit="cm" required error={errors.waist_circumference}>
                                                <NumberInput value={data.waist_circumference} onChange={(v) => setData('waist_circumference', v)} placeholder="e.g. 90" min="30" unit="cm" />
                                            </Field>

                                            <Field label="Test Date" required error={errors.test_date}>
                                                <input
                                                    type="date"
                                                    value={data.test_date}
                                                    max={new Date().toISOString().slice(0, 10)}
                                                    onChange={(e) => setData('test_date', e.target.value)}
                                                    className="w-full rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none"
                                                />
                                            </Field>

                                            <Field label="Clinical Status" required>
                                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-4 py-3 transition hover:border-white/15">
                                                    <div
                                                        onClick={() => setData('has_fatty_liver', !data.has_fatty_liver)}
                                                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                            data.has_fatty_liver ? 'border-red-500 bg-red-500' : 'border-white/20 bg-transparent'
                                                        }`}
                                                    >
                                                        {data.has_fatty_liver && (
                                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-[#ccc]">Baseline Fatty Liver</p>
                                                        <p className="text-xs text-[#555]">Known diagnosis at time of test</p>
                                                    </div>
                                                </label>
                                            </Field>
                                        </div>
                                    </div>

                                    {/* Right: Blood Test Values */}
                                    <div>
                                        <p className="mb-5 text-sm font-semibold text-[#888]">Blood Test Values</p>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="ALT" unit="IU/L" required error={errors.alt}>
                                                    <NumberInput value={data.alt} onChange={(v) => setData('alt', v)} placeholder="e.g. 30" min="0" />
                                                </Field>
                                                <Field label="AST" unit="IU/L" required error={errors.ast}>
                                                    <NumberInput value={data.ast} onChange={(v) => setData('ast', v)} placeholder="e.g. 25" min="0" />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="Fasting Glucose" unit="mg/dL">
                                                    <NumberInput value={data.fasting_glucose} onChange={(v) => setData('fasting_glucose', v)} placeholder="e.g. 95" min="40" unit="mg/dL" />
                                                </Field>
                                                <Field label="Triglycerides" unit="mg/dL">
                                                    <NumberInput value={data.triglycerides} onChange={(v) => setData('triglycerides', v)} placeholder="e.g. 120" min="0" unit="mg/dL" />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="HDL Cholesterol" unit="mg/dL">
                                                    <NumberInput value={data.hdl} onChange={(v) => setData('hdl', v)} placeholder="e.g. 55" min="0" unit="mg/dL" />
                                                </Field>
                                                <Field label="Total Cholesterol" unit="mg/dL">
                                                    <NumberInput value={data.total_cholesterol} onChange={(v) => setData('total_cholesterol', v)} placeholder="e.g. 190" min="0" />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="GGT" unit="IU/L">
                                                    <NumberInput value={data.ggt} onChange={(v) => setData('ggt', v)} placeholder="e.g. 35" min="0" />
                                                </Field>
                                                <Field label="HbA1c" unit="%">
                                                    <NumberInput value={data.hba1c} onChange={(v) => setData('hba1c', v)} placeholder="e.g. 5.5" min="1" max="20" />
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Field label="BP Systolic" unit="mmHg">
                                                    <NumberInput value={data.blood_pressure_systolic} onChange={(v) => setData('blood_pressure_systolic', v)} placeholder="e.g. 120" step="1" min="60" max="300" />
                                                </Field>
                                                <Field label="BP Diastolic" unit="mmHg">
                                                    <NumberInput value={data.blood_pressure_diastolic} onChange={(v) => setData('blood_pressure_diastolic', v)} placeholder="e.g. 80" step="1" min="40" max="200" />
                                                </Field>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile note */}
                                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                                    <svg className="h-4 w-4 flex-shrink-0 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-[#555]">
                                        Your <strong className="text-[#888]">sex</strong> and <strong className="text-[#888]">date of birth</strong> are read from your{' '}
                                        <Link href="/settings/profile" className="text-white underline underline-offset-2 transition hover:text-white/80">
                                            profile settings
                                        </Link>
                                        .
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {processing ? (
                                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            Analyse Risk
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </motion.div>

                            {/* Privacy note */}
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-[#444]" />
                                <p className="text-xs text-[#444]">Your data is encrypted at rest and in transit.</p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
