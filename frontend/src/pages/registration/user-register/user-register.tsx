import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar/global-navbar";
import "./user-register.css";

// TODO: fill in your route paths
const ROUTES = {
  home: "",
  signUp: "",
  login: "",
  volunteerRegister: "",
  nextStep: "", // step 2 of the student registration (e.g. password)
};

// Max lengths mirror the USER table (name 255, email 255, studentID 15)
const MAX_LENGTH = {
  name: 255,
  email: 255,
  studentID: 15,
} as const;

// Subset of the USER entity collected in step 1.
// UID, accStatus, isVolunteer and passwordHash are set by the backend / later steps.
export interface StudentStepOneData {
  name: string;
  email: string;
  studentID: string;
}

type FormErrors = Partial<Record<keyof StudentStepOneData, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const [formData, setFormData] = useState<StudentStepOneData>({
    name: "",
    email: "",
    studentID: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof StudentStepOneData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // TODO: call your API here if you need to check the email / studentID
      // is unused before moving on, e.g.
      // await checkStudentAvailability(formData);

      // Pass step 1 data to step 2 (or swap for context / state management)
      navigate(ROUTES.nextStep, { state: { stepOne: formData } });
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBecomeVolunteer = () => {
    navigate(ROUTES.volunteerRegister);
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
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="register-field__error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="email" className="register-field__label">
                Email
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

            {submitError && (
              <p className="register-form__submit-error" role="alert">
                {submitError}
              </p>
            )}

            <div className="register-actions">
              <div className="register-actions__col">
                <button
                  type="button"
                  className="register-btn register-btn--volunteer"
                  onClick={handleBecomeVolunteer}
                >
                  Become a Volunteer
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
                  <Link to={ROUTES.login} className="register-actions__login-link">
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