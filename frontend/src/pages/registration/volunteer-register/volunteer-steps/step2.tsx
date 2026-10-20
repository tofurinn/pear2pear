import React, { useState } from "react";
import HourPicker from "../../../../components/hour-picker/hour-picker";
import type { VolunteerProfileData } from "../volunteer-register";

interface Step2Props {
  data: VolunteerProfileData;
  onChange: (patch: Partial<VolunteerProfileData>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

// Inline SVG icons
const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

export default function Step2({ data, onChange, onBack, onSubmit }: Step2Props) {
  // Single error message for this step. Kept local bc nothing outside
  // this component needs to know if the user did not pick a slot
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Block submit until at least one slot is chosen
    if (data.availability.length === 0) {
      setError("Select at least one time slot.");
      return;
    }
    setError("");
    onSubmit();
  };

  return (
    <form className="register-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="volunteer-fieldset">

        {/* Hour Picker Component */}
        <HourPicker
          selectedSlots={data.availability}
          onSelectionChange={(availability) => {
            onChange({ availability });
            if (error) setError("");
          }}
        />

        {error && (
          <p className="register-field__error" role="alert">
            {error}
          </p>
        )}
      </fieldset>

      <div className="ui-actions volunteer-actions">
        {/*Back returns to step 1 without triggering submission */}
        <button
          type="button"
          className="ui-btn ui-btn-outline"
          onClick={onBack}
        >
          <ChevronLeft />
          Previous Page
        </button>
        {/* Enter key + button click both run handleSubmit */}
        <button type="submit" className="ui-btn ui-btn-primary">
          Submit
        </button>
      </div>
    </form>
  );
}