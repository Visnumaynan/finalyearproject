import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AuthLayout from '@/layouts/AuthLayout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({ password: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/user/confirm-password');
    }

    return (
        <AuthLayout title="Confirm password" description="Please confirm your password to continue">
            <Head title="Confirm Password" />

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={submit}
                className="space-y-4"
            >
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#888]">Password</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-white placeholder-[#444] transition focus:border-white/20 focus:outline-none"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                    Confirm
                </button>
            </motion.form>
        </AuthLayout>
    );
}
