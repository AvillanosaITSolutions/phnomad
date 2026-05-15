export type SendMode = 'send_to_one' | 'send_to_many';

export interface DeliveryPreferences {
  sendMode: SendMode;
  ccSmsRecipients: string[];
  ccEmailRecipients: string[];
}

const STORAGE_KEY = 'delivery_preferences';

const DEFAULT_PREFERENCES: DeliveryPreferences = {
  sendMode: 'send_to_one',
  ccSmsRecipients: [''],
  ccEmailRecipients: [''],
};

export function getDeliveryPreferences(): DeliveryPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DeliveryPreferences>;
    const sendMode: SendMode = parsed.sendMode === 'send_to_many' ? 'send_to_many' : 'send_to_one';
    const ccSmsRecipients = Array.isArray(parsed.ccSmsRecipients) && parsed.ccSmsRecipients.length > 0
      ? parsed.ccSmsRecipients.map((value) => String(value))
      : [''];
    const ccEmailRecipients = Array.isArray(parsed.ccEmailRecipients) && parsed.ccEmailRecipients.length > 0
      ? parsed.ccEmailRecipients.map((value) => String(value))
      : [''];

    return {
      sendMode,
      ccSmsRecipients,
      ccEmailRecipients,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveDeliveryPreferences(preferences: DeliveryPreferences) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
