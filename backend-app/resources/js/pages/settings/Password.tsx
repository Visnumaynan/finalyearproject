import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '@/layouts/AppLayout';

export default function Password() {
    const { data, setData, put, processing, errors, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put('/settings/password', {
            onSuccess: () => reset(),
        });
    }

    const inputClass =
        'w-full rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none placeholder-[#333]';

    return (
        <AppLayout>
            <Head title="Change Password" />

            <div className="min-h-screen bg-[#0D0D0D] text-white">
                <div className="border-b border-white/[0.06] px-4 py-4 md:px-8 md:py-5">
                    <h1 className="text-lg font-bold text-white">Change Password</h1>
                    <p className="mt-0.5 text-sm text-[#555]">Ensure your account uses a strong password</p>
                </div>

                <div className="px-4 py-4 md:px-8 md:py-6">
                    <div className="mx-auto max-w-md">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="rounded-2xl border border-white/[0.06] bg-[#111] p-6 md:p-7"
                        >
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#666]">Current password</label>
                                    <input
                                        type="password"
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        autoComplete="current-password"
                                        className={inputClass}
                                    />
                                    {errors.current_password && (
                                        <p className="mt-1 text-xs text-red-400">{errors.current_password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#666]">New password</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        className={inputClass}
                                    />
                                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[#666]">Confirm new password</label>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                        className={inputClass}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-400">{errors.password_confirmation}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex h-9 items-center rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                                    >
                                        Update password
                                    </button>
                                    {recentlySuccessful && (
                                        <span className="text-xs text-[#555]">Password updated.</span>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
