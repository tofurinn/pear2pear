import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// TODO: adjust this path if this file lives in a different folder
import Navbar from "../../../components/navbar/global-navbar";
// TODO: adjust this path to wherever you keep the shared auth css
import "../login.css";

// TODO: fill in your route paths
const ROUTES = {
  login: "/login",
  verifyCode: "/verify-code", // the page where they enter the 6-digit code
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ChevronLeft = () => (
  <svg
    className="auth-btn__icon"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 3L5 8l5 5" />
  </svg>
);

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email you registered with.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: call your API to send the verification code to this email, e.g.
      // await sendPasswordResetCode({ email: trimmed });

      // TODO: your Email Verification page currently reads the email from
      // location.state.stepOne.email, so update it (or this state) so they match.
      navigate(ROUTES.verifyCode, { state: { email: trimmed } });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <main className="auth-main">
        <section className="auth-card">
          <h1 className="auth-card__title">Email Verification</h1>
          <p className="auth-card__subtitle">Please enter the email you registered with.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <input
                id="email"
                name="email"
                type="email"
                className={`auth-field__input ${error ? "auth-field__input--error" : ""}`}
                value={email}
                onChange={handleChange}
                autoComplete="email"
                aria-label="Email"
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {/* Reserved line so the layout doesn't jump when an error appears */}
              <p
                id="email-error"
                className="auth-field__error auth-field__error--reserve"
                role={error ? "alert" : undefined}
              >
                {error}
              </p>
            </div>

            <div className="auth-actions">
              <Link to={ROUTES.login} className="auth-btn auth-btn--outline">
                <ChevronLeft />
                Log in
              </Link>

              <button type="submit" className="auth-btn" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;