import React, { useState } from "react";
import HourPicker from "../../../../components/hour-picker/hour-picker";
import type { VolunteerProfileData } from "../volunteer-register";

interface Step2Props {
  data: VolunteerProfileData;
  onChange: (patch: Partial<VolunteerProfileData>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

export default function Step2({ data, onChange, onBack, onSubmit }: Step2Props) {
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        <button
          type="button"
          className="ui-btn ui-btn-outline"
          onClick={onBack}
        >
          <ChevronLeft />
          Previous Page
        </button>
        <button type="submit" className="ui-btn ui-btn-primary">
          Submit
        </button>
      </div>
    </form>
  );
}