import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import { getUser } from "../services/UserService";
import type { User } from "../types/User";
import type { User as FirebaseUser } from "firebase/auth"
 
interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userDoc: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (auth.currentUser) {
      const freshDoc = await getUser(auth.currentUser.uid);
      setUserDoc(freshDoc);
    }
  };

  

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      setFirebaseUser(user);

      if (!user) {
        setUserDoc(null);
        setLoading(false);
        return;
      }

      try {
        const doc = await getUser(user.uid);
        if (!cancelled) setUserDoc(doc);
      } catch (err) {
        console.error("Failed to load user doc:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userDoc, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}