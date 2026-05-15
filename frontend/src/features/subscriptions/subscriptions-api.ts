import { apiFetch } from '../../lib/api';
import type { Subscription } from '../../types/models';

export function getMySubscription(token: string) {
  return apiFetch<Subscription | null>('/subscriptions/me', undefined, token);
}

export function createTopUpCheckout(
  token: string,
  packageId: string,
  sendMode: 'send_to_one' | 'send_to_many',
  ccEmailRecipients?: string[],
  ccSmsRecipients?: string[],
) {
  return apiFetch<{ checkoutUrl: string }>(
    '/subscriptions/topup/checkout',
    {
      method: 'POST',
      body: JSON.stringify({
        packageId,
        sendMode,
        ccEmailRecipients,
        ccSmsRecipients,
      }),
    },
    token,
  );
}
