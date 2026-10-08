import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar/global-navbar";
import "../login.css";

// TODO: fill in your route paths
const ROUTES = {
  nextStep: "/student/dashboard", // where to go after the email is verified
};

const CODE_LENGTH = 6;



const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    inputRefs.current[clamped]?.focus();
  };

  // Fill boxes starting at `startIndex` (used for typing, pasting and autofill)
  const fillFrom = (startIndex: number, chars: string[]) => {
    const next = [...digits];
    chars.slice(0, CODE_LENGTH - startIndex).forEach((char, i) => {
      next[startIndex + i] = char;
    });
    setDigits(next);
    focusInput(startIndex + chars.length);
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const cleaned = e.target.value.replace(/\D/g, "");

    if (cleaned.length === 0) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // One character = normal typing. More than one = autofill from the keyboard / SMS.
    fillFrom(index, cleaned.split(""));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0) {
      // Empty box: step back and clear the previous one
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

    setIsSubmitting(true);
    try {
      // TODO: call your API to verify the code, e.g.
      // await verifyEmailCode({ email, code });

      navigate(ROUTES.nextStep, { state: location.state });
    } catch {
      setError("That code didn't work. Check it and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMessage("");
    setIsResending(true);
    try {
      // TODO: call your API to send a new code, e.g.
      // await resendEmailCode({ email });

      setDigits(Array(CODE_LENGTH).fill(""));
      focusInput(0);
      setResendMessage("A new code is on its way.");
    } catch {
      setError("We couldn't send a new code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

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
              disabled={isResending}
            >
              Send again
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
                />
              ))}
            </div>

            {/* Reserved line so the layout doesn't jump when a message appears */}
            <p
              className={`verify-form__message ${error ? "verify-form__message--error" : ""}`}
              role={error ? "alert" : "status"}
            >
              {error || resendMessage}
            </p>

            <button
              type="submit"
              className="verify-btn"
              disabled={isSubmitting}
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
