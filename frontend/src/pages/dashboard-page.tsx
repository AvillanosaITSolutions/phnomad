import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { getVisas } from '../features/visa/visa-api';
import { sendReminderNow } from '../features/notifications/notifications-api';
import { daysUntil, visaStatus } from '../lib/date';
import { queryClient } from '../app/query-client';
import { getMySubscription } from '../features/subscriptions/subscriptions-api';
import { formatVisaType, getVisaRule } from '../features/visa/visa-rules';

export function DashboardPage() {
    const { token, user, logout } = useAuth();
    const [sendNowMessage, setSendNowMessage] = useState<string | null>(null);
    const [sendNowError, setSendNowError] = useState<string | null>(null);

    const visasQuery = useQuery({
        queryKey: ['visas'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getVisas(token);
        },
        enabled: Boolean(token),
    });

    const subscriptionQuery = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getMySubscription(token);
        },
        enabled: Boolean(token),
    });

    const sendNowMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error('Missing token');
            return sendReminderNow(token);
        },
        onSuccess: async (result) => {
            await queryClient.invalidateQueries({ queryKey: ['subscription'] });
            setSendNowError(null);
            setSendNowMessage(
                result.processed > 0
                    ? `Reminder sent now for ${result.processed} visa${result.processed > 1 ? 's' : ''}.`
                    : 'No visas found to send reminders for.',
            );
        },
        onError: () => {
            setSendNowMessage(null);
            setSendNowError('Unable to send reminder now. Please try again.');
        },
    });

    if (visasQuery.isLoading) {
        return <div className="flex min-h-screen items-center justify-center p-6 text-center text-lg text-slate-600">Loading dashboard...</div>;
    }

    const visa = visasQuery.data?.[0];
    if (!visa) {
        return <Navigate to="/onboarding" replace />;
    }

    const smsCredits = subscriptionQuery.data?.smsCredits ?? 0;
    const canSendNow = smsCredits > 0;
    const daysLeft = daysUntil(visa.expiryDate);
    const rule = getVisaRule(visa.visaType);
    const status = visaStatus(daysLeft);

    return (
        <main className="mx-auto min-h-screen w-full bg-gradient-to-b from-slate-50 to-white">
            {/* ========== MOBILE LAYOUT (hidden on lg+) ========== */}
            <div className="lg:hidden px-4 py-6">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center gap-4">
                    <div className="text-center">
                        <p className="text-base text-slate-600">Welcome, <strong>{user?.name}</strong></p>
                        <h1 className="mt-1 text-4xl font-bold text-slate-900">Visa Dashboard</h1>
                    </div>
                    <button
                        className="rounded-xl bg-slate-200 px-6 py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-300"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>

                {/* MAIN COUNTDOWN SECTION */}
                <section className="mb-8 rounded-3xl border-4 border-slate-900 bg-gradient-to-b from-slate-50 to-white p-8 shadow-lg">
                    <p className="text-center text-lg font-semibold uppercase tracking-widest text-slate-700">{status}</p>

                    <div className="mt-6 text-center">
                        <p className="text-8xl font-bold text-slate-900">{Math.max(daysLeft, 0)}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-700">DAYS LEFT</p>
                    </div>

                    <p className="mt-6 text-center text-xl text-slate-600">
                        Your <strong>{visa.country}</strong> visa expires on <strong>{new Date(visa.expiryDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </p>

                    <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900">Your Visa Information</h2>
                        <div className="mt-6 space-y-5">
                            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                                <span className="text-lg font-semibold text-slate-700">Country</span>
                                <span className="text-xl font-bold text-slate-900">{visa.country}</span>
                            </div>
                            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                                <span className="text-lg font-semibold text-slate-700">Visa Type</span>
                                <span className="text-xl font-bold text-slate-900">{formatVisaType(visa.visaType)}</span>
                            </div>
                            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                                <span className="text-lg font-semibold text-slate-700">SMS Reminders</span>
                                <span className={`text-xl font-bold ${visa.smsEnabled ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {visa.smsEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-slate-700">Email Reminders</span>
                                <span className={`text-xl font-bold ${visa.emailEnabled ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {visa.emailEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SMS Credits */}
                    <div className="mt-6 rounded-2xl bg-blue-50 p-6 shadow-sm">
                        <h3 className="text-2xl font-bold text-blue-900">SMS Credits</h3>
                        <p className="mt-3 text-5xl font-bold text-blue-700">{subscriptionQuery.isLoading ? '...' : smsCredits}</p>
                        <p className="mt-2 text-lg text-blue-800">credits remaining</p>
                    </div>
                </section>

                {/* NEXT STEPS / GUIDANCE SECTION */}
                <section className="mb-8 rounded-3xl border-4 border-slate-900 bg-gradient-to-b from-amber-50 to-white p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-slate-900">What to Do Next</h2>
                    <div className="mt-6 space-y-4">
                        {rule.nextActions.map((action, idx) => (
                            <div key={idx} className="rounded-2xl bg-white p-4 shadow-sm border-l-4 border-amber-500">
                                <p className="text-lg font-semibold text-slate-900">{action}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ACTION BUTTONS */}
                <section className="mb-8 space-y-3">
                    <button
                        className="w-full rounded-2xl bg-emerald-600 px-6 py-5 text-2xl font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={sendNowMutation.isPending || !canSendNow}
                        onClick={async () => {
                            if (!canSendNow) return;
                            await sendNowMutation.mutateAsync();
                        }}
                    >
                        {sendNowMutation.isPending
                            ? '⏳ Sending...'
                            : canSendNow
                                ? '📱 Send Reminder Now'
                                : '📱 No SMS Credits'}
                    </button>

                    <Link
                        className="block rounded-2xl bg-slate-900 px-6 py-5 text-center text-2xl font-bold text-white transition hover:bg-slate-800"
                        to="/settings"
                    >
                        ⚙️ Update Reminder Settings
                    </Link>

                    <Link
                        className="block rounded-2xl bg-slate-600 px-6 py-5 text-center text-2xl font-bold text-white transition hover:bg-slate-700"
                        to="/topup"
                    >
                        💳 Add SMS Credits
                    </Link>

                    <Link
                        className="block rounded-2xl bg-slate-500 px-6 py-5 text-center text-2xl font-bold text-white transition hover:bg-slate-600"
                        to={`/visas/${visa.id}/edit`}
                    >
                        ✏️ Edit Visa Details
                    </Link>
                </section>

                {/* Messages */}
                {sendNowMessage && (
                    <div className="mb-6 rounded-2xl bg-emerald-100 p-6 shadow-sm">
                        <p className="text-lg font-semibold text-emerald-800">{sendNowMessage}</p>
                    </div>
                )}
                {sendNowError && (
                    <div className="mb-6 rounded-2xl bg-rose-100 p-6 shadow-sm">
                        <p className="text-lg font-semibold text-rose-800">{sendNowError}</p>
                    </div>
                )}
            </div>

            {/* ========== DESKTOP LAYOUT (lg+) ========== */}
            <div className="hidden lg:block px-8 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Welcome back</p>
                        <h1 className="text-4xl font-bold text-slate-900">{user?.name}'s Visa Dashboard</h1>
                    </div>
                    <button
                        className="rounded-xl bg-slate-200 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-300"
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Main Info */}
                    <div className="col-span-2 space-y-6">
                        {/* Countdown Card */}
                        <section className="rounded-2xl border-2 border-slate-900 bg-gradient-to-br from-slate-50 to-white p-8 shadow-lg">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-600">{status}</p>
                                    <p className="mt-2 text-6xl font-bold text-slate-900">{Math.max(daysLeft, 0)}</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-700">days remaining</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-600">Expires on</p>
                                    <p className="text-xl font-bold text-slate-900">{new Date(visa.expiryDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </section>

                        {/* Visa Details Grid */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Country</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{visa.country}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visa Type</p>
                                <p className="mt-2 text-3xl font-bold text-slate-900">{formatVisaType(visa.visaType)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">SMS Reminders</p>
                                <p className={`mt-2 text-2xl font-bold ${visa.smsEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {visa.smsEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Reminders</p>
                                <p className={`mt-2 text-2xl font-bold ${visa.emailEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {visa.emailEnabled ? '✓ Enabled' : '✗ Disabled'}
                                </p>
                            </div>
                        </section>

                        {/* Next Steps */}
                        <section className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900">Recommended Actions</h2>
                            <div className="mt-4 space-y-2">
                                {rule.nextActions.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="mt-1 text-lg text-amber-600">→</span>
                                        <p className="text-base text-slate-700">{action}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Compliance Checklist */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900">Compliance Checklist</h2>
                            <ul className="mt-4 space-y-2">
                                {rule.complianceChecklist.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                                        <span className="text-emerald-600">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Quick Actions */}
                    <div className="space-y-6">
                        {/* SMS Credits */}
                        <section className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 p-6 shadow-sm border border-blue-200">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-900">SMS Credits</h3>
                            <p className="mt-3 text-5xl font-bold text-blue-700">{subscriptionQuery.isLoading ? '...' : smsCredits}</p>
                            <p className="mt-1 text-sm text-blue-800">credits available</p>
                        </section>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-base font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={sendNowMutation.isPending || !canSendNow}
                                onClick={async () => {
                                    if (!canSendNow) return;
                                    await sendNowMutation.mutateAsync();
                                }}
                            >
                                {sendNowMutation.isPending
                                    ? '⏳ Sending...'
                                    : canSendNow
                                        ? '📱 Send Now'
                                        : '📱 No SMS Credits'}
                            </button>

                            <Link
                                className="block rounded-xl bg-slate-900 px-4 py-4 text-center text-base font-bold text-white transition hover:bg-slate-800"
                                to="/settings"
                            >
                                ⚙️ Settings
                            </Link>

                            <Link
                                className="block rounded-xl bg-slate-600 px-4 py-4 text-center text-base font-bold text-white transition hover:bg-slate-700"
                                to="/topup"
                            >
                                💳 Add Credits
                            </Link>

                            <Link
                                className="block rounded-xl bg-slate-500 px-4 py-4 text-center text-base font-bold text-white transition hover:bg-slate-600"
                                to={`/visas/${visa.id}/edit`}
                            >
                                ✏️ Edit
                            </Link>
                        </div>

                        {/* Messages */}
                        {sendNowMessage && (
                            <div className="rounded-xl bg-emerald-100 p-4 shadow-sm border border-emerald-200">
                                <p className="text-sm font-semibold text-emerald-800">{sendNowMessage}</p>
                            </div>
                        )}
                        {sendNowError && (
                            <div className="rounded-xl bg-rose-100 p-4 shadow-sm border border-rose-200">
                                <p className="text-sm font-semibold text-rose-800">{sendNowError}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
