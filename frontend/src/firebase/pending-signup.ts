export interface PendingSignup {
  stepOne: {
    name: string;
    email: string;
    studentID: string;
  };
  volunteerProfile?: {
    categories: string[];
    supportMode: string;
    skills: string[];
    availability: string[];
  };
}

const KEY = "pending-signup";

export function savePendingSignup(data: PendingSignup) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function readPendingSignup(): PendingSignup | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

export function mergePendingSignup(patch: Partial<PendingSignup>) {
  const current = readPendingSignup() ?? ({} as PendingSignup);
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearPendingSignup() {
  sessionStorage.removeItem(KEY);
}