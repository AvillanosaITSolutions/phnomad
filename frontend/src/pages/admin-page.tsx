import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { getAdminUsers, getScheduledTasks, grantCredits } from '../features/admin/admin-api';
import { queryClient } from '../app/query-client';
import type { GrantCreditsResult } from '../types/models';

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function describeNotification(label: string, result: { sent: boolean; reason?: string }): string {
    if (result.sent) return `${label} sent`;
    if (result.reason === 'no_phone') return `${label} skipped (no phone on file)`;
    if (result.reason === 'no_email') return `${label} skipped (no email on file)`;
    return `${label} failed`;
}

export function AdminPage() {
    const { token, user } = useAuth();
    const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});
    const [grantTargetId, setGrantTargetId] = useState<string | null>(null);
    const [grantResult, setGrantResult] = useState<GrantCreditsResult | null>(null);
    const [grantError, setGrantError] = useState<string | null>(null);

    const tasksQuery = useQuery({
        queryKey: ['admin', 'scheduled-tasks'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getScheduledTasks(token);
        },
        enabled: Boolean(token),
    });

    const usersQuery = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getAdminUsers(token);
        },
        enabled: Boolean(token),
    });

    const grantMutation = useMutation({
        mutationFn: async (payload: { userId: string; credits: number }) => {
            if (!token) throw new Error('Missing token');
            return grantCredits(token, payload.userId, payload.credits);
        },
        onSuccess: async (result) => {
            setGrantError(null);
            setGrantResult(result);
            setCreditDrafts((prev) => ({ ...prev, [result.userId]: '' }));
            await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
        onError: () => {
            setGrantResult(null);
            setGrantError('Could not grant credits. Please check the amount and try again.');
        },
    });

    const submitGrant = (userId: string) => {
        const raw = creditDrafts[userId]?.trim() ?? '';
        const credits = Number(raw);
        setGrantTargetId(userId);
        setGrantResult(null);
        if (!Number.isInteger(credits) || credits < 1) {
            setGrantError('Enter a whole number of credits (1 or more).');
            return;
        }
        setGrantError(null);
        grantMutation.mutate({ userId, credits });
    };

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-500">Signed in as {user?.email}</p>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Controls</h1>
                </div>
                <Link className="text-sm font-medium text-teal-700" to="/dashboard">
                    Back to Dashboard
                </Link>
            </div>

            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Users &amp; Credits</h2>
                        <p className="mt-1 text-sm text-slate-600">Grant extra SMS credits to a user. They are notified by SMS and email.</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
                        disabled={usersQuery.isFetching}
                        onClick={() => void usersQuery.refetch()}
                    >
                        {usersQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {usersQuery.isLoading ? (
                    <p className="mt-6 text-sm text-slate-600">Loading users...</p>
                ) : usersQuery.isError ? (
                    <p className="mt-6 text-sm font-medium text-rose-700">Could not load users. Please try again.</p>
                ) : usersQuery.data && usersQuery.data.length > 0 ? (
                    <div className="mt-6 space-y-3">
                        {usersQuery.data.map((u) => {
                            const isTarget = grantTargetId === u.id;
                            const isPending = grantMutation.isPending && isTarget;
                            return (
                                <div key={u.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{u.name}</p>
                                            <p className="text-xs text-slate-500">{u.email}</p>
                                            <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{u.role}</p>
                                            {u.lastGrant ? (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Last grant: {u.lastGrant.credits} by {u.lastGrant.grantedByEmail} on {formatDateTime(u.lastGrant.createdAt)}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs uppercase tracking-wider text-slate-500">Credits</p>
                                                <p className="text-lg font-bold text-blue-700">{u.smsCredits}</p>
                                            </div>
                                            <input
                                                type="number"
                                                min={1}
                                                step={1}
                                                placeholder="Amount"
                                                className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-slate-300 focus:ring"
                                                value={creditDrafts[u.id] ?? ''}
                                                onChange={(event) =>
                                                    setCreditDrafts((prev) => ({ ...prev, [u.id]: event.target.value }))
                                                }
                                                disabled={isPending}
                                            />
                                            <button
                                                type="button"
                                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={isPending}
                                                onClick={() => submitGrant(u.id)}
                                            >
                                                {isPending ? 'Granting...' : 'Grant'}
                                            </button>
                                        </div>
                                    </div>

                                    {isTarget && grantError ? (
                                        <p className="mt-3 text-sm font-medium text-rose-700">{grantError}</p>
                                    ) : null}
                                    {isTarget && grantResult ? (
                                        <p className="mt-3 text-sm font-medium text-emerald-700">
                                            Granted {grantResult.creditsGranted} credits (new balance {grantResult.totalCredits}).{' '}
                                            {describeNotification('SMS', grantResult.notifications.sms)};{' '}
                                            {describeNotification('Email', grantResult.notifications.email)}.
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-6 text-sm text-slate-600">No users found.</p>
                )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Scheduled Tasks</h2>
                        <p className="mt-1 text-sm text-slate-600">Background jobs that drive reminders and maintenance.</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
                        disabled={tasksQuery.isFetching}
                        onClick={() => void tasksQuery.refetch()}
                    >
                        {tasksQuery.isFetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {tasksQuery.isLoading ? (
                    <p className="mt-6 text-sm text-slate-600">Loading scheduled tasks...</p>
                ) : tasksQuery.isError ? (
                    <p className="mt-6 text-sm font-medium text-rose-700">Could not load scheduled tasks. Please try again.</p>
                ) : tasksQuery.data && tasksQuery.data.length > 0 ? (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="py-3 pr-4 font-semibold">Name</th>
                                    <th className="py-3 pr-4 font-semibold">Schedule</th>
                                    <th className="py-3 pr-4 font-semibold">Status</th>
                                    <th className="py-3 pr-4 font-semibold">Last Run</th>
                                    <th className="py-3 pr-4 font-semibold">Next Run</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasksQuery.data.map((task) => (
                                    <tr key={task.id} className="border-b border-slate-100">
                                        <td className="py-3 pr-4">
                                            <p className="font-semibold text-slate-900">{task.name}</p>
                                            <p className="text-xs text-slate-500">{task.handler}</p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{task.cronExpression}</code>
                                            <p className="mt-1 text-xs text-slate-500">{task.timezone}</p>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${task.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {task.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-700">{formatDateTime(task.lastRunAt)}</td>
                                        <td className="py-3 pr-4 text-slate-700">{formatDateTime(task.nextRunAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="mt-6 text-sm text-slate-600">No scheduled tasks found.</p>
                )}
            </section>
        </main>
    );
}
