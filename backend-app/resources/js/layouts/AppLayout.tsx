import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ChevronRight, LayoutDashboard, LogOut, Menu, Plus, Settings, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Health History', href: '/blood-tests', icon: Activity },
    { label: 'Add Test', href: '/blood-tests/create', icon: Plus },
];

const settingsItems = [
    { label: 'Profile', href: '/settings/profile', icon: Settings },
];

function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
                <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">LiverCare</span>
        </div>
    );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const { url } = usePage();
    const isActive = url.startsWith(href);

    return (
        <Link
            href={href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                isActive
                    ? 'bg-white/10 text-white'
                    : 'text-[#666] hover:bg-white/5 hover:text-white'
            }`}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
            {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />}
        </Link>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b border-white/[0.06] px-4">
                <Logo />
            </div>

            <nav className="flex-1 space-y-0.5 px-2 py-4">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#444]">Main</p>
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
                <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#444]">Settings</p>
                {settingsItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>

            <div className="border-t border-white/[0.06] p-3">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">{user?.name}</p>
                        <p className="truncate text-[10px] text-[#555]">{user?.email}</p>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[#555] transition hover:text-white"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#0A0A0A]">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-shrink-0 border-r border-white/[0.06] bg-[#0A0A0A] lg:flex lg:flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -224 }}
                            animate={{ x: 0 }}
                            exit={{ x: -224 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="fixed inset-y-0 left-0 z-50 w-56 border-r border-white/[0.06] bg-[#0A0A0A] lg:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
                {/* Mobile top bar */}
                <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4 lg:hidden">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666] hover:text-white"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Logo />
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                        {initials}
                    </div>
                </div>

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
