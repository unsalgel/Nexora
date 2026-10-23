// Model output is untrusted: only known, local application routes become links.
export function safeChatLink(value: string): string | null {
  if (/\s/.test(value)) return null;
  if (/^\/(?:products|cart|profile|orders|addresses|favorites|login|register|verify-email)?$/.test(value)) return value;
  if (/^\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return value;
  return null;
}
