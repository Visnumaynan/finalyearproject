import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        sex: '',
        date_of_birth: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/register');
    }

    const inputClass =
        'w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#444] transition focus:border-white/20 focus:outline-none';

    return (
        <AuthLayout title="Create account" description="Start monitoring your liver health">
            <Head title="Register" />

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={submit}
                className="space-y-4"
            >
                {/* Name */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Full name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                        placeholder="John Smith"
                        className={inputClass}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Email address</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClass}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Sex + Date of birth — side by side */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#888]">Sex</label>
                        <select
                            value={data.sex}
                            onChange={(e) => setData('sex', e.target.value)}
                            className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none"
                        >
                            <option value="" disabled className="text-[#444]">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {errors.sex && <p className="mt-1 text-xs text-red-400">{errors.sex}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#888]">Date of birth</label>
                        <input
                            type="date"
                            value={data.date_of_birth}
                            onChange={(e) => setData('date_of_birth', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none [color-scheme:dark]"
                        />
                        {errors.date_of_birth && (
                            <p className="mt-1 text-xs text-red-400">{errors.date_of_birth}</p>
                        )}
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            placeholder="Min. 8 characters"
                            className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 pr-11 text-sm text-white placeholder-[#444] transition focus:border-white/20 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] transition hover:text-white"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm password */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Confirm password</label>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={inputClass}
                    />
                    {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-red-400">{errors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                    {processing ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        'Create account'
                    )}
                </button>

                <p className="text-center text-xs text-[#555]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white transition hover:text-white/80">
                        Sign in
                    </Link>
                </p>
            </motion.form>
        </AuthLayout>
    );
}
