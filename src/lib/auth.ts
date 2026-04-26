const AUTH_KEY = "career-jump-aws-auth";

interface AuthState {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

function read(): AuthState | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY) ?? localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function getValidIdToken(): string {
  const s = read();
  if (!s?.idToken || !s.expiresAt || s.expiresAt <= Date.now()) return "";
  return s.idToken;
}

export function isAuthEnabled(): boolean {
  return Boolean((window as unknown as { __awsConfig?: { authEnabled?: boolean } }).__awsConfig?.authEnabled);
}
