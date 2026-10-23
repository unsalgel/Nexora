const SAFE_ORDER_NUMBER_PATTERN = /^NX-\d{8}-[A-F0-9]{8}$/;

/**
 * Sanitizes and validates an order number extracted from URL query parameters.
 * Rejects any non-standard or malformed string to prevent parameter tampering or reflected injection.
 */
export function sanitizeOrderNumber(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (SAFE_ORDER_NUMBER_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function getTrustedPaymentUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      url.hostname.endsWith('.iyzipay.com') ? url.href : null;
  } catch {
    return null;
  }
}
