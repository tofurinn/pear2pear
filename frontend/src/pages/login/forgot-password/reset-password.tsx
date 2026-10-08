import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// TODO: adjust this path if this file lives in a different folder
import Navbar from "../../../components/navbar/global-navbar";
// TODO: adjust this path to wherever you keep the shared auth css
import "../login.css";

// TODO: import your Firebase auth helpers and error mapper, e.g.
// import { login } from "../../../firebase/auth";
// import { getAuthErrorMessage } from "../../../firebase/errors";

// TODO: fill in your route paths
const ROUTES = {
  afterReset: "/login"
};

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof ResetPasswordFormData, string>>;

function validate(data: ResetPasswordFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.newPassword) {
    errors.newPassword = "Enter a new password.";
  } else if (data.newPassword.length < 6) {
    errors.newPassword = "Password must be at least 6 characters long.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof ResetPasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // TODO: sign in with your auth helper, e.g.
      // await login(formData.email.trim(), formData.password);

      // TODO: if the account's accStatus is "Pending" (email not verified yet),
      // send them to the email verification page instead.
      // TODO: send volunteers to the volunteer dashboard if that's where they should land.

      navigate(ROUTES.afterReset);
    } catch {
      // TODO: use your errors.ts mapping here. Keep wrong email and wrong password
      // on the same message so the form doesn't reveal which accounts exist.
      setSubmitError("Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <main className="auth-main">
        <section className="auth-card">
          <h1 className="auth-card__title">Reset Password</h1>

          <form className="auth-form auth-form--tight" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="newPassword" className="auth-field__label">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className={`auth-field__input ${errors.newPassword ? "auth-field__input--error" : ""}`}
                value={formData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
              />
              {errors.newPassword && (
                <p id="newPassword-error" className="auth-field__error" role="alert">
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword" className="auth-field__label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`auth-field__input ${errors.confirmPassword ? "auth-field__input--error" : ""}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="auth-field__error" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Reserved line so the layout doesn't jump when an error appears */}
            <p
              className={`auth-form__message ${submitError ? "auth-form__message--error" : ""}`}
              role={submitError ? "alert" : undefined}
            >
              {submitError}
            </p>

            <button type="submit" className="auth-btn" disabled={isSubmitting}>
              {isSubmitting ? "Resetting password..." : "Reset Password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ResetPasswordPage;