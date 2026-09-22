/** In-memory auth token so API calls work immediately after login/register
 *  before Zustand persist finishes writing AsyncStorage. */
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export function setMemoryAuthTokens(accessToken: string | null, refreshToken?: string | null) {
  memoryAccessToken = accessToken;
  if (refreshToken !== undefined) {
    memoryRefreshToken = refreshToken;
  }
  if (accessToken === null) {
    memoryRefreshToken = null;
  }
}

export function getMemoryAccessToken() {
  return memoryAccessToken;
}

export function getMemoryRefreshToken() {
  return memoryRefreshToken;
}
