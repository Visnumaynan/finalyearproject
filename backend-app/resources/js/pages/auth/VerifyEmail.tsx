import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AuthLayout from '@/layouts/AuthLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    function resend(e: React.FormEvent) {
        e.preventDefault();
        post('/email/verification-notification');
    }

    return (
        <AuthLayout title="Verify email" description="Please verify your email address to continue">
            <Head title="Email Verification" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
            >
                {status === 'verification-link-sent' && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
                        A new verification link has been sent to your email address.
                    </div>
                )}

                <p className="text-center text-sm text-[#666]">
                    We sent a verification link to your email. Check your inbox and click the link to activate your account.
                </p>

                <form onSubmit={resend}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                    >
                        Resend verification email
                    </button>
                </form>

                <p className="text-center text-xs text-[#555]">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="text-[#888] transition hover:text-white"
                    >
                        Log out
                    </Link>
                </p>
            </motion.div>
        </AuthLayout>
    );
}
