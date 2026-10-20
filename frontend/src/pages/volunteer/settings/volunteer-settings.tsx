import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../../../components/navbar/main-navbar";
import HourPicker from "../../../components/hour-picker/hour-picker";
import VolunteerProfileFields from "../../../components/volunteer-profile-fields";
import type { ProfileFieldsErrors, ProfileFieldsValue } from "../../../components/volunteer-profile-fields";
import { useAuth } from "../../../context/authContext";
import { getVolunteer, updateVolunteer } from "../../../services/VolunteerService";
import { getAvailabilityByVolunteer, syncAvailabilities } from "../../../services/AvailabilityService";
import { DAY_NAMES } from "../../student/student-utils";
import "../../registration/register.css";
import "../../registration/volunteer-register/volunteer-register.css";
import "./volunteer-settings.css";
import "../../../components/page-css/settings.css";

const ROUTES = {
  dashboard: "/volunteer/dashboard",
};

interface VolunteerSettingsData extends ProfileFieldsValue {
  availability: string[];
}

const EMPTY_SETTINGS: VolunteerSettingsData = {
  categories: [],
  supportMode: "Virtual",
  skills: [],
  availability: [],
};

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

export default function VolunteerSettingsPage() {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { userDoc, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<VolunteerSettingsData>(EMPTY_SETTINGS);
  const [saved, setSaved] = useState<VolunteerSettingsData>(EMPTY_SETTINGS); // last loaded / saved version
  const [draftSlots, setDraftSlots] = useState<string[]>([]);               // availability being edited in the dialog
  const [errors, setErrors] = useState<ProfileFieldsErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const isDirty = JSON.stringify(profile) !== JSON.stringify(saved);

  // Load the signed-in volunteer's current settings
  useEffect(() => {
    if (authLoading || !userDoc?.UID) return;
    let cancelled = false;

    (async () => {
      try {
        // 1. Fetch both volunteer doc and availability docs
        const [volunteer, availabilityDocs] = await Promise.all([
          getVolunteer(userDoc.UID),
          getAvailabilityByVolunteer(userDoc.UID),
        ]);

        if (cancelled) return;

        if (!volunteer) {
          setLoadError("Could not find your volunteer profile.");
          setIsLoading(false);
          return;
        }

        // 2. Map availability docs back to the string keys the HourPicker expects
        // e.g., { dayOfWeek: "Monday", availTimeSlot: 14 } → "1:14:00"
        const slots = availabilityDocs.map((doc) => {
          const weekday = DAY_NAMES.indexOf(doc.dayOfWeek);
          const hourPadded = String(doc.availTimeSlot).padStart(2, '0'); // "8" -> "08"
          return `${weekday}:${hourPadded}:00`;
        });

        // 3. Set both form data and the "saved" snapshot
        const loaded = {
          categories: volunteer.volCategories,
          supportMode: volunteer.prefSupportMode,
          skills: volunteer.skills,
          availability: slots,
        };
        console.log("Raw availability from DB:", availabilityDocs);
        console.log("Mapped slots for HourPicker:", slots);
        setProfile(loaded);
        setSaved(loaded);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError("We couldn't load your settings. Please refresh the page.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, userDoc?.UID]);

  const handleFieldsChange = (patch: Partial<ProfileFieldsValue>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    setErrors({});
    setSaveMessage("");
    setSaveError("");
  };

  // ----- Availability dialog -----
  const openAvailability = () => {
    // Pass the slots directly to the state *before* opening the dialog
    const currentSlots = [...profile.availability]; // Create a copy
    setDraftSlots(currentSlots);

    // Small delay ensures React processes the state update before the dialog opens
    setTimeout(() => {
      dialogRef.current?.showModal();
    }, 0);
  };

  const applyAvailability = () => {
    setProfile((prev) => ({ ...prev, availability: draftSlots }));
    setSaveMessage("");
    setSaveError("");
    dialogRef.current?.close();
  };

  const cancelAvailability = () => {
    dialogRef.current?.close();
  };

  // ----- Save / leave -----
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveMessage("");
    setSaveError("");

    const nextErrors: ProfileFieldsErrors = {};
    if (profile.categories.length === 0) nextErrors.categories = "Choose at least one category.";
    if (profile.skills.length === 0) nextErrors.skills = "Choose at least one skill.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!userDoc?.UID) return;

    setIsSaving(true);
    try {
      await updateVolunteer(userDoc.UID, {
        volCategories: profile.categories,
        prefSupportMode: profile.supportMode,
        skills: profile.skills,
      });

      // 2. Handle availability (this is the tricky part)
      // Strategy: delete all old availability docs, then create new ones.
      // Or: only create/delete the ones that differ. For a student project, 
      // "delete all and recreate" is easiest.
      await syncAvailabilities(userDoc.UID, profile.availability);

      setSaved(profile);
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
    <div className="ui-page register-page settings-page settings-page--volunteer">
      <MainNavbar dashboardPath={ROUTES.dashboard} />

      <main className="register-main">
        <section className="register-card settings-card">
          <h1 className="settings-card__title">Volunteer settings</h1>
          <hr className="settings-divider" />

          {isLoading ? (
            <p className="settings-message">Loading your settings...</p>
          ) : loadError ? (
            <p className="settings-message settings-message--error" role="alert">{loadError}</p>
          ) : (
            <form className="register-form" onSubmit={handleSave} noValidate>
              <VolunteerProfileFields
                value={profile}
                onChange={handleFieldsChange}
                errors={errors}
                supportModeLabel="Support Mode"
              />

              <fieldset className="volunteer-fieldset">
                <legend className="register-field__label volunteer-legend">Availability</legend>
                <button
                  type="button"
                  className="ui-btn ui-btn-outline settings-availability-btn"
                  onClick={openAvailability}
                >
                  Edit availability
                </button>
              </fieldset>

              {/* Reserved line so the layout doesn't jump when a message appears */}
              <p
                className={`settings-message ${saveError ? "settings-message--error" : ""}`}
                role={saveError ? "alert" : "status"}
              >
                {saveError || saveMessage}
              </p>

              <div className="ui-actions volunteer-actions">
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

      {/* Availability editor. Changes only apply when "Done" is pressed. */}
      <dialog ref={dialogRef} className="settings-dialog" aria-labelledby="availability-dialog-title">
        <h2 id="availability-dialog-title" className="settings-dialog__title">Edit availability</h2>

        <HourPicker
          selectedSlots={draftSlots}
          onSelectionChange={setDraftSlots}
          showSelectAll
        />

        <div className="settings-dialog__actions">
          <button type="button" className="ui-btn ui-btn-outline" onClick={cancelAvailability}>
            Cancel
          </button>
          <button type="button" className="ui-btn ui-btn-solid" onClick={applyAvailability}>
            Done
          </button>
        </div>
      </dialog>
    </div>
  );
}