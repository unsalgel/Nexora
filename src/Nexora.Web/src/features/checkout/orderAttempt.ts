// Keep the key across failed requests. A changed order intent starts a new attempt.
// Payment data never belongs in this fingerprint or in persistent browser storage.
export function createOrderAttempt() {
  let previousFingerprint: string | undefined;
  let key = '';
  return (fingerprint: string): string => {
    if (previousFingerprint !== fingerprint) {
      previousFingerprint = fingerprint;
      key = crypto.randomUUID();
    }
    return key;
  };
}
