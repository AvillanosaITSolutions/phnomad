import { GoogleLoginButton } from '../features/auth/google-login-button';
import loginBg from '../assets/login-bg.jpg';

export function LandingPage() {
    return (
        <main className="min-h-screen w-full bg-slate-100">
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
                    </div>
                </div>
            </section>
        </main>
    );
}
