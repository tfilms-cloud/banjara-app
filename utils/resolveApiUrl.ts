const API_PORT = 5000;
const API_PATH = '/api';

export function parseApiHost(value?: string | null): string | null {
  if (!value) return null;
  try { return new URL(value.includes('://') ? value : `http://${value}`).hostname || null; }
  catch { return null; }
}

function isLoopback(host: string) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
}

function isPrivateLan(host: string) {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
}

/** Resolve development networking without overriding a configured public API. */
export function resolveApiBaseUrl(input: {
  envUrl?: string; metroHost?: string | null; platform: string; isDevice: boolean; development: boolean;
}) {
  const envUrl = input.envUrl?.trim();
  const envHost = parseApiHost(envUrl);
  const localApi = !envHost || isLoopback(envHost) || isPrivateLan(envHost);
  if (input.development && input.platform === 'android' && !input.isDevice && localApi) {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }
  if (input.development && input.metroHost && !isLoopback(input.metroHost) && input.platform !== 'web' && localApi) {
    return `http://${input.metroHost}:${API_PORT}${API_PATH}`;
  }
  if (envUrl) return envUrl.replace(/\/$/, '');
  return `http://${input.platform === 'android' ? '10.0.2.2' : 'localhost'}:${API_PORT}${API_PATH}`;
}
