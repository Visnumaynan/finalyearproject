import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AuthLayout from '@/layouts/AuthLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/forgot-password');
    }

    return (
        <AuthLayout title="Reset password" description="Enter your email to receive a reset link">
            <Head title="Forgot Password" />

            {status && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-400"
                >
                    {status}
                </motion.div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={submit}
                className="space-y-4"
            >
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Email address</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoFocus
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#444] transition focus:border-white/20 focus:outline-none"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
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
                        'Send reset link'
                    )}
                </button>

                <p className="text-center text-xs text-[#555]">
                    Remembered it?{' '}
                    <Link href="/login" className="text-white transition hover:text-white/80">
                        Back to sign in
                    </Link>
                </p>
            </motion.form>
        </AuthLayout>
    );
}
