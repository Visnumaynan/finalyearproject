import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import AppLayout from '@/layouts/AppLayout';

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-6 md:p-7">
            <div className="mb-6">
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                <p className="mt-1 text-xs text-[#555]">{description}</p>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-[#666]">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

const inputClass = "w-full rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none placeholder-[#333]";

export default function Profile({
    mustVerifyEmail,
    status,
    healthProfile,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    healthProfile: { sex: string | null; date_of_birth: string | null } | null;
}) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const profileForm = useForm({ name: user?.name ?? '', email: user?.email ?? '' });
    const healthForm = useForm({
        sex: healthProfile?.sex ?? '',
        date_of_birth: healthProfile?.date_of_birth ?? '',
    });

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profileForm.patch('/settings/profile');
    }

    function submitHealth(e: React.FormEvent) {
        e.preventDefault();
        healthForm.patch('/settings/profile/health');
    }

    return (
        <AppLayout>
            <Head title="Profile Settings" />

            <div className="min-h-screen bg-[#0D0D0D] text-white">
                <div className="border-b border-white/[0.06] px-4 py-4 md:px-8 md:py-5">
                    <h1 className="text-lg font-bold text-white">Profile Settings</h1>
                    <p className="mt-0.5 text-sm text-[#555]">Manage your account and health profile</p>
                </div>

                <div className="space-y-4 px-4 py-4 md:px-8 md:py-6">
                    <div className="mx-auto max-w-2xl space-y-4">
                        {/* Profile information */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                            <Section title="Profile information" description="Update your name and email address">
                                <form onSubmit={submitProfile} className="space-y-4">
                                    <InputField label="Full name" error={profileForm.errors.name}>
                                        <input
                                            type="text"
                                            value={profileForm.data.name}
                                            onChange={(e) => profileForm.setData('name', e.target.value)}
                                            autoComplete="name"
                                            placeholder="John Smith"
                                            className={inputClass}
                                        />
                                    </InputField>

                                    <InputField label="Email address" error={profileForm.errors.email}>
                                        <input
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={(e) => profileForm.setData('email', e.target.value)}
                                            autoComplete="email"
                                            className={inputClass}
                                        />
                                    </InputField>

                                    {mustVerifyEmail && !user?.email_verified_at && (
                                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-xs text-amber-300">
                                            Your email is unverified.{' '}
                                            <Link
                                                href="/email/verification-notification"
                                                method="post"
                                                as="button"
                                                className="underline underline-offset-2 transition hover:text-white"
                                            >
                                                Resend verification email
                                            </Link>
                                        </div>
                                    )}

                                    {status === 'verification-link-sent' && (
                                        <p className="text-xs text-emerald-400">Verification link sent to your email.</p>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={profileForm.processing}
                                            className="flex h-9 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                                        >
                                            {profileForm.recentlySuccessful && <Check className="h-4 w-4 text-emerald-600" />}
                                            Save
                                        </button>
                                        {profileForm.recentlySuccessful && (
                                            <span className="text-xs text-[#555]">Saved.</span>
                                        )}
                                    </div>
                                </form>
                            </Section>
                        </motion.div>

                        {/* Health profile */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
                            <Section
                                title="Health profile"
                                description="Required for NAFLD risk prediction. Sex and age are used by the AI model."
                            >
                                <form onSubmit={submitHealth} className="space-y-4">
                                    <InputField label="Biological Sex" error={healthForm.errors.sex}>
                                        <select
                                            value={healthForm.data.sex}
                                            onChange={(e) => healthForm.setData('sex', e.target.value)}
                                            className="w-full rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-4 py-3 text-sm text-white transition focus:border-white/20 focus:outline-none"
                                        >
                                            <option value="">— Select —</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </InputField>

                                    <InputField label="Date of Birth" error={healthForm.errors.date_of_birth}>
                                        <input
                                            type="date"
                                            value={healthForm.data.date_of_birth}
                                            max={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => healthForm.setData('date_of_birth', e.target.value)}
                                            className={inputClass}
                                        />
                                    </InputField>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={healthForm.processing}
                                            className="flex h-9 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                                        >
                                            Save health profile
                                        </button>
                                        {(healthForm.recentlySuccessful || status === 'health-profile-updated') && (
                                            <span className="text-xs text-[#555]">Saved.</span>
                                        )}
                                    </div>
                                </form>
                            </Section>
                        </motion.div>

                        {/* Danger zone */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
                            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-6 md:p-7">
                                <h2 className="mb-1 text-sm font-semibold text-white">Delete account</h2>
                                <p className="mb-5 text-xs text-[#555]">
                                    Once your account is deleted, all data will be permanently removed. This action cannot be undone.
                                </p>
                                <Link
                                    href="/settings/profile/delete"
                                    method="delete"
                                    as="button"
                                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                                >
                                    Delete account
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
