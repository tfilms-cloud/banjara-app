import type { Href } from 'expo-router';
import type { Provider, ProviderOnboardingDraft } from '@/types/provider';

export const TRANSPORT_STEPS = [
  'services',
  'business',
  'location',
  'transport',
  'vehicle',
  'verification',
  'review',
  'submitted',
] as const;
export type TransportStep = (typeof TRANSPORT_STEPS)[number];
export function transportStepHref(step: TransportStep): Href {
  if (step === 'location')
    return {
      pathname: '/(provider)/location',
      params: { mode: 'onboarding' },
    } as Href;
  if (step === 'vehicle')
    return {
      pathname: '/(provider)/vehicles/add',
      params: { mode: 'onboarding' },
    } as Href;
  if (step === 'submitted') return '/(provider)/status';
  return `/(provider)/register/${step}` as Href;
}
export function transportResumeStep(
  provider: Provider | null,
  draft: ProviderOnboardingDraft,
): TransportStep | null {
  const service = provider?.services[0] ?? draft.selectedServices[0];
  if (service !== 'transport') return null;
  // A missing server progress response must never grant access to the dashboard.
  if (provider) return provider.onboardingProgress?.nextStep ?? 'business';
  return draft.selectedServices[0] ? 'business' : 'services';
}
export function transportDashboardAllowed(provider: Provider | null) {
  return (
    provider?.onboardingProgress?.completed === true &&
    provider.verificationStatus === 'approved'
  );
}
