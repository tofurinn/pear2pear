import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// TODO: adjust these paths to your folders
import MainNavbar from "../../../components/navbar/main-navbar";
import "../../registration/register.css"; // shared field styles (register-field__*)
import "../../../components/page-css/settings.css";

// TODO: fill in your route paths
const ROUTES = {
  dashboard: "/student/dashboard",
};

// Max lengths mirror the USER table (name 255, studentID 15)
const MAX_LENGTH = {
  name: 255,
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
    let cancelled = false;

    (async () => {
      try {
        // TODO: load the student's name and studentID from Firestore, e.g.
        // const loaded = await getStudentSettings(uid);
        // if (!cancelled) {
        //   setFormData(loaded);
        //   setSaved(loaded);
        // }
      } catch {
        if (!cancelled) setLoadError("We couldn't load your settings. Please refresh the page.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveMessage("");
    setSaveError("");

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      // TODO: save to Firestore, e.g.
      // await saveStudentSettings(uid, {
      //   name: formData.name.trim(),
      //   studentID: formData.studentID.trim(),
      // });

      setSaved(formData);
      setSaveMessage("Changes saved.");
    } catch {
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