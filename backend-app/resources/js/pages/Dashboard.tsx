import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/layouts/AppLayout';

interface LatestPrediction {
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    prediction_date: string;
}
interface TrendPoint { date: string; score: number }
interface RecentTest { id: number; date: string; score: number; risk_level: string }
interface AlertItem { id: number; alert_type: string; message: string; risk_level: string }
interface ClinicalBio { bmi: number | null; alt: number | null; systolic: number | null; diastolic: number | null; age: number | null }

function riskColor(level?: string) {
    if (level === 'High') return '#EF4444';
    if (level === 'Medium') return '#F59E0B';
    return '#22C55E';
}

function riskBadge(level?: string) {
    if (level === 'High') return 'bg-red-500/15 text-red-400 border-red-500/25';
    if (level === 'Medium') return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
}

function useCountUp(target: number, duration = 1400) {
    const [val, setVal] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        if (started.current || target === 0) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setVal(+(p * target).toFixed(1));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return val;
}

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Dashboard(props: {
    latest: LatestPrediction | null;
    trend: { diff: number; direction: 'up' | 'down' } | null;
    distribution: { Low: number; Medium: number; High: number };
    trendSeries: TrendPoint[];
    recentTests: RecentTest[];
    clinicalBio: ClinicalBio | null;
    unreadAlerts: AlertItem[];
}) {
    const { auth } = usePage().props as any;
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';
    const displayScore = useCountUp(props.latest ? props.latest.risk_score : 0);
    const totalTests = props.distribution.Low + props.distribution.Medium + props.distribution.High;

    const chartData = props.trendSeries.map((p) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short' }),
        score: p.score,
    }));

    const color = riskColor(props.latest?.risk_level);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-[#0D0D0D] text-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 md:px-8 md:py-5">
                    <div>
                        <h1 className="text-lg font-bold text-white md:text-xl">
                            Welcome back, {firstName}
                        </h1>
                        <p className="mt-0.5 hidden text-sm text-[#555] sm:block">
                            Your liver health dashboard
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/blood-tests/create"
                            className="flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Test</span>
                        </Link>
                        <div className="relative">
                            <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-[#555] transition hover:text-white">
                                <Bell className="h-4 w-4" />
                            </button>
                            {props.unreadAlerts.length > 0 && (
                                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 px-4 py-4 md:space-y-5 md:px-8 md:py-6">
                    {/* ── ROW 1: Hero stats ── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Risk score card */}
                        <motion.div
                            custom={0}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="rounded-2xl border border-white/[0.06] bg-[#111] p-6"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <p className="text-sm font-medium text-[#888]">Your Liver Health</p>
                                {props.latest && (
                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${riskBadge(props.latest.risk_level)}`}>
                                        {props.latest.risk_level} Risk
                                    </span>
                                )}
                            </div>

                            {props.latest ? (
                                <>
                                    <div className="flex items-end gap-1">
                                        <span className="text-7xl font-black leading-none" style={{ color }}>
                                            {displayScore}
                                        </span>
                                        <span className="mb-2 text-3xl font-bold text-[#444]">%</span>
                                    </div>
                                    <p className="mt-1 text-sm text-[#555]">Risk Score</p>

                                    {props.trend && (
                                        <div className="mt-4 flex items-center gap-2">
                                            {props.trend.direction === 'down' ? (
                                                <TrendingDown className="h-4 w-4 text-emerald-400" />
                                            ) : (
                                                <TrendingUp className="h-4 w-4 text-red-400" />
                                            )}
                                            <span className={`text-xs font-medium ${props.trend.direction === 'down' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {props.trend.direction === 'down' ? '↓' : '↑'} {props.trend.diff}% from last test
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                        <p className="text-xs leading-relaxed text-[#666]">
                                            {props.latest.risk_level === 'High' && (
                                                <>Your risk is <strong className="text-red-400">elevated</strong>. Consider medical advice.</>
                                            )}
                                            {props.latest.risk_level === 'Medium' && (
                                                <>Your risk is <strong className="text-amber-400">moderate</strong>. Consider lifestyle changes.</>
                                            )}
                                            {props.latest.risk_level === 'Low' && (
                                                <>Your liver health looks <strong className="text-emerald-400">healthy</strong>. Keep it up!</>
                                            )}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-4xl font-black text-[#333]">—</p>
                                    <p className="mt-2 text-sm text-[#555]">No prediction yet</p>
                                    <Link
                                        href="/blood-tests/create"
                                        className="mt-3 inline-block rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2 text-xs font-medium text-[#888] transition hover:bg-white/10 hover:text-white"
                                    >
                                        Submit your first test
                                    </Link>
                                </div>
                            )}
                        </motion.div>

                        {/* Distribution card */}
                        <motion.div
                            custom={1}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="rounded-2xl border border-white/[0.06] bg-[#111] p-6"
                        >
                            <p className="mb-5 text-sm font-medium text-[#888]">Risk Distribution</p>

                            {totalTests > 0 ? (
                                <div className="space-y-3">
                                    {(['High', 'Medium', 'Low'] as const).map((level) => {
                                        const count = props.distribution[level];
                                        const pct = totalTests > 0 ? Math.round((count / totalTests) * 100) : 0;
                                        const barColor = riskColor(level);
                                        return (
                                            <div key={level}>
                                                <div className="mb-1.5 flex justify-between text-xs">
                                                    <span className="text-[#666]">{level}</span>
                                                    <span className="font-semibold text-white">{count} tests</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.8, delay: 0.3 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: barColor }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <p className="pt-2 text-xs text-[#444]">{totalTests} total tests</p>
                                </div>
                            ) : (
                                <div className="flex h-32 items-center justify-center">
                                    <p className="text-sm text-[#444]">No tests yet</p>
                                </div>
                            )}

                            {props.clinicalBio && (
                                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-5">
                                    {[
                                        { label: 'BMI', value: props.clinicalBio.bmi?.toFixed(1) ?? '—' },
                                        { label: 'ALT', value: props.clinicalBio.alt ? `${props.clinicalBio.alt} IU/L` : '—' },
                                        { label: 'Systolic', value: props.clinicalBio.systolic ? `${props.clinicalBio.systolic} mmHg` : '—' },
                                        { label: 'Age', value: props.clinicalBio.age ? `${props.clinicalBio.age} yrs` : '—' },
                                    ].map((b) => (
                                        <div key={b.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                                            <p className="text-[10px] text-[#555]">{b.label}</p>
                                            <p className="mt-0.5 text-sm font-semibold text-white">{b.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* ── ROW 2: Chart + Table ── */}
                    <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-5">
                        {/* Trend chart */}
                        <motion.div
                            custom={2}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="col-span-1 rounded-2xl border border-white/[0.06] bg-[#111] p-4 md:p-6 lg:col-span-3"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm font-medium text-[#888]">Progress Over Time</p>
                                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#555]">
                                    Last 6 months
                                </span>
                            </div>

                            {chartData.length > 1 ? (
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                                            <defs>
                                                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                                                labelStyle={{ color: '#888' }}
                                                formatter={(v: number) => [`${v}%`, 'Risk']}
                                            />
                                            <Area type="monotone" dataKey="score" stroke={color} strokeWidth={2} fill="url(#riskGrad)" dot={{ fill: color, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06]">
                                    <p className="text-sm text-[#444]">Need at least 2 tests to see trend</p>
                                    <Link href="/blood-tests/create" className="text-xs text-[#888] transition hover:text-white">
                                        Add a test →
                                    </Link>
                                </div>
                            )}
                        </motion.div>

                        {/* Recent records */}
                        <motion.div
                            custom={3}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="col-span-1 rounded-2xl border border-white/[0.06] bg-[#111] p-4 md:p-6 lg:col-span-2"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm font-medium text-[#888]">Recent Records</p>
                                <Link href="/blood-tests" className="text-xs text-[#444] transition hover:text-white">
                                    View all
                                </Link>
                            </div>

                            {props.recentTests.length > 0 ? (
                                <div>
                                    <div className="mb-2 grid grid-cols-3 gap-2">
                                        <span className="text-xs text-[#444]">Date</span>
                                        <span className="text-xs text-[#444]">Score</span>
                                        <span className="text-xs text-[#444]">Level</span>
                                    </div>
                                    {props.recentTests.map((test) => (
                                        <div key={test.id} className="grid grid-cols-3 items-center gap-2 border-t border-white/[0.04] py-2.5">
                                            <span className="font-mono text-xs text-[#666]">{test.date}</span>
                                            <span className="text-xs font-semibold text-white">{test.score}%</span>
                                            <span
                                                className="w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                                                style={{
                                                    color: riskColor(test.risk_level),
                                                    backgroundColor: `${riskColor(test.risk_level)}20`,
                                                }}
                                            >
                                                {test.risk_level}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-32 flex-col items-center justify-center gap-2">
                                    <p className="text-sm text-[#444]">No records yet</p>
                                    <Link href="/blood-tests/create" className="text-xs text-[#888] transition hover:text-white">
                                        Add your first test
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* ── Alert bar ── */}
                    {props.latest && props.latest.risk_level !== 'Low' && (
                        <motion.div
                            custom={4}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                                props.latest.risk_level === 'High'
                                    ? 'border-red-500/20 bg-red-500/5'
                                    : 'border-amber-500/20 bg-amber-500/5'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${props.latest.risk_level === 'High' ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                                    <svg className={`h-5 w-5 ${props.latest.risk_level === 'High' ? 'text-red-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Your liver risk is higher than normal.</p>
                                    <p className="mt-0.5 text-xs text-[#666]">Consider consulting a doctor for proper evaluation.</p>
                                </div>
                            </div>
                            <Link
                                href="/blood-tests/create"
                                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                                    props.latest.risk_level === 'High' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'
                                }`}
                            >
                                Take Action
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
