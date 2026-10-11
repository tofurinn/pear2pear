import React, { useState } from "react";
import type { VolunteerProfileData } from "../volunteer-register";
import VolunteerProfileFields from "../../../../components/volunteer-profile-fields";

type FormErrors = {
  categories?: string;
  skills?: string;
};

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3l5 5-5 5" />
  </svg>
);

interface Step1Props {
  data: VolunteerProfileData;
  onChange: (patch: Partial<VolunteerProfileData>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Step1({ data, onChange, onBack, onNext }: Step1Props) {
  const [errors, setErrors] = useState<FormErrors>({});

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: FormErrors = {};
    if (data.categories.length === 0) nextErrors.categories = "Choose at least one category.";
    if (data.skills.length === 0) nextErrors.skills = "Choose at least one skill.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onNext();
  };

  return (
  <form className="register-form" onSubmit={handleNext} noValidate>
    <VolunteerProfileFields
      value={data}
      onChange={(patch) => { onChange(patch); setErrors({}); }}
      errors={errors}
    />
    
    <div className="ui-actions volunteer-actions">
        <button type="button" className="ui-btn ui-btn-outline" onClick={onBack}>
          <ChevronLeft />
          Previous Page
        </button>
        <button type="submit" className="ui-btn ui-btn-outline">
          Next Page
          <ChevronRight />
        </button>
      </div>
  </form>
);
  
}