import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { createTopUpCheckout, getMySubscription } from '../features/subscriptions/subscriptions-api';
import { getDeliveryPreferences } from '../features/subscriptions/delivery-preferences';
import { topUpPackages, type TopUpPackage } from '../features/subscriptions/topup-packages';

export function TopUpPage() {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(topUpPackages[0] ?? null);
    const topUpStatus = searchParams.get('topup');
    // Track if we should poll for credits (only after payment)
    const [shouldPollCredits, setShouldPollCredits] = useState(topUpStatus === 'success');
    // Track last credits to detect update
    const [lastCredits, setLastCredits] = useState<number | null>(null);

    const subscriptionQuery = useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getMySubscription(token);
        },
        enabled: Boolean(token),
        refetchInterval: shouldPollCredits ? 1000 : false, // poll every 1s if needed
        onSuccess: (data) => {
            const credits = data?.smsCredits ?? 0;
            // If we were polling for credits and now credits increased, stop polling and clean up URL
            if (shouldPollCredits && credits > 0 && credits !== lastCredits) {
                setShouldPollCredits(false);
                setLastCredits(credits);
                // Remove ?topup=success from URL without reload
                searchParams.delete('topup');
                setSearchParams(searchParams, { replace: true });
            } else if (shouldPollCredits) {
                setLastCredits(credits);
            }
        },
    });

    const topUpMutation = useMutation({
        mutationFn: async (payload: { packageId: string; sendMode: 'send_to_one' | 'send_to_many'; ccEmailRecipients?: string[]; ccSmsRecipients?: string[] }) => {
            if (!token) throw new Error('Missing token');
            return createTopUpCheckout(
                token,
                payload.packageId,
                payload.sendMode,
                payload.ccEmailRecipients,
                payload.ccSmsRecipients,
            );
        },
    });

    if (subscriptionQuery.isLoading) {
        return <div className="p-8 text-center text-slate-600">Loading top up details...</div>;
    }

    const subscription = subscriptionQuery.data;
    const smsCredits = subscription?.smsCredits ?? 0;
    const isLowCredits = smsCredits > 0 && smsCredits <= 100;
    const showPaymentProcessing = shouldPollCredits && smsCredits === 0;

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
                <h1 className="text-2xl font-semibold text-slate-900">Top Up & Credits</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Status: {subscription?.active ? 'Active' : 'Inactive'}
                    {subscription?.expiresAt
                        ? ` • Renews until ${new Date(subscription.expiresAt).toDateString()}`
                        : ''}
                </p>
                <p className="mt-2 text-sm text-slate-600">SMS credits: {smsCredits}</p>
                {showPaymentProcessing ? (
                    <p className="mt-2 text-sm font-medium text-blue-700">Payment received. We are syncing your credits now, this usually takes a few seconds.</p>
                ) : null}
                {topUpStatus === 'cancel' ? (
                    <p className="mt-2 text-sm font-medium text-slate-700">Payment was canceled. You can retry anytime.</p>
                ) : null}
                {smsCredits === 0 && !showPaymentProcessing ? (
                    <p className="mt-2 text-sm font-medium text-rose-700">You are out of credits. Top up now to keep reminders active.</p>
                ) : null}
                {isLowCredits ? (
                    <p className="mt-2 text-sm font-medium text-amber-700">Low credits reminder: add credits soon to avoid interruptions.</p>
                ) : null}

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">Top up SMS credits</h3>
                            <p className="text-sm text-slate-600">Choose a credit package and continue to PayMongo checkout.</p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">PayMongo checkout</p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {topUpPackages.map((pack) => {
                            const isSelected = selectedPackage?.id === pack.id;
                            return (
                                <button
                                    key={pack.id}
                                    type="button"
                                    className={`rounded-2xl border p-4 text-left transition ${isSelected
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
                                        }`}
                                    onClick={() => setSelectedPackage(pack)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">{pack.name}</p>
                                            <p className="mt-1 text-3xl font-semibold">{pack.credits} credits</p>
                                        </div>
                                    </div>
                                    <p className={`mt-2 text-sm ${isSelected ? 'text-white/80' : 'text-slate-600'}`}>{pack.highlight}</p>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <div>
                                            <p className={`text-xs uppercase tracking-[0.18em] ${isSelected ? 'text-white/60' : 'text-slate-500'}`}>Price</p>
                                            <p className="text-xl font-semibold">₱{pack.pricePhp.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Selected: {selectedPackage ? `${selectedPackage.name} · ${selectedPackage.credits} credits` : 'Choose a package'}
                            </p>
                            <p className="text-sm text-slate-600">
                                {selectedPackage ? `You will be redirected to PayMongo to complete the ₱${selectedPackage.pricePhp.toFixed(2)} payment.` : 'Pick a package to continue.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!selectedPackage || topUpMutation.isPending}
                            onClick={async () => {
                                if (!selectedPackage) return;
                                const deliveryPreferences = getDeliveryPreferences();
                                const cleanedCcEmailRecipients = deliveryPreferences.sendMode === 'send_to_many'
                                    ? deliveryPreferences.ccEmailRecipients.map((item) => item.trim()).filter(Boolean)
                                    : [];
                                const cleanedCcSmsRecipients = deliveryPreferences.sendMode === 'send_to_many'
                                    ? deliveryPreferences.ccSmsRecipients.map((item) => item.trim()).filter(Boolean)
                                    : [];
                                const result = await topUpMutation.mutateAsync({
                                    packageId: selectedPackage.id,
                                    sendMode: deliveryPreferences.sendMode,
                                    ccEmailRecipients: cleanedCcEmailRecipients,
                                    ccSmsRecipients: cleanedCcSmsRecipients,
                                });
                                window.location.assign(result.checkoutUrl);
                            }}
                        >
                            {topUpMutation.isPending ? 'Opening checkout...' : 'Proceed to PayMongo'}
                        </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                        Delivery mode and CC recipients are managed in Settings.
                    </p>
                </div>

                <div className="mt-6">
                    <Link className="text-sm font-medium text-teal-700" to="/dashboard">
                        Back to Dashboard
                    </Link>
                </div>
            </section>
        </main>
    );
}
