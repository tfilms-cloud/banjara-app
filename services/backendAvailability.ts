import { getApiBaseUrl } from '@/services/apiUrl';
import { createBackendMonitor, isBackendReady } from '@/utils/backendAvailability';

async function probeBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${getApiBaseUrl()}/ready`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    return response.ok && isBackendReady(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export const backendAvailability = createBackendMonitor(probeBackend);
