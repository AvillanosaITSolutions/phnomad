const VISA_TYPE_ALIASES: Record<string, string> = {
  '59(a) Tourist': '9(a) Tourist Visa',
  '59(b) Business': 'Business Visa',
  'Extended Student': 'Student Visa',
  'SJV (Spouse of Japanese)': 'Marriage / Spouse Visa',
  SJV: 'Marriage / Spouse Visa',
};

const VISA_RULES: Record<string, { reminderIntervals: number[] }> = {
  '9(a) Tourist Visa': { reminderIntervals: [30, 14, 7, 3, 1] },
  'Visa-Free Entry': { reminderIntervals: [30, 14, 7, 3, 1] },
  'ASEAN Visa-Free': { reminderIntervals: [30, 14, 7, 3, 1] },
  'Balikbayan Privilege': { reminderIntervals: [30, 14, 7, 3, 1] },
  '9(g) Work Visa': { reminderIntervals: [30, 14, 7, 3, 1] },
  'SRRV (Retiree Visa)': { reminderIntervals: [30, 14, 7, 3, 1] },
  'Student Visa': { reminderIntervals: [30, 14, 7, 3, 1] },
  'Marriage / Spouse Visa': { reminderIntervals: [30, 14, 7, 3, 1] },
  'Business Visa': { reminderIntervals: [30, 14, 7, 3, 1] },
  'ACR-I Card': { reminderIntervals: [30, 14, 7, 3, 1] },
  ECC: { reminderIntervals: [30, 14, 7, 3, 1] },
  'Other / Custom': { reminderIntervals: [30, 14, 7, 3, 1] },
};

export function normalizeVisaType(value: string): string {
  return VISA_TYPE_ALIASES[value] ?? value;
}

export function getRecommendedReminderIntervals(value: string): number[] {
  const normalized = normalizeVisaType(value);
  return [...(VISA_RULES[normalized]?.reminderIntervals ?? [30, 14, 7, 3, 1])];
}

export function hasVisaTypeRule(value: string): boolean {
  return Boolean(VISA_RULES[normalizeVisaType(value)]);
}
