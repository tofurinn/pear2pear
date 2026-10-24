import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import { updateUser, getUserByStudentID } from "../../../services/UserService";
import MainNavbar from "../../../components/navbar/main-navbar";
import "../../registration/register.css";
import "../../../components/page-css/settings.css";

const ROUTES = {
  dashboard: "/student/dashboard",
};

// Max lengths mirror the USER table
const MAX_LENGTH = {
  name: 20,
  studentID: 15,
} as const;

interface StudentSettingsData {
  name: string;
  studentID: string;
}

type FormErrors = Partial<Record<keyof StudentSettingsData, string>>;

const EMPTY_SETTINGS: StudentSettingsData = { name: "", studentID: "" };

function validate(data: StudentSettingsData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Enter your name.";
  }

  if (!data.studentID.trim()) {
    errors.studentID = "Enter your student ID.";
  }

  return errors;
}

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

export default function StudentSettingsPage() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading, refreshUser } = useAuth();

  const [formData, setFormData] = useState<StudentSettingsData>(EMPTY_SETTINGS);
  const [saved, setSaved] = useState<StudentSettingsData>(EMPTY_SETTINGS); // last loaded / saved version
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const isDirty = formData.name !== saved.name || formData.studentID !== saved.studentID;

  // Load the signed-in student's current details
  useEffect(() => {
    if (authLoading) return;

    if (!userDoc) {
      setLoadError("Could not find your profile. Please log in again.");
      setIsLoading(false);
      return;
    }

    // 3. Populate the form with the context data
    const loadedData = {
      name: userDoc.name ?? "",
      studentID: userDoc.studentID ?? "",
    };
    
    setFormData(loadedData);
    setSaved(loadedData);
    setIsLoading(false);
  }, [userDoc, authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error for a field as soon as the user edits it
    if (errors[name as keyof StudentSettingsData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSaveMessage("");
    setSaveError("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  // Trim leading/trailing whitespace when the user leaves the field
  if (value !== value.trim()) {
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  }
};

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveMessage("");
    setSaveError("");

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    // Guard clause just in case
    if (!userDoc?.UID) return;

    setIsSaving(true);
    try {
      // 1. Check if the NEW student ID is already taken by someone else
      const trimmedStudentID = formData.studentID.trim();
      if (trimmedStudentID !== saved.studentID) {
        const idInUse = await getUserByStudentID(trimmedStudentID);
        if (idInUse) {
          setErrors((prev) => ({ ...prev, studentID: "This Student ID is already registered." }));
          setIsSaving(false);
          return; // Stop saving
        }
      }

      // 2. Update Firestore
      await updateUser(userDoc.UID, {
        name: formData.name.trim(),
        studentID: trimmedStudentID,
      });

      // 3. Refresh the AuthContext so other pages (like the dashboard) see the new name
      await refreshUser();

      // 4. Update local "saved" state so the "unsaved changes" warning goes away
      setSaved({
        name: formData.name.trim(),
        studentID: trimmedStudentID,
      });
      
      setSaveMessage("Changes saved.");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveError("We couldn't save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    navigate(ROUTES.dashboard);
  };

  return (
    <div className="ui-page register-page settings-page settings-page--student">
      <MainNavbar />

      <main className="register-main">
        <section className="register-card settings-card">
          <h1 className="settings-card__title">Student settings</h1>
          <hr className="settings-divider" />

          {isLoading ? (
            <p className="settings-message">Loading your settings...</p>
          ) : loadError ? (
            <p className="settings-message settings-message--error" role="alert">{loadError}</p>
          ) : (
            <form className="register-form" onSubmit={handleSave} noValidate>
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
                  onBlur={handleBlur}
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
                  onBlur={handleBlur}
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

              {/* Reserved line so the layout doesn't jump when a message appears */}
              <p
                className={`settings-message ${saveError ? "settings-message--error" : ""}`}
                role={saveError ? "alert" : "status"}
              >
                {saveError || saveMessage}
              </p>

              <div className="ui-actions settings-actions">
                <button type="button" className="ui-btn ui-btn-outline" onClick={handleBack}>
                  <ChevronLeft />
                  Dashboard
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn-solid"
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
