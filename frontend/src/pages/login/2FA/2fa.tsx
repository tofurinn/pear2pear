import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  generateSixDigitCode,
  isExpired,
  expiryTimestamp,
} from "../../../firebase/otp";
import { sendOtpEmail } from "../../../firebase/email";
import { auth } from "../../../firebase/config";
import { mark2FAVerified, is2FAVerified } from "../../../firebase/verify-session";
import { getUser } from "../../../services/UserService";
import { SKIP_OTP } from "../../../firebase/skip-otp";
import Navbar from "../../../components/navbar/global-navbar";
import "../login.css";

const CODE_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { uid?: string; email?: string } | null;

  const [uid] = useState(state?.uid ?? auth.currentUser?.uid ?? "");
  const [email, setEmail] = useState(state?.email ?? auth.currentUser?.email ?? "");

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInitialSending, setIsInitialSending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!SKIP_OTP) return;
    mark2FAVerified();
    navigate("/student/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (SKIP_OTP) return;
    if (!email) return;
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode();
  }, [email]);

  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  const fillFrom = (startIndex: number, chars: string[]) => {
    const next = [...digits];
    chars.slice(0, CODE_LENGTH - startIndex).forEach((char, i) => {
      next[startIndex + i] = char;
    });
    setDigits(next);
    focusInput(startIndex + chars.length);
  };

  const sendCode = async (opts: { isResend?: boolean } = {}) => {
    if (!email) {
      setError("No email address found. Please log in again.");
      return;
    }

    if (opts.isResend) setIsResending(true);
    else setIsInitialSending(true);

    setError("");
    setResendMessage("");

    try {
      const otp = generateSixDigitCode();
      const expires = expiryTimestamp(OTP_EXPIRY_MINUTES);

      setGeneratedCode(otp);
      setExpiresAt(expires);

      await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);

      if (opts.isResend) {
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
        setResendMessage("A new code is on its way.");
      }
    } catch (err) {
      console.error("Failed to send 2FA code:", err);
      setError("We couldn't send the code. Please try again.");
    } finally {
      if (opts.isResend) setIsResending(false);
      else setIsInitialSending(false);
    }
  };

  // 1. Resolve email from Firestore if missing
  useEffect(() => {
    if (email || !uid) return;
    getUser(uid).then((u) => {
      if (u?.email) setEmail(u.email);
    });
  }, [email, uid]);

  // 2. Bounce unauthenticated users back to login
  useEffect(() => {
    if (!auth.currentUser && !state?.uid) {
      navigate("/login", { replace: true });
    }
  }, [navigate, state?.uid]);

  // 3. Skip ahead if already verified this session
  useEffect(() => {
    if (is2FAVerified()) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [navigate]);

  // 4. Send the first code once we have an email
  useEffect(() => {
    if (!email) return;
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const cleaned = e.target.value.replace(/\D/g, "");

    if (cleaned.length === 0) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    fillFrom(index, cleaned.split(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusInput(index - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) fillFrom(index, pasted.split(""));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError(`Enter all ${CODE_LENGTH} digits of your code.`);
      return;
    }

    if (expiresAt && isExpired(expiresAt)) {
      setError('That code has expired. Click "Send again" for a new one.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (code !== generatedCode) {
        setError("That code didn't work. Check it and try again.");
        return;
      }

      mark2FAVerified();

      const userData = uid ? await getUser(uid) : null;
      navigate(
        userData?.isVolunteer ? "/volunteer/dashboard" : "/student/dashboard",
        { replace: true }
      );
    } catch (err) {
      console.error("2FA verification failed:", err);
      setError("That code didn't work. Check it and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    await sendCode({ isResend: true });
  };

  const submitDisabled = isSubmitting || isInitialSending || !generatedCode;

  return (
    <div className="verify-page">
      <Navbar />
      <main className="verify-main">
        <section className="verify-card">
          <h1 className="verify-card__title">Email Verification</h1>
          <p className="verify-card__subtitle">
            Please check your email inbox for a {CODE_LENGTH}-digit code!
          </p>
          <p className="verify-card__resend-text">
            Didn&rsquo;t receive it?{" "}
            <button
              type="button"
              className="verify-card__resend-btn"
              onClick={handleResend}
              disabled={isResending || isInitialSending}
            >
              {isResending ? "Sending..." : "Send again"}
            </button>
          </p>

          <form className="verify-form" onSubmit={handleSubmit} noValidate>
            <div
              className="verify-code"
              role="group"
              aria-label={`${CODE_LENGTH}-digit verification code`}
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`verify-code__input ${error ? "verify-code__input--error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  onFocus={(e) => e.target.select()}
                  aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                  aria-invalid={!!error}
                  disabled={isInitialSending}
                />
              ))}
            </div>

            <p
              className={`verify-form__message ${error ? "verify-form__message--error" : ""}`}
              role={error ? "alert" : "status"}
            >
              {isInitialSending ? "Sending your code..." : error || resendMessage}
            </p>

            <button
              type="submit"
              className="verify-btn"
              disabled={submitDisabled}
            >
              {isSubmitting ? "Verifying..." : "Submit"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default EmailVerificationPage;