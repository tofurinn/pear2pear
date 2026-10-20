/* Shape of the draft signup data held in sessionStorage */
export interface PendingSignup {
  // For user registration
  stepOne: {
    name: string;
    email: string;
    studentID: string;
  };
  // For volunteer registration
  volunteerProfile?: {
    categories: string[];
    supportMode: string;
    skills: string[];
    availability: string[];
  };
}

// Namespaced key so it doesn't collide with other sessionStorage entries
const KEY = "pending-signup";

/*
 * Overwrites the entire draft
 * Used when step 1 completes (replace, not merge)
 */
export function savePendingSignup(data: PendingSignup) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

/* Reads the draft, or null if nothing is stored */
export function readPendingSignup(): PendingSignup | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

/* Shallow-merges 'patch' into existing draft */
export function mergePendingSignup(patch: Partial<PendingSignup>) {
  const current = readPendingSignup() ?? ({} as PendingSignup);
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

/*
 * Wipes the draft. Called after signup succeeds so the next flow starts
 * fresh, as well as on logout to avoid stale email leaking
 */
export function clearPendingSignup() {
  sessionStorage.removeItem(KEY);
}