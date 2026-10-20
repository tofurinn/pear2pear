// Namespaced key so it doesn't collide with other
// sessionStorage entries (e.g. pending-signup)
const KEY = "2fa-verified";

/* Marks the current session as 2FA-verified
 * Called after OTP is successfully validated
 */
export function mark2FAVerified() {
  sessionStorage.setItem(KEY, "1");
}

/* Checks whether the current session has passed 2FA
 * Used by route guards to block unverified users from reaching
 * protected pages directly
 */
export function is2FAVerified(): boolean {
  return sessionStorage.getItem(KEY) === "1";
}

/* Clears 2FA-verified flag */
export function clear2FAVerified() {
  sessionStorage.removeItem(KEY);
}