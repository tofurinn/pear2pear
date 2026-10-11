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

const ROUTES = {
  nextStep: "/set-password",
  previousStep: "/user-registration",
};

const CODE_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const EmailValidationPage: React.FC = () => {
  const sentRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Email comes from the previous step (user registration) via location.state
  const emailFromState =
    (location.state as { email?: string } | null)?.email ??
    readPendingSignup()?.stepOne.email ??
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

  useEffect(() => {
    if (SKIP_OTP) {
      navigate("/set-password", { state: location.state, replace: true });
    }
  }, [navigate, location.state]);

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

  // Shared send logic for initial send AND resend
  const sendCode = async (opts: { isResend?: boolean } = {}) => {
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

  // Send the first code as soon as the page loads
  useEffect(() => {
    if (!email) return;
    if (sentRef.current) return;   // ← the guard
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

    // ← NEW: expiry check
    if (expiresAt && isExpired(expiresAt)) {
      setError("That code has expired. Click \"Send again\" for a new one.");
      return;
    }

    console.log("generatedCode:", JSON.stringify(generatedCode));
    console.log("userCode:     ", JSON.stringify(code));
    console.log("equal:        ", code === generatedCode);

    setIsSubmitting(true);
    try {
      // TODO: replace this with a server-side verification call later.
      // For now we compare against the code we generated in this browser.
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