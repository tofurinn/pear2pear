import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  generateSixDigitCode,
  isExpired,
  expiryTimestamp,
} from "../../../firebase/otp";
import { sendOtpEmail } from "../../../firebase/email";
import { readPendingSignup } from "../../../firebase/pending-signup";
import { SKIP_OTP } from "../../../firebase/skip-otp";
import Navbar from "../../../components/navbar/global-navbar";
import "../register.css";

// Centralised ROUTE paths so URL changes only happen here
const ROUTES = {
  nextStep: "/set-password",
  previousStep: "/user-registration",
};

const CODE_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const EmailValidationPage: React.FC = () => {
  // Guard against React StrictMode's double-invoke on mount
  // Send effect sends once in dev 
  const sentRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Email can come from 2 locations
  const emailFromState =
    // Navigation state if previous step was user-registration
    (location.state as { email?: string } | null)?.email ??
    // sessionStorage if refreshed or navigation state was lost
    readPendingSignup()?.stepOne.email ??
    // Falling back to "" means the send effect bails and shows an error instead
    // of crashing with "undefined email"
    "";

  const [email] = useState(emailFromState);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null); // ← NEW
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInitialSending, setIsInitialSending] = useState(false); // ← NEW

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dev-only bypass: When enabled, jump straight past this page
  // Used while in the development stage to avoid burning EmailJS quota
  useEffect(() => {
    if (SKIP_OTP) {
      navigate("/set-password", { state: location.state, replace: true });
    }
  }, [navigate, location.state]);

  // Send the first OTP on mount (unless skipping)
  // sentRef guard prevents the double-send
  useEffect(() => {
    if (SKIP_OTP) return;
    if (!email) return;
    if (sentRef.current) return;
    sentRef.current = true;
    sendCode();
  }, [email]);

  // Focus an input by index, clamped to the valid range
  // Used after typing, pasting, or backspacing so the cursor always lands
  // in a real box (Never at -1 or 7)
  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  // Fill multiple boxes starting from startIndex (used for PASTE)
  const fillFrom = (startIndex: number, chars: string[]) => {
    const next = [...digits];
    chars.slice(0, CODE_LENGTH - startIndex).forEach((char, i) => {
      next[startIndex + i] = char;
    });
    setDigits(next);
    focusInput(startIndex + chars.length);
  };

  // Shared send logic for initial send AND resend
  // Generates a fresh code, updates state, and emails it
  const sendCode = async (opts: { isResend?: boolean } = {}) => {
    if (SKIP_OTP) return;
    if (!email) {
      setError("No email address found. Please start over.");
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
        // Clears input so the user can type the new code
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
        setResendMessage("A new code is on its way.");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setError("We couldn't send the code. Please try again.");
    } finally {
      if (opts.isResend) setIsResending(false);
      else setIsInitialSending(false);
    }
  };

  // Handle typing in a digit box
  // Strips non-digits (letters/symbols) then either clears the box (backspace)
  // or fills the current box position (typing/pasting)
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

  // Handle keyboard navigation between boxes
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace on an empty box moves the cursor back and clears the previous digit
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

  // Handle paste: strips non-digits and fills from the current box
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

    // Rejects expired codes before even comparing them to the generated one
    // "Expired" has precedence over "Incorrect"
    if (expiresAt && isExpired(expiresAt)) {
      setError("That code has expired. Click \"Send again\" for a new one.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Compares the entered code to the generated one
      if (code !== generatedCode) {
        setError("That code didn't work. Check it and try again.");
        return;
      }

      navigate(ROUTES.nextStep, { state: location.state });
    } catch {
      setError("That code didn't work. Check it and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    await sendCode({ isResend: true });
  };

  // Submit is disabled while sending, verifying, or before code is entered
  const submitDisabled = isSubmitting || isInitialSending || !generatedCode;

  return (
    <div className="valid-page">
      <Navbar />
      <main className="valid-main">
        <section className="valid-card">
          <h1 className="valid-card__title">Email Validation</h1>
          <p className="valid-card__subtitle">
            Please check your email inbox for a {CODE_LENGTH}-digit code!
          </p>
          <p className="valid-card__resend-text">
            Didn&rsquo;t receive it?{" "}
            <button
              type="button"
              className="valid-card__resend-btn"
              onClick={handleResend}
              disabled={isResending || isInitialSending}
            >
              {isResending ? "Sending..." : "Send again"}
            </button>
          </p>

          <form className="valid-form" onSubmit={handleSubmit} noValidate>
            <div
              className="valid-code"
              role="group"
              aria-label={`${CODE_LENGTH}-digit verification code`}
            >
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className={`valid-code__input ${error ? "valid-code__input--error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  // Only the first box hints to autofill
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
              className={`valid-form__message ${error ? "valid-form__message--error" : ""}`}
              role={error ? "alert" : "status"}
            >
              {isInitialSending ? "Sending your code..." : error || resendMessage}
            </p>

            <button
              type="submit"
              className="valid-btn"
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

export default EmailValidationPage;