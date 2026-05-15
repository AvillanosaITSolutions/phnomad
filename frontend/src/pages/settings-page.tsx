import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { getVisas, updateVisa } from '../features/visa/visa-api';
import { queryClient } from '../app/query-client';
import { getDeliveryPreferences, saveDeliveryPreferences, type SendMode } from '../features/subscriptions/delivery-preferences';
import { formatVisaType } from '../features/visa/visa-rules';
import { ApiError } from '../lib/api';

const INTERVALS = [30, 14, 7, 3, 1];

export function SettingsPage() {
    const { token } = useAuth();
    const [sendMode, setSendMode] = useState<SendMode>('send_to_one');
    const [ccSmsRecipients, setCcSmsRecipients] = useState<string[]>(['']);
    const [ccEmailRecipients, setCcEmailRecipients] = useState<string[]>(['']);
    const [channelMode, setChannelMode] = useState<'sms-only' | 'email-only' | 'both'>('both');
    const [draftChannelMode, setDraftChannelMode] = useState<'sms-only' | 'email-only' | 'both'>('both');
    const [draftReminderIntervals, setDraftReminderIntervals] = useState<number[]>(INTERVALS);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const saved = getDeliveryPreferences();
        setSendMode(saved.sendMode);
        setCcSmsRecipients(saved.ccSmsRecipients);
        setCcEmailRecipients(saved.ccEmailRecipients);
    }, []);

    const persistDeliveryPreferences = (nextSendMode: SendMode, nextSmsRecipients: string[], nextEmailRecipients: string[]) => {
        saveDeliveryPreferences({
            sendMode: nextSendMode,
            ccSmsRecipients: nextSmsRecipients,
            ccEmailRecipients: nextEmailRecipients,
        });
    };

    const updateSmsRecipient = (index: number, value: string) => {
        setCcSmsRecipients((prev) => {
            const next = prev.map((item, idx) => (idx === index ? value : item));
            persistDeliveryPreferences(sendMode, next, ccEmailRecipients);
            return next;
        });
    };

    const updateEmailRecipient = (index: number, value: string) => {
        setCcEmailRecipients((prev) => {
            const next = prev.map((item, idx) => (idx === index ? value : item));
            persistDeliveryPreferences(sendMode, ccSmsRecipients, next);
            return next;
        });
    };

    const addSmsRecipient = () => {
        setCcSmsRecipients((prev) => {
            const next = [...prev, ''];
            persistDeliveryPreferences(sendMode, next, ccEmailRecipients);
            return next;
        });
    };

    const addEmailRecipient = () => {
        setCcEmailRecipients((prev) => {
            const next = [...prev, ''];
            persistDeliveryPreferences(sendMode, ccSmsRecipients, next);
            return next;
        });
    };

    const removeSmsRecipient = (index: number) => {
        setCcSmsRecipients((prev) => {
            const next = prev.filter((_item, idx) => idx !== index);
            const safeNext = next.length > 0 ? next : [''];
            persistDeliveryPreferences(sendMode, safeNext, ccEmailRecipients);
            return safeNext;
        });
    };

    const removeEmailRecipient = (index: number) => {
        setCcEmailRecipients((prev) => {
            const next = prev.filter((_item, idx) => idx !== index);
            const safeNext = next.length > 0 ? next : [''];
            persistDeliveryPreferences(sendMode, ccSmsRecipients, safeNext);
            return safeNext;
        });
    };

    const visasQuery = useQuery({
        queryKey: ['visas'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getVisas(token);
        },
        enabled: Boolean(token),
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: {
            visaId: string;
            smsEnabled: boolean;
            emailEnabled: boolean;
            reminderIntervals: number[];
        }) => {
            if (!token) throw new Error('Missing token');
            return updateVisa(token, payload.visaId, {
                smsEnabled: payload.smsEnabled,
                emailEnabled: payload.emailEnabled,
                reminderIntervals: payload.reminderIntervals,
            });
        },
        onSuccess: async (_, variables) => {
            const nextChannelMode = variables.smsEnabled && variables.emailEnabled
                ? 'both'
                : variables.smsEnabled
                    ? 'sms-only'
                    : 'email-only';
            setChannelMode(nextChannelMode);
            setDraftChannelMode(nextChannelMode);
            setDraftReminderIntervals(variables.reminderIntervals);
            setSaveError(null);
            setSaveMessage('Settings saved.');
            await queryClient.invalidateQueries({ queryKey: ['visas'] });
        },
        onError: (error: unknown) => {
            setSaveMessage(null);
            if (error instanceof ApiError) {
                if (error.status === 404) {
                    setSaveError('Visa record was not found for this account. Please reload and try again.');
                    return;
                }

                if (error.status === 400) {
                    setSaveError('Invalid settings payload. Please retry saving your changes.');
                    return;
                }
            }

            setSaveError('Could not save settings. Please try again.');
        },
    });

    useEffect(() => {
        const currentVisa = visasQuery.data?.[0];
        if (!currentVisa) {
            return;
        }

        const nextChannelMode = currentVisa.smsEnabled && currentVisa.emailEnabled
            ? 'both'
            : currentVisa.smsEnabled
                ? 'sms-only'
                : 'email-only';

        setChannelMode(nextChannelMode);
        setDraftChannelMode(nextChannelMode);
        setDraftReminderIntervals(currentVisa.reminderIntervals);
    }, [visasQuery.data]);

    if (visasQuery.isLoading) {
        return <div className="p-8 text-center text-slate-600">Loading settings...</div>;
    }

    const visa = visasQuery.data?.[0];
    if (!visa) {
        return <Navigate to="/onboarding" replace />;
    }

    const hasUnsavedBackendChanges =
        draftChannelMode !== channelMode ||
        JSON.stringify([...draftReminderIntervals].sort((a, b) => b - a)) !== JSON.stringify([...visa.reminderIntervals].sort((a, b) => b - a));

    const saveVisaSettings = async () => {
        const smsEnabled = draftChannelMode === 'sms-only' || draftChannelMode === 'both';
        const emailEnabled = draftChannelMode === 'email-only' || draftChannelMode === 'both';

        if (!smsEnabled && !emailEnabled) {
            setSaveMessage(null);
            setSaveError('Please enable at least one reminder channel.');
            return;
        }

        await updateMutation.mutateAsync({
            visaId: visa.id,
            smsEnabled,
            emailEnabled,
            reminderIntervals: [...draftReminderIntervals].sort((a, b) => b - a),
        });
    };

    const saveButtonLabel = updateMutation.isPending ? 'Saving...' : 'Save Changes';

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
                <h1 className="text-2xl font-semibold text-slate-900">Reminder Settings</h1>
                <p className="mt-1 text-slate-600">Choose channels and intervals for your visa expiry alerts.</p>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">Save your reminder settings after making changes.</p>
                        <button
                            type="button"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updateMutation.isPending || !hasUnsavedBackendChanges}
                            onClick={saveVisaSettings}
                        >
                            {saveButtonLabel}
                        </button>
                    </div>
                    {saveMessage ? <p className="mt-2 text-sm font-medium text-emerald-700">{saveMessage}</p> : null}
                    {saveError ? <p className="mt-2 text-sm font-medium text-rose-700">{saveError}</p> : null}
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Reminder channel</p>
                    <p className="mb-3 text-xs text-slate-500">Pick how reminders should reach you for {formatVisaType(visa.visaType)}.</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        {[
                            { label: 'SMS only', smsEnabled: true, emailEnabled: false },
                            { label: 'Email only', smsEnabled: false, emailEnabled: true },
                            { label: 'Both', smsEnabled: true, emailEnabled: true },
                        ].map((option) => {
                            return (
                                <button
                                    key={option.label}
                                    type="button"
                                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${draftChannelMode === (
                                        option.smsEnabled && option.emailEnabled
                                            ? 'both'
                                            : option.smsEnabled
                                                ? 'sms-only'
                                                : 'email-only'
                                    ) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'} ${updateMutation.isPending ? 'cursor-wait opacity-70' : ''}`}
                                    disabled={updateMutation.isPending}
                                    onClick={() => {
                                        setDraftChannelMode(
                                            option.smsEnabled && option.emailEnabled
                                                ? 'both'
                                                : option.smsEnabled
                                                    ? 'sms-only'
                                                    : 'email-only',
                                        );
                                        setSaveMessage(null);
                                        setSaveError(null);
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6">
                    <p className="mb-2 text-sm font-medium text-slate-700">Reminder intervals</p>
                    <div className="flex flex-wrap gap-2">
                        {INTERVALS.map((interval) => {
                            const enabled = draftReminderIntervals.includes(interval);
                            return (
                                <button
                                    type="button"
                                    key={interval}
                                    className={`rounded-full px-3 py-1 text-sm ${enabled ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
                                    onClick={() => {
                                        const next = enabled
                                            ? draftReminderIntervals.filter((item) => item !== interval)
                                            : [...draftReminderIntervals, interval].sort((a, b) => b - a);
                                        setDraftReminderIntervals(next);
                                        setSaveMessage(null);
                                        setSaveError(null);
                                    }}
                                >
                                    {interval} days
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Delivery mode</p>
                    <p className="mb-2 text-xs text-slate-500">This controls extra recipients when reminders are sent to one person or shared with CC contacts.</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 text-sm ${sendMode === 'send_to_one' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                            onClick={() => {
                                setSendMode('send_to_one');
                                persistDeliveryPreferences('send_to_one', ccSmsRecipients, ccEmailRecipients);
                            }}
                        >
                            Send to one
                        </button>
                        <button
                            type="button"
                            className={`rounded-full px-3 py-1 text-sm ${sendMode === 'send_to_many' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                            onClick={() => {
                                setSendMode('send_to_many');
                                persistDeliveryPreferences('send_to_many', ccSmsRecipients, ccEmailRecipients);
                            }}
                        >
                            Send to many
                        </button>
                    </div>

                    {sendMode === 'send_to_many' ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="block">
                                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Additional SMS recipients</span>
                                <div className="space-y-2">
                                    {ccSmsRecipients.map((recipient, index) => (
                                        <div key={`sms-${index}`} className="flex items-center gap-2">
                                            <input
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-slate-300 focus:ring"
                                                placeholder="e.g. +639171234567"
                                                value={recipient}
                                                onChange={(event) => updateSmsRecipient(index, event.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
                                                onClick={() => removeSmsRecipient(index)}
                                                disabled={ccSmsRecipients.length === 1}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="mt-2 rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200" onClick={addSmsRecipient}>
                                    Add SMS recipient
                                </button>
                            </div>
                            <div className="block">
                                <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Additional email CC recipients</span>
                                <div className="space-y-2">
                                    {ccEmailRecipients.map((recipient, index) => (
                                        <div key={`email-${index}`} className="flex items-center gap-2">
                                            <input
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none ring-slate-300 focus:ring"
                                                placeholder="e.g. team@example.com"
                                                value={recipient}
                                                onChange={(event) => updateEmailRecipient(index, event.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
                                                onClick={() => removeEmailRecipient(index)}
                                                disabled={ccEmailRecipients.length === 1}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" className="mt-2 rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200" onClick={addEmailRecipient}>
                                    Add email CC
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-600">Review your channel and interval changes, then save.</p>
                        <button
                            type="button"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={updateMutation.isPending || !hasUnsavedBackendChanges}
                            onClick={saveVisaSettings}
                        >
                            {saveButtonLabel}
                        </button>
                    </div>
                    {saveMessage ? <p className="mt-2 text-sm font-medium text-emerald-700">{saveMessage}</p> : null}
                    {saveError ? <p className="mt-2 text-sm font-medium text-rose-700">{saveError}</p> : null}
                </div>

                <div className="mt-6">
                    <Link className="text-sm font-medium text-teal-700" to="/dashboard">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
