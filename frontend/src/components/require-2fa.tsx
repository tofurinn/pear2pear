import { Navigate } from "react-router-dom";
import { is2FAVerified } from "../firebase/verify-session";

export default function Require2FA({ children }: { children: React.ReactNode }) {
  if (!is2FAVerified()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}