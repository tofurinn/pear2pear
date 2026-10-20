/*
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.getRandomValues for better security than Math.random().
 */
export function generateSixDigitCode(): string {
  const array = new Uint32Array(1);           // Holds a number 0-4,294,967,295
  crypto.getRandomValues(array);
  const code = (array[0] % 900000) + 100000;  // Limits to 0-899,999, then shifts it to 100,000-999,999
  return code.toString();                     // Convert generated number to string
}

/*
 * Checks whether an OTP has passed its expiry time.
 * param expiresAt Unix timesteamp (output of expiryTimestamp())
 * returns true if the current time is past 'expiresAt'
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/*
 * Returns Unix timestamp 'minutesFromNow' minutes in the future
 * determines when an OTP stops being valid
 * param minutesFromNow defaults to 10 minutes
 */
export function expiryTimestamp(minutesFromNow: number = 10): number {
  return Date.now() + minutesFromNow * 60 * 1000; // Adds 10 minutes to code generation time
}