import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUser } from "../../../services/UserService";
import { createVolunteer } from "../../../services/VolunteerService";
import { createAvailability, slotKeyToAvailability } from "../../../services/AvailabilityService";
import { readPendingSignup, clearPendingSignup } from "../../../firebase/pending-signup";
import { auth } from "../../../firebase/config";
import Navbar from "../../../components/navbar/global-navbar";
import "../register.css";


// TODO: import your Firebase auth helpers and error mapper, e.g.
// import { login } from "../../../firebase/auth";
// import { getAuthErrorMessage } from "../../../firebase/errors";

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

    const pending = readPendingSignup();
    if (!pending?.stepOne.email) {
      // If state lost
      setSubmitError("Your session expired. Please start over.");
      navigate("/user-registration", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the Firebase Auth account
      const cred = await createUserWithEmailAndPassword(
        auth,
        pending.stepOne.email,
        formData.password
      );

      // Write the user document into Firestore
      await createUser(cred.user.uid, {
        name: pending.stepOne.name,
        email: pending.stepOne.email,
        studentID: pending.stepOne.studentID,
        isVolunteer: Boolean(pending.volunteerProfile),
      });

      // If they came through the volunteer flow, write the volunteer doc to Firestore too
      if (pending.volunteerProfile) {
        await createVolunteer(cred.user.uid, {
          volCategories: pending.volunteerProfile.categories,
          prefSupportMode: pending.volunteerProfile.supportMode as "Physical" | "Virtual",
          skills: pending.volunteerProfile.skills,
          avgRating: 0,
        });

        // + availability doc
        for (const slot of pending.volunteerProfile.availability) {
          await createAvailability(slotKeyToAvailability(slot, cred.user.uid));
        }
      }

      // Clean up sessionStorage once registration is complete
      clearPendingSignup();

      // Navigate to Success Message or display error if any
      navigate("/account-created", { replace: true });
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setSubmitError("That email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setSubmitError("Password is too weak.");
      } else {
        console.error("Signup failed:", err);
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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
                className={`pass-field__input ${errors.password ? "pass-field__input--error" : ""}`}
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