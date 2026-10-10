interface TokenSession { userId: string; sessionId: string }

const readTokenSession = (token: string | null): TokenSession | null => {
  if (!token) return null;
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const claims = parsed as Record<string, unknown>;
    const userId = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? claims.nameid ?? claims.sub;
    const sessionId = claims.sid;
    return typeof userId === 'string' && userId.length > 0 && typeof sessionId === 'string' && sessionId.length > 0
      ? { userId, sessionId } : null;
  } catch { return null; }
};

export const isSameTokenSession = (originalToken: string, currentToken: string | null): boolean => {
  const original = readTokenSession(originalToken);
  const current = readTokenSession(currentToken);
  return !!original && !!current && original.userId === current.userId && original.sessionId === current.sessionId;
};
