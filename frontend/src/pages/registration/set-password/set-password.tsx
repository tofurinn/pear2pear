import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// TODO: adjust this path if this file lives in a different folder
import Navbar from "../../../components/navbar/global-navbar";
import "../register.css";


// TODO: import your Firebase auth helpers and error mapper, e.g.
// import { login } from "../../../firebase/auth";
// import { getAuthErrorMessage } from "../../../firebase/errors";

// TODO: fill in your route paths
const ROUTES = {
  afterSet: "/student/dashboard"
};

interface SetPasswordFormData {
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof SetPasswordFormData, string>>;

function validate(data: SetPasswordFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.password) {
    errors.password = "Enter a password.";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof SetPasswordFormData]) {
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

      navigate(ROUTES.afterSet);
    } catch {
      // TODO: use your errors.ts mapping here. Keep wrong email and wrong password
      // on the same message so the form doesn't reveal which accounts exist.
      setSubmitError("Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pass-page">
      <Navbar />

      <main className="pass-main">
        <section className="pass-card">
          <h1 className="pass-card__title">Set Password</h1>

          <form className="pass-form pass-form--tight" onSubmit={handleSubmit} noValidate>
            <div className="pass-field">
              <label htmlFor="newPassword" className="pass-field__label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`pass-field__input ${errors.password ? "set-field__input--error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="pass-field__error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="pass-field">
              <label htmlFor="confirmPassword" className="pass-field__label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`pass-field__input ${errors.confirmPassword ? "pass-field__input--error" : ""}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="pass-field__error" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Reserved line so the layout doesn't jump when an error appears */}
            <p
              className={`pass-form__message ${submitError ? "pass-form__message--error" : ""}`}
              role={submitError ? "alert" : undefined}
            >
              {submitError}
            </p>

            <button type="submit" className="pass-btn" disabled={isSubmitting}>
              {isSubmitting ? "Setting password..." : "Set Password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SetPasswordPage;