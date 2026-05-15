import { useEffect, useState, type FormEvent } from 'react';
import { SearchableSelect } from '../../components/searchable-select';
import type { VisaPayload } from './visa-api';
import {
    formatVisaType,
    getDefaultReminderSchedule,
    getRecommendedRemindersForVisa,
    getRecommendedVisaTypeForStay,
    getVisaRule,
    normalizeVisaType,
    RULE_GUIDANCE_NOTE,
    STAY_PROFILE_OPTIONS,
    VISA_TYPE_GROUPS,
    type StayProfileId,
} from './visa-rules';

const REMINDER_OPTIONS = getDefaultReminderSchedule();
type DeliveryMode = 'sms-only' | 'email-only' | 'both';

// Common nationalities for dropdown
const NATIONALITIES = [
    'Filipino',
    'Australian',
    'American',
    'British',
    'Canadian',
    'Chinese',
    'French',
    'German',
    'Indian',
    'Indonesian',
    'Japanese',
    'Korean',
    'Malaysian',
    'New Zealand',
    'Singaporean',
    'Thai',
    'Vietnamese',
    'Other',
];

interface VisaFormProps {
    initialValue?: VisaPayload;
    onSubmit: (payload: VisaPayload) => Promise<void>;
    ctaLabel: string;
}

export function VisaForm({ initialValue, onSubmit, ctaLabel }: VisaFormProps) {
    const initialDeliveryMode: DeliveryMode = initialValue
        ? initialValue.smsEnabled && initialValue.emailEnabled
            ? 'both'
            : initialValue.smsEnabled
                ? 'sms-only'
                : 'email-only'
        : 'both';
    const [form, setForm] = useState<VisaPayload>(
        initialValue ?? {
            nationality: '',
            country: 'PH',
            visaType: '',
            entryDate: '',
            expiryDate: '',
            phoneNumber: '',
            email: '',
            smsEnabled: true,
            emailEnabled: true,
            reminderIntervals: REMINDER_OPTIONS,
        },
    );
    const [stayProfile, setStayProfile] = useState<StayProfileId | ''>('');
    const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(initialDeliveryMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    // Sync form when initialValue changes (e.g., after fetching visa data)
    useEffect(() => {
        if (initialValue) {
            const normalizedVisaType = normalizeVisaType(initialValue.visaType);
            const matchedStayProfile = STAY_PROFILE_OPTIONS.find((option) => option.visaType === normalizedVisaType)?.id ?? '';
            // Format ISO dates to YYYY-MM-DD for date input fields
            const formattedValue = {
                ...initialValue,
                visaType: normalizedVisaType,
                entryDate: formatDateForInput(initialValue.entryDate),
                expiryDate: formatDateForInput(initialValue.expiryDate),
            };
            setForm(formattedValue);
            setStayProfile(matchedStayProfile);
            setDeliveryMode(initialValue.smsEnabled && initialValue.emailEnabled ? 'both' : initialValue.smsEnabled ? 'sms-only' : 'email-only');
        }
    }, [initialValue]);

    const currentRule = getVisaRule(form.visaType);

    const formatDateForInput = (dateString: string): string => {
        // Convert ISO date or any date string to YYYY-MM-DD format
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return as-is if invalid
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateDays = (startDate: string, endDate: string): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const validatePhoneNumber = (phone: string) => {
        // PH phone format: 09XXXXXXXXX or +639XXXXXXXXX
        const phPhoneRegex = /^(\+63|0)?9\d{9}$/;
        return phPhoneRegex.test(phone.replace(/\s|-/g, ''));
    };

    const handlePhoneChange = (value: string) => {
        setForm((prev) => ({ ...prev, phoneNumber: value }));
        if (value && !validatePhoneNumber(value)) {
            setPhoneError('Please enter a valid PH phone number (09XXXXXXXXX or +639XXXXXXXXX)');
        } else {
            setPhoneError('');
        }
    };

    const updateDeliveryMode = (mode: DeliveryMode) => {
        setDeliveryMode(mode);
        setForm((prev) => ({
            ...prev,
            smsEnabled: mode === 'sms-only' || mode === 'both',
            emailEnabled: mode === 'email-only' || mode === 'both',
        }));
    };

    const updateVisaType = (value: string) => {
        const normalized = normalizeVisaType(value);
        setForm((prev) => ({
            ...prev,
            visaType: normalized,
            reminderIntervals: getRecommendedRemindersForVisa(normalized),
        }));
        const matchedStayProfile = STAY_PROFILE_OPTIONS.find((option) => option.visaType === normalized)?.id ?? '';
        setStayProfile(matchedStayProfile);
    };

    const updateStayProfile = (profileId: StayProfileId) => {
        const recommendedVisaType = getRecommendedVisaTypeForStay(profileId);
        setStayProfile(profileId);
        setForm((prev) => ({
            ...prev,
            visaType: recommendedVisaType,
            reminderIntervals: getRecommendedRemindersForVisa(recommendedVisaType),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validatePhoneNumber(form.phoneNumber)) {
            setPhoneError('Please enter a valid PH phone number');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(form);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">1</span>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Stay Type</p>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">What best describes your stay in the Philippines?</h2>
                <p className="mt-1 text-sm text-slate-600">Choose one option so we can recommend the right visa and reminder plan.</p>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {STAY_PROFILE_OPTIONS.map((option) => {
                        const isSelected = stayProfile === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                className={`rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                onClick={() => updateStayProfile(option.id)}
                            >
                                <span className="block text-sm font-semibold">{option.label}</span>
                                <span className={`mt-1 block text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>{option.description}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">2</span>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Visa Details</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Nationality</label>
                        <SearchableSelect
                            options={NATIONALITIES}
                            value={form.nationality}
                            onChange={(value) => setForm((prev) => ({ ...prev, nationality: value }))}
                            placeholder="Search nationality..."
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Country</label>
                        <input
                            className="field bg-slate-100"
                            type="text"
                            value="Philippines"
                            disabled
                            title="Currently supporting Philippines only"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Visa type</label>
                        <select
                            className="field"
                            value={form.visaType}
                            required
                            onChange={(event) => updateVisaType(event.target.value)}
                        >
                            <option value="">Select visa type</option>
                            {VISA_TYPE_GROUPS.map((group) => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {form.visaType ? (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900">{formatVisaType(form.visaType)}</p>
                                <p className="mt-1 text-sm text-slate-600">{currentRule.summary}</p>
                                <p className="mt-2 text-xs text-slate-500">{currentRule.renewalGuidance}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{RULE_GUIDANCE_NOTE}</p>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-700">Validity period</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs text-slate-600">Issuance date</label>
                            <input
                                className="field"
                                type="date"
                                title="Date you entered Philippines or visa issuance date"
                                value={form.entryDate}
                                required
                                onChange={(event) => setForm((prev) => ({ ...prev, entryDate: event.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-600">Expiry date</label>
                            <input
                                className="field"
                                type="date"
                                title="Date your visa expires"
                                value={form.expiryDate}
                                required
                                onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                            />
                        </div>
                    </div>
                    {form.entryDate && form.expiryDate && (
                        <p className="mt-2 text-xs text-slate-600">Valid for {calculateDays(form.entryDate, form.expiryDate)} days</p>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">3</span>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contact And Delivery</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Mobile number</label>
                        <input
                            className={`field ${phoneError ? 'border-rose-300' : ''}`}
                            type="tel"
                            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                            value={form.phoneNumber}
                            required
                            onChange={(event) => handlePhoneChange(event.target.value)}
                        />
                        {phoneError ? (
                            <p className="mt-1 text-xs text-rose-600">{phoneError}</p>
                        ) : (
                            <p className="mt-1 text-xs text-slate-500">Used for SMS reminders</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Email address</label>
                        <input
                            className="field"
                            type="email"
                            placeholder="name@email.com"
                            value={form.email}
                            required
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        />
                        <p className="mt-1 text-xs text-slate-500">Used for email reminders</p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Reminder delivery mode</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        {[
                            { id: 'sms-only' as const, label: 'SMS only' },
                            { id: 'email-only' as const, label: 'Email only' },
                            { id: 'both' as const, label: 'SMS and Email' },
                        ].map((option) => {
                            const isActive = deliveryMode === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                    onClick={() => updateDeliveryMode(option.id)}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Reminder schedule</p>
                            <p className="text-xs text-slate-500">Auto-applied from {formatVisaType(form.visaType || 'Other / Custom')}.</p>
                        </div>
                        <p className="text-xs text-slate-500">You can update this in settings later.</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {form.reminderIntervals.map((option) => (
                            <span key={option} className="rounded-full bg-slate-900 px-3 py-1 text-sm text-white">
                                {option} days
                            </span>
                        ))}
                    </div>
                    {currentRule.reminderCategories.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-500">Reminder categories: {currentRule.reminderCategories.join(', ')}</p>
                    ) : null}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">4</span>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review And Save</p>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">What happens next</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        {currentRule.nextActions.slice(0, 4).map((item) => (
                            <li key={item}>• {item}</li>
                        ))}
                    </ul>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">{RULE_GUIDANCE_NOTE}</p>
                </div>

                <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : ctaLabel}
                </button>
            </section>
        </form>
    );
}
