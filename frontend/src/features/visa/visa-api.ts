import { apiFetch } from '../../lib/api';
import type { Visa } from '../../types/models';

export interface VisaPayload {
  nationality: string;
  country: string;
  visaType: string;
  entryDate: string;
  expiryDate: string;
  phoneNumber: string;
  email: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  reminderIntervals: number[];
}

export interface VisaRenewalHistoryItem {
  id: string;
  userId: string;
  visaId: string;
  eventType: 'CREATED' | 'RENEWED';
  previousExpiryDate: string | null;
  newExpiryDate: string;
  note: string;
  createdAt: string;
}

export function getVisas(token: string) {
  return apiFetch<Visa[]>('/visas', undefined, token);
}

export function createVisa(token: string, payload: VisaPayload) {
  return apiFetch<Visa>(
    '/visas',
    { method: 'POST', body: JSON.stringify(payload) },
    token,
  );
}

export function updateVisa(token: string, visaId: string, payload: Partial<VisaPayload>) {
  return apiFetch<Visa>(
    `/visas/${visaId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    token,
  );
}

export function deleteVisa(token: string, visaId: string) {
  return apiFetch<{ success: true }>(`/visas/${visaId}`, { method: 'DELETE' }, token);
}

export function getRenewalHistory(token: string, visaId: string) {
  return apiFetch<VisaRenewalHistoryItem[]>(`/visas/${visaId}/renewal-history`, undefined, token);
}
