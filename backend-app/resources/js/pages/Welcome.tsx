import { Link } from '@inertiajs/react';
import { motion, useInView } from 'framer-motion';
import { Activity, Brain, LineChart, Shield, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, duration = 1800) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });

    useEffect(() => {
        if (!inView) return;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [inView, target, duration]);

    return { count, ref };
}

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
    const { count, ref } = useCountUp(value);
    return (
        <div className="flex flex-col items-center gap-1 px-6 py-8 md:px-10">
            <span ref={ref} className="text-3xl font-black text-white md:text-4xl">
                {count}
                {suffix}
            </span>
            <span className="text-center text-xs uppercase tracking-widest text-[#555]">{label}</span>
        </div>
    );
}

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    return (
        <motion.div
            ref={ref}
            variants={stagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export default function Welcome() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] font-sans text-white">
            {/* ── NAVBAR ─────────────────────────────────────────────────── */}
            <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-xl"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
                            <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold tracking-wide text-white">LiverCare</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="rounded-lg px-4 py-2 text-sm text-[#888] transition hover:text-white"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            </motion.nav>

            {/* ── HERO ───────────────────────────────────────────────────── */}
            <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pt-20">
                {/* Subtle radial glow */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[600px] w-[600px] rounded-full bg-white/[0.02] blur-3xl" />
                </div>
                {/* Grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                <div className="relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs font-medium text-[#888]">AI-Powered Liver Health Monitoring</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-black leading-none tracking-tight text-white"
                        style={{ fontSize: 'clamp(2.8rem, 9vw, 6.5rem)' }}
                    >
                        Monitor Your
                        <br />
                        <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                            Liver Health
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#666] md:text-lg"
                    >
                        Submit your blood test results and get instant AI-powered NAFLD risk
                        predictions. Track your progress over time with clinical-grade insights.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                    >
                        <Link
                            href="/register"
                            className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
                        >
                            Start for free
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                        >
                            Sign in
                        </Link>
                    </motion.div>

                    {/* Floating badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-12 flex flex-wrap items-center justify-center gap-3"
                    >
                        {['LightGBM Model', 'Clinical Grade', 'NAFLD Specific', 'Instant Results'].map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-xs text-[#666]"
                            >
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-5 w-3 rounded-full border border-white/20 flex items-start justify-center pt-1"
                    >
                        <div className="h-1.5 w-0.5 rounded-full bg-white/40" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ── STATS BAR ──────────────────────────────────────────────── */}
            <section className="border-y border-white/[0.06] bg-[#0D0D0D]">
                <div className="mx-auto grid max-w-3xl grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <StatItem value={94} suffix="%" label="Prediction accuracy" />
                    <StatItem value={12} suffix="+" label="Biomarkers tracked" />
                    <StatItem value={10} suffix="k+" label="Risk analyses run" />
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────────────────── */}
            <section className="px-5 py-24 md:py-32">
                <div className="mx-auto max-w-6xl">
                    <Section className="mb-16 text-center">
                        <motion.p variants={fadeUp} className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                            Features
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            className="font-black text-white"
                            style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}
                        >
                            Everything you need
                        </motion.h2>
                        <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-lg text-[#666]">
                            A complete platform for monitoring, tracking, and understanding your liver health through AI.
                        </motion.p>
                    </Section>

                    <Section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[
                            {
                                icon: Brain,
                                title: 'AI Risk Prediction',
                                description:
                                    'Our LightGBM model analyses 20+ clinical biomarkers to predict NAFLD risk with 94% accuracy in seconds.',
                                color: 'text-violet-400',
                                bg: 'bg-violet-400/10',
                                border: 'border-violet-400/20',
                            },
                            {
                                icon: LineChart,
                                title: 'Progress Tracking',
                                description:
                                    'Visualise your liver health journey over time with interactive trend charts and detailed history logs.',
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-400/10',
                                border: 'border-emerald-400/20',
                            },
                            {
                                icon: Shield,
                                title: 'Clinical Grade',
                                description:
                                    'Built on peer-reviewed research. TYG index, metabolic ratios, and validated NAFLD biomarkers.',
                                color: 'text-blue-400',
                                bg: 'bg-blue-400/10',
                                border: 'border-blue-400/20',
                            },
                        ].map((f) => (
                            <motion.div
                                key={f.title}
                                variants={fadeUp}
                                whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
                                transition={{ duration: 0.2 }}
                                className="group rounded-2xl border border-white/[0.06] bg-[#111] p-8 md:p-10"
                            >
                                <div className={`mb-5 inline-flex rounded-xl border p-3 ${f.bg} ${f.border}`}>
                                    <f.icon className={`h-5 w-5 ${f.color}`} />
                                </div>
                                <h3 className="mb-3 text-base font-semibold text-white">{f.title}</h3>
                                <p className="text-sm leading-relaxed text-[#666]">{f.description}</p>
                            </motion.div>
                        ))}
                    </Section>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
            <section className="bg-[#0D0D0D] px-5 py-24 md:py-32">
                <div className="mx-auto max-w-5xl">
                    <Section className="mb-16 text-center">
                        <motion.p variants={fadeUp} className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#555]">
                            Process
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            className="font-black text-white"
                            style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}
                        >
                            Three steps to clarity
                        </motion.h2>
                    </Section>

                    <Section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {[
                            {
                                step: '01',
                                icon: Activity,
                                title: 'Enter Blood Results',
                                description: 'Input your latest blood test values — ALT, AST, triglycerides, glucose, and more.',
                            },
                            {
                                step: '02',
                                icon: Brain,
                                title: 'AI Analysis',
                                description:
                                    'Our LightGBM model instantly analyses 20 clinical features and computes your NAFLD risk score.',
                            },
                            {
                                step: '03',
                                icon: Zap,
                                title: 'Get Your Score',
                                description: 'Receive a precise risk percentage, level classification, and personalised health alerts.',
                            },
                        ].map((s) => (
                            <motion.div
                                key={s.step}
                                variants={fadeUp}
                                className="relative rounded-2xl border border-white/[0.06] bg-[#111] p-8"
                            >
                                <span className="absolute right-6 top-6 font-mono text-5xl font-black text-white/[0.04]">
                                    {s.step}
                                </span>
                                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                    <s.icon className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="mb-3 font-semibold text-white">{s.title}</h3>
                                <p className="text-sm leading-relaxed text-[#666]">{s.description}</p>
                            </motion.div>
                        ))}
                    </Section>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <section className="px-5 py-28 md:py-40">
                <div className="mx-auto max-w-3xl text-center">
                    <Section>
                        <motion.h2
                            variants={fadeUp}
                            className="font-black text-white"
                            style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}
                        >
                            Take control of your
                            <br />
                            <span className="bg-gradient-to-r from-white to-white/30 bg-clip-text text-transparent">
                                liver health today
                            </span>
                        </motion.h2>
                        <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-md text-[#666]">
                            Free to use. No credit card required. Get your first risk assessment in under 2 minutes.
                        </motion.p>
                        <motion.div variants={fadeUp} className="mt-10 flex justify-center">
                            <Link
                                href="/register"
                                className="inline-flex h-13 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-95"
                            >
                                Create free account
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </motion.div>
                    </Section>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <footer className="border-t border-white/[0.06] px-5 py-8">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                            <svg className="h-3.5 w-3.5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                            </svg>
                        </div>
                        <span className="text-sm font-semibold text-white">LiverCare</span>
                    </div>
                    <p className="text-xs text-[#444]">© {new Date().getFullYear()} LiverCare. For research and monitoring purposes only.</p>
                </div>
            </footer>
        </div>
    );
}
