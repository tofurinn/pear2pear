/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.getRandomValues for better security than Math.random().
 */
export function generateSixDigitCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 900000) + 100000;
  return code.toString();
}

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function expiryTimestamp(minutesFromNow: number = 10): number {
  return Date.now() + minutesFromNow * 60 * 1000;
}