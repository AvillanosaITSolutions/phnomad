import { useState } from 'react';
import { GoogleLoginButton } from '../features/auth/google-login-button';
import loginBg from '../assets/login-bg.jpg';
import infographic from '../assets/infographic.png';

function HowItWorksModal({ onClose }: { onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>
                <img
                    src={infographic}
                    alt="How Visa Reminder Works"
                    className="w-full rounded-2xl"
                />
            </div>
        </div>
    );
}

export function LandingPage() {
    const [showModal, setShowModal] = useState(false);

    return (
        <main className="min-h-screen w-full bg-slate-100">
            {showModal && <HowItWorksModal onClose={() => setShowModal(false)} />}

            <section className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
                <div
                    className="order-2 flex items-center bg-cover bg-center p-6 text-white sm:p-8 lg:order-1 lg:p-10"
                    style={{
                        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.78)), url(${loginBg})`,
                    }}
                >
                    <div className="max-w-xl">
                        <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-5xl">
                            Never miss your visa renewal again
                        </h1>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-slate-100/90 sm:text-base">
                            Built for tourists, nomads, expats, and travelers who need simple renewal reminders.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                            <span>💡</span> How does this work?
                        </button>
                    </div>
                </div>

                <div className="order-1 relative flex flex-col justify-center bg-white p-6 sm:p-10 lg:order-2 lg:p-14">
                    <div className="relative mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Login</p>
                        <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Welcome back</h2>
                        <p className="mt-2 text-sm text-slate-600 sm:text-base">
                            Sign in with Google to view your dashboard, renewal calendar, and reminder settings.
                        </p>

                        <div className="mt-6">
                            <GoogleLoginButton />
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-sm text-teal-600 underline-offset-2 hover:underline transition-colors"
                            >
                                How does this work?
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
