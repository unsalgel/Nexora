const SAFE_ORDER_NUMBER_PATTERN = /^NX-\d{8}-[A-F0-9]{8}$/;
const MAX_ERROR_MESSAGE_LENGTH = 250;

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

/**
 * Sanitizes error messages received from external redirects or queries.
 * Strips HTML tags and caps length to prevent reflected injection attacks.
 */
export function sanitizePaymentErrorMessage(value: string | null): string | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    const stripped = decoded.replace(/<[^>]*>?/gm, '').trim();
    if (!stripped) return null;
    return stripped.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  } catch {
    return 'Ödeme işlemi sırasında bir hata oluştu.';
  }
}

/**
 * Safely removes payment callback query parameters from the browser URL
 * using window.history.replaceState, preventing re-execution upon page refresh.
 */
export function clearPaymentQueryParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (url.searchParams.has('orderSuccess') || url.searchParams.has('paymentError') || url.searchParams.has('token')) {
    url.searchParams.delete('orderSuccess');
    url.searchParams.delete('paymentError');
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
  }
}
