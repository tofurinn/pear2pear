import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clearPendingSignup } from "../../firebase/pending-signup";
import { auth } from "../../firebase/config";
import Navbar from "../../components/navbar/global-navbar";
import "./login.css";

const ROUTES = {
  forgotPassword: "/forgot-password",
  signUp: "/user-registration",
  twoFactor: "/email-verification",
};

interface LoginFormData {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof LoginFormData, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(data: LoginFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!data.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

const UserLoginPage: React.FC = () => {
  const navigate = useNavigate();
  

  // Holds the values the user types into email and password fields
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  // Holds validation error messages
  const [errors, setErrors] = useState<FormErrors>({});
  // Holds the system response when a login request is in flight (blocked, spinning, etc.)
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Holds submit error messages
  const [submitError, setSubmitError] = useState("");

  // Runs on every keystroke in any field input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Update only the field that changed, keeping others intact
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Also clears any previous submit errors
    if (submitError) setSubmitError("");
  };

  // Runs when the user submits the form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stop the browser's default full-page reload
    setSubmitError(""); // Reset any previous submit errors

    // Run client-side validation (invalid email formats, empty fields, etc.)
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    // If there are any, stop here
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true); // Show loading state
    try {
      // Call Firebase Auth to log in with email + password
      const cred = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(), // Trim any whitespace in the input
        formData.password
      );

      clearPendingSignup();

      // On success, navigate to OTP Page
      navigate(ROUTES.twoFactor, {
        // Pass the user's UID + email via state so
        // the next page knows who's logged in
        state: {
          uid: cred.user.uid,
          email: cred.user.email,
        },
        replace: true, // login is replaced and removed from history
      });
      // Map firebase error codes to error messages
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        // Deliberately vague message so attackers can't tell what's incorrect
        setSubmitError("Incorrect email or password.");
        // Max attempt error message
      } else if (err.code === "auth/too-many-requests") {
        setSubmitError("Too many attempts. Please try again later.");
        // Any other errors
      } else {
        setSubmitError("Login failed. Please try again.");
      }
    } finally {
      // Stops loading state, success or failure
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <main className="auth-main">
        <section className="auth-card">
          <h1 className="auth-card__title">Log in</h1>

          <form className="auth-form auth-form--tight" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email" className="auth-field__label">
                University Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`auth-field__input ${errors.email ? "auth-field__input--error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="auth-field__error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-field__label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`auth-field__input ${errors.password ? "auth-field__input--error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="auth-field__error" role="alert">
                  {errors.password}
                </p>
              )}
              <p className="auth-form__aside">
                <Link to={ROUTES.forgotPassword} className="auth-link auth-link--underlined">
                  Forgot password?
                </Link>
              </p>
            </div>

            {/* Reserved line so the layout doesn't jump when an error appears */}
            <p
              className={`auth-form__message ${submitError ? "auth-form__message--error" : ""}`}
              role={submitError ? "alert" : undefined}
            >
              {submitError}
            </p>

            <button type="submit" className="auth-btn" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>

            <p className="auth-card__text">
              Don&rsquo;t have an account?{" "}
              <Link to={ROUTES.signUp} className="auth-link">
                Sign up
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
};

export default UserLoginPage;