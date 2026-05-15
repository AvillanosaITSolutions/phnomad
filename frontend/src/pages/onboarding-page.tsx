import { useMutation, useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { VisaForm } from '../features/visa/visa-form';
import { createVisa, updateVisa, getVisas, type VisaPayload } from '../features/visa/visa-api';
import { useAuth } from '../features/auth/auth-context';
import { queryClient } from '../app/query-client';

export function OnboardingPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { id: visaId } = useParams<{ id: string }>();

    // Always fetch visas so onboarding can guard against duplicate create.
    const visasQuery = useQuery({
        queryKey: ['visas'],
        queryFn: async () => {
            if (!token) throw new Error('Missing token');
            return getVisas(token);
        },
        enabled: Boolean(token),
    });

    const editingVisa = visasQuery.data?.find((v) => v.id === visaId);

    const createMutation = useMutation({
        mutationFn: async (payload: VisaPayload) => {
            if (!token) throw new Error('Missing token');
            return createVisa(token, payload);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['visas'] });
            navigate('/dashboard');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: VisaPayload) => {
            if (!token || !visaId) throw new Error('Missing token or visa ID');
            return updateVisa(token, visaId, payload);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['visas'] });
            navigate('/dashboard');
        },
    });

    const isEditing = Boolean(visaId);
    const hasExistingVisa = (visasQuery.data?.length ?? 0) > 0;
    const isLoading = visasQuery.isLoading;

    if (isLoading) {
        return <div className="p-8 text-center text-slate-600">Loading visa details...</div>;
    }

    if (!isEditing && hasExistingVisa) {
        return <Navigate to="/dashboard" replace />;
    }

    const initialValue: VisaPayload | undefined = editingVisa
        ? {
            nationality: editingVisa.nationality,
            country: editingVisa.country,
            visaType: editingVisa.visaType,
            entryDate: editingVisa.entryDate,
            expiryDate: editingVisa.expiryDate,
            phoneNumber: editingVisa.phoneNumber,
            email: editingVisa.email,
            smsEnabled: editingVisa.smsEnabled,
            emailEnabled: editingVisa.emailEnabled,
            reminderIntervals: editingVisa.reminderIntervals,
        }
        : undefined;

    return (
        <main className="mx-auto w-full max-w-4xl px-6 py-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
                <h1 className="text-3xl font-semibold text-slate-900">
                    {isEditing ? 'Update your visa' : 'Start by describing your stay'}
                </h1>
                <p className="mt-2 text-slate-600">
                    {isEditing
                        ? 'Update your visa details and reminder preferences.'
                        : 'Pick the stay that best describes your situation and we will suggest the right visa setup.'}
                </p>
                <div className="mt-6">
                    <VisaForm
                        initialValue={initialValue}
                        ctaLabel={isEditing ? 'Update Visa' : 'Start Tracking Visa'}
                        onSubmit={async (payload) => {
                            if (isEditing) {
                                await updateMutation.mutateAsync(payload);
                            } else {
                                await createMutation.mutateAsync(payload);
                            }
                        }}
                    />
                    {(createMutation.isError || updateMutation.isError) && (
                        <p className="mt-3 text-sm text-rose-600">
                            Could not save visa details. Please try again.
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
