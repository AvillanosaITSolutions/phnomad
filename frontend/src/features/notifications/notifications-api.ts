import { apiFetch } from '../../lib/api';

export interface SendNowResponse {
  success: true;
  processed: number;
}

export interface NotificationLogItem {
  id: string;
  visaId: string;
  type: 'SMS' | 'EMAIL';
  status: 'SENT' | 'FAILED';
  provider: string;
  sentAt: string;
  visa: {
    id: string;
    country: string;
    visaType: string;
    expiryDate: string;
  };
}

export function sendReminderNow(token: string) {
  return apiFetch<SendNowResponse>(
    '/notifications/send-now',
    { method: 'POST' },
    token,
  );
}

export function getNotificationLogs(token: string) {
  return apiFetch<NotificationLogItem[]>('/notifications/logs', undefined, token);
}
