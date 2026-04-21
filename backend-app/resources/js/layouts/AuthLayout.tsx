import { Link } from '@inertiajs/react';

export default function AuthLayout({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href="/" className="flex flex-col items-center gap-3 transition-opacity hover:opacity-80">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-white">LiverCare</span>
                        </Link>

                        {(title || description) && (
                            <div className="space-y-1 text-center">
                                {title && <h1 className="text-xl font-semibold text-white">{title}</h1>}
                                {description && <p className="text-sm text-[#666]">{description}</p>}
                            </div>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
