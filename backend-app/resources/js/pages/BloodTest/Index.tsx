import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Download, Minus, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/layouts/AppLayout';

interface Prediction { id: number; risk_score: number; risk_level: 'Low' | 'Medium' | 'High'; model_used: string; date: string }
interface BloodTest { id: number; test_date: string; prediction: Prediction | null; derived: { tyg_index: number | null; tg_hdl_ratio: number | null; tyg_bmi: number | null } | null }
interface AlertItem { id: number; alert_type: string; message: string; previous_risk: string; current_risk: string }

function riskColor(level?: string) {
    if (level === 'High') return '#EF4444';
    if (level === 'Medium') return '#F59E0B';
    return '#22C55E';
}

const PAGE_SIZE = 8;

export default function Index(props: {
    tests: BloodTest[];
    unreadAlerts: AlertItem[];
    latestPrediction: { risk_score: number; risk_level: string; date: string } | null;
    aiAvailable: boolean;
}) {
    const { props: pageProps } = usePage();
    const flash = (pageProps as any).flash as Record<string, string> | undefined;

    const [riskFilter, setRiskFilter] = useState<'All Levels' | 'Low' | 'Medium' | 'High'>('All Levels');
    const [currentPage, setCurrentPage] = useState(1);
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const deleteForm = useForm({});

    function dismiss(id: number) {
        setDismissed((prev) => new Set([...prev, id]));
        router.post(`/alerts/${id}/dismiss`, {}, { preserveScroll: true });
    }
    const retryForm = useForm({});

    const filtered = riskFilter === 'All Levels'
        ? props.tests
        : props.tests.filter((t) => t.prediction?.risk_level === riskFilter);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const showing = (() => {
        if (filtered.length === 0) return 'No records';
        const from = (currentPage - 1) * PAGE_SIZE + 1;
        const to = Math.min(currentPage * PAGE_SIZE, filtered.length);
        return `Showing ${from}–${to} of ${filtered.length}`;
    })();

    const chronological = [...props.tests].reverse().filter((t) => t.prediction);
    const chartData = chronological.map((t) => ({
        date: new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: +(t.prediction!.risk_score * 100).toFixed(1),
        risk_level: t.prediction!.risk_level,
    }));

    function trendIcon(test: BloodTest, i: number) {
        if (i >= filtered.length - 1 || !test.prediction) return null;
        const next = filtered[i + 1];
        if (!next.prediction) return null;
        const d = test.prediction.risk_score - next.prediction.risk_score;
        if (d > 0.001) return 'up';
        if (d < -0.001) return 'down';
        return 'flat';
    }

    return (
        <AppLayout>
            <Head title="Health History" />

            <div className="min-h-screen bg-[#0D0D0D] text-white">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 md:px-8 md:py-5">
                    <div>
                        <h1 className="text-lg font-bold text-white md:text-xl">Health History</h1>
                        <p className="mt-0.5 hidden text-sm text-[#555] sm:block">Track your liver health journey</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-[#555] transition hover:text-white md:w-auto md:gap-2 md:px-4">
                            <Download className="h-4 w-4" />
                            <span className="hidden text-sm md:inline">Export</span>
                        </button>
                        <Link
                            href="/blood-tests/create"
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black transition hover:bg-white/90 md:w-auto md:gap-2 md:px-4"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden text-sm font-semibold md:inline">Add Test</span>
                        </Link>
                    </div>
                </div>

                <div className="space-y-4 px-4 py-4 md:space-y-5 md:px-8 md:py-6">
                    {/* Alerts */}
                    {props.unreadAlerts
                        .filter((a) => !dismissed.has(a.id))
                        .map((alert) => {
                            const isCritical = alert.alert_type === 'Critical';
                            return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className={`flex items-center justify-between rounded-2xl border p-4 ${
                                    isCritical
                                        ? 'border-red-500/20 bg-red-500/5'
                                        : 'border-amber-500/20 bg-amber-500/5'
                                }`}
                            >
                                <p className={`text-sm ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>{alert.message}</p>
                                <button onClick={() => dismiss(alert.id)} className="ml-4 flex-shrink-0 text-[#555] transition hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                            );
                        })}

                    {flash?.success && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                            {flash.success}
                        </div>
                    )}
                    {flash?.warning && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-400">
                            {flash.warning}
                        </div>
                    )}

                    {/* Chart */}
                    <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 md:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <p className="text-sm font-medium text-[#888]">Risk Trend</p>
                            <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#555]">
                                Last 12 months
                            </span>
                        </div>
                        {chartData.length > 1 ? (
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                                        <defs>
                                            <linearGradient id="trendGradHigh" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="trendGradMed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="trendGradLow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.25} />
                                                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                                            labelStyle={{ color: '#888' }}
                                            formatter={(v: number, _: string, entry: any) => {
                                                const c = riskColor(entry?.payload?.risk_level);
                                                return [<span style={{ color: c }}>{v}% — {entry?.payload?.risk_level}</span>, 'Risk'];
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke={riskColor(chartData[chartData.length - 1]?.risk_level)}
                                            strokeWidth={2}
                                            fill={`url(#trendGrad${chartData[chartData.length - 1]?.risk_level})`}
                                            dot={(dotProps: any) => {
                                                const c = riskColor(dotProps.payload?.risk_level);
                                                return <circle key={dotProps.key} cx={dotProps.cx} cy={dotProps.cy} r={4} fill={c} />;
                                            }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.06]">
                                <p className="text-sm text-[#444]">Need at least 2 tests for trend</p>
                                <Link href="/blood-tests/create" className="text-xs text-[#888] transition hover:text-white">
                                    Add a test →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#111] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex flex-wrap items-end gap-3">
                            <div>
                                <label className="mb-1 block text-xs text-[#444]">Risk Level</label>
                                <select
                                    value={riskFilter}
                                    onChange={(e) => { setRiskFilter(e.target.value as typeof riskFilter); setCurrentPage(1); }}
                                    className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] px-3 py-2 text-sm text-[#888] focus:outline-none"
                                >
                                    {['All Levels', 'Low', 'Medium', 'High'].map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                            {riskFilter !== 'All Levels' && (
                                <button
                                    onClick={() => { setRiskFilter('All Levels'); setCurrentPage(1); }}
                                    className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-[#666] transition hover:text-white"
                                >
                                    <X className="h-3 w-3" /> Clear
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-[#444]">{showing}</p>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111]">
                        <div className="overflow-x-auto">
                            <div className="grid min-w-[580px] grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/[0.06] px-4 py-3 md:px-6">
                                {['Date', 'Score (%)', 'Risk Level', 'Trend', 'Action'].map((h, i) => (
                                    <span key={h} className={`text-xs font-semibold uppercase tracking-wider text-[#444] ${i === 4 ? 'text-right' : ''}`}>
                                        {h}
                                    </span>
                                ))}
                            </div>

                            {paged.length > 0 ? (
                                paged.map((test, i) => (
                                    <div
                                        key={test.id}
                                        className="grid min-w-[580px] grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-white/[0.04] px-4 py-4 last:border-0 transition-colors hover:bg-white/[0.02] md:px-6"
                                    >
                                        <span className="font-mono text-sm text-[#888]">{test.test_date}</span>

                                        <span className="text-sm font-semibold text-white">
                                            {test.prediction
                                                ? `${(test.prediction.risk_score * 100).toFixed(1)}%`
                                                : '—'}
                                        </span>

                                        <div>
                                            {test.prediction ? (
                                                <span
                                                    className="rounded-md px-2.5 py-1 text-xs font-bold uppercase"
                                                    style={{
                                                        color: riskColor(test.prediction.risk_level),
                                                        backgroundColor: `${riskColor(test.prediction.risk_level)}20`,
                                                    }}
                                                >
                                                    {test.prediction.risk_level}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-[#444]">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#444]" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            {(() => {
                                                const icon = trendIcon(test, i);
                                                if (icon === 'up') return <TrendingUp className="h-4 w-4 text-red-400" />;
                                                if (icon === 'down') return <TrendingDown className="h-4 w-4 text-emerald-400" />;
                                                if (icon === 'flat') return <Minus className="h-4 w-4 text-[#555]" />;
                                                return <span className="text-[#444]">—</span>;
                                            })()}
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            {!test.prediction && (
                                                <button
                                                    onClick={() => retryForm.post(`/blood-tests/${test.id}/retry`)}
                                                    disabled={retryForm.processing}
                                                    className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-40"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                            {confirmDelete === test.id ? (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => {
                                                            deleteForm.delete(`/blood-tests/${test.id}`, {
                                                                onSuccess: () => setConfirmDelete(null),
                                                            });
                                                        }}
                                                        disabled={deleteForm.processing}
                                                        className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-400 disabled:opacity-40"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-[#555] transition hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(test.id)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] text-[#444] transition hover:border-red-500/30 hover:text-red-400"
                                                    title="Delete record"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-14">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                                        <svg className="h-5 w-5 text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-[#444]">No records found</p>
                                    <button onClick={() => setRiskFilter('All Levels')} className="text-xs text-[#888] transition hover:text-white">
                                        Clear filter
                                    </button>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 md:px-6">
                                <p className="text-xs text-[#444]">{showing}</p>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => p - 1)}
                                        disabled={currentPage <= 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#555] transition hover:text-white disabled:opacity-30"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => p + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#555] transition hover:text-white disabled:opacity-30"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!props.aiAvailable && (
                        <p className="text-center text-xs text-[#444]">
                            AI prediction service is offline. Saved tests will be predicted once it recovers.
                        </p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
