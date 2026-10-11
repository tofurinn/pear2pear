import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebase/config";
import Navbar from "../../../components/navbar/global-navbar";
import "../login.css";

// TODO: fill in your route paths
const ROUTES = {
  login: "/login"
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

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (message) setMessage("");
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
      await sendPasswordResetEmail(auth, trimmed);
      // Always show the same message whether or not the email exists
      setMessage("If that email is registered, a reset link is on its way.");
    } catch {
      // Don't leak existence via error either — same message
      setMessage("If that email is registered, a reset link is on its way.");
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
                className={`auth-field__error auth-field__error--reserve ${message ? "auth-field__error--success" : ""}`}
                role={error ? "alert" : undefined}
              >
                {error || message}
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