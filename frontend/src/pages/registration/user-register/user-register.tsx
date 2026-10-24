import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { savePendingSignup } from "../../../firebase/pending-signup";
import { getUserByEmail, getUserByStudentID } from "../../../services/UserService"
import { readPendingSignup, clearPendingSignup } from "../../../firebase/pending-signup";
import Navbar from "../../../components/navbar/global-navbar";
import "../register.css";

// Centralized ROUTE paths so URL changes only happen in one place
const ROUTES = {
  login: "/login",
  volunteerRegister: "/volunteer-registration",
  nextStep: "/email-validation"
};

// Max lengths for each input field
const MAX_LENGTH = {
  name: 20,
  email: 255,
  studentID: 15,
} as const;

// Subset of the USER entity collected in step 1
// Password is handled by Firebase Auth
export interface StudentStepOneData {
  name: string;
  email: string;
  studentID: string;
}

// Enable form errors to take 0 or more string values
type FormErrors = Partial<Record<keyof StudentStepOneData, string>>;

// Email shape check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// VALIDATOR : Maps errors to an error message
// Empty returns means the form is valid
function validate(data: StudentStepOneData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (!data.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!data.studentID.trim()) {
    errors.studentID = "Enter your student ID.";
  }

  return errors;
}

const UserRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Restore step 1 data if the user navigated back from a later step
  const saved = (location.state as { stepOne?: StudentStepOneData } | null)?.stepOne;
  const savedFromStorage = readPendingSignup()?.stepOne;
  const initialData = saved ?? savedFromStorage ?? { name: "", email: "", studentID: "" };

  const [formData, setFormData] = useState<StudentStepOneData>(initialData);
  // Holds validation error messages
  const [errors, setErrors] = useState<FormErrors>({});
  // Holds the system response when a signup request is in flight (blocked, spinning, etc.)
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Holds submit error messages
  const [submitError, setSubmitError] = useState("");

  // Function to handle any form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Destructures the input's name + value (don't need to write once for each field)
    const { name, value } = e.target;
    // Updates the input for a certain field (only changed fields, keeps the rest)
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof StudentStepOneData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // STUDENT-ONLY PATH
  // Stash the collected data, then continue to OTP step
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    // Display errors if there are any
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    // If there are none, proceed
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Check if email is already registered
      const emailInUse = await getUserByEmail(formData.email.trim());
      if (emailInUse) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered.",
        }));
        return;
      }

      // Check if Student ID is already registered
      const studentIDInUse = await getUserByStudentID(formData.studentID.trim());
      if (studentIDInUse) {
        setErrors((prev) => ({
          ...prev,
          studentID: "This Student ID is already registered"
        }));
        return;
      }

      // If both email and student ID is unregistered, proceed
      // Persist to sessionStorage so the data survives refresh
      // and is saved (readeable in later steps)
      savePendingSignup({
        stepOne: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          studentID: formData.studentID.trim(),
        },
      });

      // Navigate to next step and pass the email via state, so the OTP
      // page has it even if sessionStorage isn't accessible yet
      navigate(ROUTES.nextStep, {
        state: { ...location.state, email: formData.email.trim() },
      });
      // Display error if form submission doesn't go through
    } catch (err) {
      console.error("Availability check failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // VOLUNTEER PATH
  // Stash the collected data, then continue to OTP step
  const handleBecomeVolunteer = async () => {
    setSubmitError("");

    // Display error if there are any
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    // If there are none, proceed
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Check if email is already registered
      const emailInUse = await getUserByEmail(formData.email.trim());
      if (emailInUse) {
        setErrors((prev) => ({
          ...prev,
          email: "This email is already registered.",
        }));
        return;
      }

      // Check if Student ID is already registered
      const studentIDInUse = await getUserByStudentID(formData.studentID.trim());
      if (studentIDInUse) {
        setErrors((prev) => ({
          ...prev,
          studentID: "This Student ID is already registered"
        }));
        return;
      }

      // If both email and student ID is unregistered, proceed
      // Persist to sessionStorage so the data survives refresh and is
      // saved (readable by later steps)
      savePendingSignup({
        stepOne: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          studentID: formData.studentID.trim(),
        },
      });

      // Navigate to next step and pass the email via state, so the OTP
      // page has it even if sessionStorage isn't accessible yet
      navigate(ROUTES.volunteerRegister, {
        state: { ...location.state, email: formData.email.trim() },
      });
    } catch (err) {
      console.error("Availability check failed:", err);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="register-page">
      {/* Navigation bar */}
      <Navbar />

      {/* Main content */}
      <main className="register-main">
        <section className="register-card">
          <h1 className="register-card__title">Register as a Student</h1>

          <form className="register-form" onSubmit={handleSubmit} noValidate>

            {/* ---- Name ---- */}
            <div className="register-field">
              <label htmlFor="name" className="register-field__label">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`register-field__input ${errors.name ? "register-field__input--error" : ""}`}
                value={formData.name}
                onChange={handleChange}
                maxLength={MAX_LENGTH.name}
                autoComplete="name"
                // aria-invalid + aria-describedby tells screen readers
                // "this field has an error, and here's the message ID"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="register-field__error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* ---- Email ---- */}
            <div className="register-field">
              <label htmlFor="email" className="register-field__label">
                University Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`register-field__input ${errors.email ? "register-field__input--error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                maxLength={MAX_LENGTH.email}
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="register-field__error" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* ---- Student ID ---- */}
            <div className="register-field">
              <label htmlFor="studentID" className="register-field__label">
                Student ID
              </label>
              <input
                id="studentID"
                name="studentID"
                type="text"
                className={`register-field__input ${errors.studentID ? "register-field__input--error" : ""}`}
                value={formData.studentID}
                onChange={handleChange}
                maxLength={MAX_LENGTH.studentID}
                autoComplete="off"
                aria-invalid={!!errors.studentID}
                aria-describedby={errors.studentID ? "studentID-error" : undefined}
              />
              {errors.studentID && (
                <p id="studentID-error" className="register-field__error" role="alert">
                  {errors.studentID}
                </p>
              )}
            </div>

            {/* Submission-level error (e.g. network failure) */}
            {submitError && (
              <p className="register-form__submit-error" role="alert">
                {submitError}
              </p>
            )}

            {/* "Become a Volunteer" button and "Sign Up" button */}
            <div className="register-actions">
              <div className="register-actions__col">
                <button
                  type="button"
                  className="register-btn register-btn--volunteer"
                  onClick={handleBecomeVolunteer}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Checking..." : "Become a Volunteer"}
                </button>
              </div>

              <div className="register-actions__col">
                <button
                  type="submit"
                  className="register-btn register-btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing up..." : "Sign Up"}
                </button>
                <p className="register-actions__login">
                  Already registered?{" "}
                  <Link to={ROUTES.login} 
                  onClick={clearPendingSignup}
                  className="register-actions__login-link">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default UserRegisterPage;