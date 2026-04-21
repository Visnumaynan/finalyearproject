import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import AuthLayout from '@/layouts/AuthLayout';

export default function Login({ canResetPassword }: { canResetPassword?: boolean }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <AuthLayout title="Welcome back" description="Sign in to your LiverCare account">
            <Head title="Sign in" />

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={submit}
                className="space-y-4"
            >
                {/* Email */}
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Email address</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#444] transition focus:border-white/20 focus:outline-none"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-medium text-[#888]">Password</label>
                        {canResetPassword && (
                            <Link href="/forgot-password" className="text-xs text-[#555] transition hover:text-white">
                                Forgot password?
                            </Link>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="current-password"
                            placeholder="••••••••"
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

                {/* Remember */}
                <label className="flex cursor-pointer items-center gap-2.5">
                    <div
                        onClick={() => setData('remember', !data.remember)}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                            data.remember ? 'border-white bg-white' : 'border-white/20 bg-transparent'
                        }`}
                    >
                        {data.remember && (
                            <svg className="h-2.5 w-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                    <span className="text-xs text-[#666]">Remember me</span>
                </label>

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
                        'Sign in'
                    )}
                </button>

                <p className="text-center text-xs text-[#555]">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-white transition hover:text-white/80">
                        Create one
                    </Link>
                </p>
            </motion.form>
        </AuthLayout>
    );
}
