export type StayProfileId =
  | 'tourist'
  | 'remote-worker'
  | 'working'
  | 'retired'
  | 'student'
  | 'married'
  | 'balikbayan'
  | 'other';

export interface VisaTypeOption {
  label: string;
  value: string;
}

export interface VisaTypeGroup {
  label: string;
  options: VisaTypeOption[];
}

export interface StayProfileOption {
  id: StayProfileId;
  label: string;
  description: string;
  visaType: string;
}

export interface VisaRule {
  label: string;
  summary: string;
  nextActions: string[];
  renewalGuidance: string;
  commonRequirements: string[];
  recommendedReminderSchedule: number[];
  complianceChecklist: string[];
  reminderCategories: string[];
}

export const RULE_GUIDANCE_NOTE = 'App-defined guidance, not official government feed.';

const REMINDER_SCHEDULE = [30, 14, 7, 3, 1] as const;

const VISA_TYPE_LABELS: Record<string, string> = {
  '9(a) Tourist Visa': '9(a) Tourist Visa',
  'Visa-Free Entry': 'Visa-Free Entry',
  'ASEAN Visa-Free': 'ASEAN Visa-Free',
  'Balikbayan Privilege': 'Balikbayan Privilege',
  '9(g) Work Visa': '9(g) Work Visa',
  'SRRV (Retiree Visa)': 'SRRV (Retiree Visa)',
  'Student Visa': 'Student Visa',
  'Marriage / Spouse Visa': 'Marriage / Spouse Visa',
  'Business Visa': 'Business Visa',
  'ACR-I Card': 'ACR-I Card',
  ECC: 'ECC',
  'Other / Custom': 'Other / Custom',
};

const VISA_TYPE_ALIASES: Record<string, string> = {
  '59(a) Tourist': '9(a) Tourist Visa',
  '59(b) Business': 'Business Visa',
  'Extended Student': 'Student Visa',
  'SJV (Spouse of Japanese)': 'Marriage / Spouse Visa',
  SJV: 'Marriage / Spouse Visa',
};

const VISA_TYPE_RULES: Record<string, VisaRule> = {
  '9(a) Tourist Visa': {
    label: '9(a) Tourist Visa',
    summary: 'Best for short stays and extensions while staying in the Philippines as a visitor.',
    nextActions: [
      'Renew before expiration',
      'Bring passport and latest extension receipt',
      'Apply for ACR-I Card after 59 days stay',
      'Secure ECC if leaving after 6+ months',
    ],
    renewalGuidance: 'Check your latest approved extension date and renew early if you plan to stay longer.',
    commonRequirements: ['Passport', 'Latest extension receipt', 'Arrival stamp or visa record'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: [
      'Passport is valid for the full stay',
      'Extension filed before expiration',
      'ACR-I Card considered after 59 days',
      'ECC reviewed before departure when required',
    ],
    reminderCategories: ['Visa extension deadlines', 'Overstay warnings', 'ACR-I eligibility', 'ECC requirement warnings'],
  },
  'Visa-Free Entry': {
    label: 'Visa-Free Entry',
    summary: 'For eligible passport holders entering without a pre-approved visa.',
    nextActions: ['Track your allowed stay length', 'Plan extension before the visa-free window ends', 'Keep arrival records handy'],
    renewalGuidance: 'Confirm your entry allowance before it expires because extension rules vary by nationality.',
    commonRequirements: ['Passport', 'Arrival stamp', 'Proof of onward travel if requested'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Entry allowance tracked', 'Extension plan reviewed', 'Departure or extension date confirmed'],
    reminderCategories: ['Visa extension deadlines', 'Overstay warnings'],
  },
  'ASEAN Visa-Free': {
    label: 'ASEAN Visa-Free',
    summary: 'For ASEAN travelers who can enter under visa-free arrangements.',
    nextActions: ['Confirm your stay allowance', 'Check extension eligibility', 'Keep passport and arrival documentation ready'],
    renewalGuidance: 'Use your entry period as the baseline and prepare early if you want to extend.',
    commonRequirements: ['Passport', 'Arrival documentation', 'Extension application documents if needed'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Entry window tracked', 'Extension eligibility checked', 'Departure plan confirmed'],
    reminderCategories: ['Visa extension deadlines', 'Overstay warnings'],
  },
  'Balikbayan Privilege': {
    label: 'Balikbayan Privilege',
    summary: 'For eligible returning Filipinos and dependents entering under Balikbayan rules.',
    nextActions: ['Confirm Balikbayan eligibility', 'Keep proof of Filipino citizenship or relationship', 'Plan for any extension needs early'],
    renewalGuidance: 'Treat the privilege period like a fixed stay window and renew or exit before it ends.',
    commonRequirements: ['Passport', 'Proof of Filipino relationship or citizenship', 'Arrival details'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Eligibility documented', 'Stay window tracked', 'Follow-up plan confirmed'],
    reminderCategories: ['Visa extension deadlines', 'Overstay warnings'],
  },
  '9(g) Work Visa': {
    label: '9(g) Work Visa',
    summary: 'For foreigners employed in the Philippines under a work-authorized visa.',
    nextActions: ['Track visa validity', 'Monitor AEP status separately', 'Keep passport validity ahead of renewal windows'],
    renewalGuidance: 'Start renewal planning early because work-authorized stays often need employer coordination.',
    commonRequirements: ['Passport', 'Employment or sponsorship records', 'AEP or work authorization documents'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Visa validity tracked', 'AEP expiration reviewed', 'Passport expiry checked'],
    reminderCategories: ['AEP expiration', 'Visa renewal', 'Passport expiration'],
  },
  'SRRV (Retiree Visa)': {
    label: 'SRRV (Retiree Visa)',
    summary: 'For retirees staying in the Philippines under the Special Resident Retiree Visa program.',
    nextActions: ['Review PRA compliance duties', 'Keep deposit and documentation current', 'Set annual compliance reminders'],
    renewalGuidance: 'Use annual compliance and document checks rather than waiting until the last minute.',
    commonRequirements: ['Passport', 'SRRV card or certificate', 'PRA compliance records'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Annual PRA compliance tracked', 'Address or contact details updated', 'Travel documents valid'],
    reminderCategories: ['Annual PRA compliance reminders'],
  },
  'Student Visa': {
    label: 'Student Visa',
    summary: 'For foreign students enrolled in Philippine schools or universities.',
    nextActions: ['Track enrollment deadlines', 'Renew before the visa expires', 'Keep school certificates ready'],
    renewalGuidance: 'Tie reminders to both your visa expiry and academic calendar so enrollment never lapses.',
    commonRequirements: ['Passport', 'Certificate of enrollment', 'School or university records'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Enrollment active', 'Visa renewal planned', 'School documents current'],
    reminderCategories: ['Enrollment deadlines', 'Visa renewal'],
  },
  'Marriage / Spouse Visa': {
    label: 'Marriage / Spouse Visa',
    summary: 'For foreigners married to Filipino citizens or staying under spouse-based arrangements.',
    nextActions: ['Keep civil status documents ready', 'Track renewal windows', 'Monitor any identity or residence updates'],
    renewalGuidance: 'Keep marriage and residence records current before each renewal period.',
    commonRequirements: ['Passport', 'Marriage certificate or supporting proof', 'Residence or spouse documentation'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Civil documents ready', 'Renewal window tracked', 'Contact details current'],
    reminderCategories: ['Visa renewal', 'Passport expiration'],
  },
  'Business Visa': {
    label: 'Business Visa',
    summary: 'For visitors handling business activities that require a Philippine visa.',
    nextActions: ['Track allowed business stay length', 'Prepare company or invitation papers', 'Renew before the visa expires'],
    renewalGuidance: 'Coordinate renewals with business travel dates so you never overstay while handling work trips.',
    commonRequirements: ['Passport', 'Business or invitation letter', 'Travel itinerary or supporting documents'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Business authorization ready', 'Expiry date tracked', 'Departure or extension plan confirmed'],
    reminderCategories: ['Visa renewal', 'Passport expiration'],
  },
  'ACR-I Card': {
    label: 'ACR-I Card',
    summary: 'Identity card requirement for many long-stay foreign residents in the Philippines.',
    nextActions: ['Apply once your stay reaches the required threshold', 'Keep card release dates in view', 'Bring passport and supporting receipts'],
    renewalGuidance: 'Follow release and annual compliance instructions from the issuing office.',
    commonRequirements: ['Passport', 'Application receipt', 'Photo and supporting forms'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Eligibility reviewed', 'Application submitted when required', 'Card release tracked'],
    reminderCategories: ['ACR-I eligibility', 'Annual report reminders', 'Card release reminders'],
  },
  ECC: {
    label: 'ECC',
    summary: 'Emigration clearance may be required before departure in specific cases.',
    nextActions: ['Check whether your departure requires ECC', 'Prepare supporting documents early', 'Review travel timing before booking flights'],
    renewalGuidance: 'Treat ECC as a pre-departure checklist item rather than a renewal item.',
    commonRequirements: ['Passport', 'Visa or extension records', 'Departure details'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Departure eligibility checked', 'Required documents gathered', 'ECC filing timeline reviewed'],
    reminderCategories: ['ECC requirement warnings'],
  },
  'Other / Custom': {
    label: 'Other / Custom',
    summary: 'Use this when your visa or stay type does not match the presets.',
    nextActions: ['Add a custom note for your situation', 'Track the nearest expiry date', 'Review official guidance if unsure'],
    renewalGuidance: 'Keep the reminder schedule simple and adjust once you confirm the correct visa path.',
    commonRequirements: ['Passport', 'Any available visa or entry record', 'Custom notes or supporting documents'],
    recommendedReminderSchedule: [30, 14, 7, 3, 1],
    complianceChecklist: ['Custom stay details captured', 'Expiry tracked', 'Official guidance reviewed'],
    reminderCategories: ['Visa extension deadlines', 'Overstay warnings'],
  },
};

export const STAY_PROFILE_OPTIONS: StayProfileOption[] = [
  {
    id: 'tourist',
    label: 'Tourist',
    description: 'Short stay, sightseeing, or temporary visit',
    visaType: '9(a) Tourist Visa',
  },
  {
    id: 'remote-worker',
    label: 'Remote Worker / Digital Nomad',
    description: 'Working online while staying temporarily',
    visaType: '9(a) Tourist Visa',
  },
  {
    id: 'working',
    label: 'Working in PH',
    description: 'Employment or assigned work in the Philippines',
    visaType: '9(g) Work Visa',
  },
  {
    id: 'retired',
    label: 'Retired',
    description: 'Long-stay retirement or residency',
    visaType: 'SRRV (Retiree Visa)',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'Enrolled in a Philippine school or university',
    visaType: 'Student Visa',
  },
  {
    id: 'married',
    label: 'Married to Filipino',
    description: 'Spouse-based residence or stay',
    visaType: 'Marriage / Spouse Visa',
  },
  {
    id: 'balikbayan',
    label: 'Returning Balikbayan',
    description: 'Eligible returning Filipino or dependent',
    visaType: 'Balikbayan Privilege',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'I am not sure yet or I have a custom case',
    visaType: 'Other / Custom',
  },
];

export const VISA_TYPE_GROUPS: VisaTypeGroup[] = [
  {
    label: 'Tourist / Temporary Stay',
    options: ['9(a) Tourist Visa', 'Visa-Free Entry', 'ASEAN Visa-Free', 'Balikbayan Privilege'].map((value) => ({ label: value, value })),
  },
  {
    label: 'Work / Residency',
    options: ['9(g) Work Visa', 'SRRV (Retiree Visa)', 'Student Visa', 'Marriage / Spouse Visa', 'Business Visa'].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    label: 'Compliance / Documents',
    options: ['ACR-I Card', 'ECC'].map((value) => ({ label: value, value })),
  },
  {
    label: 'Other',
    options: ['Other / Custom'].map((value) => ({ label: value, value })),
  },
];

export function normalizeVisaType(value: string): string {
  return VISA_TYPE_ALIASES[value] ?? value;
}

export function formatVisaType(value: string): string {
  const normalized = normalizeVisaType(value);
  return VISA_TYPE_LABELS[normalized] ?? normalized;
}

export function getVisaRule(value: string): VisaRule {
  const normalized = normalizeVisaType(value);
  return VISA_TYPE_RULES[normalized] ?? VISA_TYPE_RULES['Other / Custom'];
}

export function getRecommendedVisaTypeForStay(profileId: StayProfileId): string {
  return STAY_PROFILE_OPTIONS.find((option) => option.id === profileId)?.visaType ?? 'Other / Custom';
}

export function getRecommendedRemindersForVisa(value: string): number[] {
  return [...getVisaRule(value).recommendedReminderSchedule];
}

export function getDefaultReminderSchedule(): number[] {
  return [...REMINDER_SCHEDULE];
}