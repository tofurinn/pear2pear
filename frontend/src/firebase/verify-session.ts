const KEY = "2fa-verified";

export function mark2FAVerified() {
  sessionStorage.setItem(KEY, "1");
}

export function is2FAVerified(): boolean {
  return sessionStorage.getItem(KEY) === "1";
}

export function clear2FAVerified() {
  sessionStorage.removeItem(KEY);
}