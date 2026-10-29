import { Redirect } from 'expo-router';
import { useProviderStore } from '@/store/providerStore';
import {
  transportDashboardAllowed,
  transportResumeStep,
  transportStepHref,
} from '@/utils/providerOnboarding';

export default function ResumeProvider() {
  const provider = useProviderStore((state) => state.provider);
  const draft = useProviderStore((state) => state.draft);
  const step = transportResumeStep(provider, draft);
  if (step && !transportDashboardAllowed(provider))
    return <Redirect href={transportStepHref(step)} />;
  return (
    <Redirect
      href={provider ? '/(provider)/(tabs)' : '/(provider)/register/services'}
    />
  );
}
