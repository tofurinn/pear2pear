import React, { useState } from "react";
import type { VolunteerProfileData } from "../volunteer-register";

const CATEGORIES = [
  "Academic Support",
  "Technology Support",
  "New Student Support",
  "General Student Support",
] as const;

const SKILLS = [
  "High Achiever", "Navigation", "Cooking",
  "Patience", "Friendly", "Sewing",
  "Tech Wiz", "Strength", "Problem-solver",
] as const;

const SUPPORT_MODES = [
  { value: "virtual", label: "Virtual" },
  { value: "physical", label: "Physical" },
];

type FormErrors = {
  categories?: string;
  skills?: string;
};

interface Step1Props {
  data: VolunteerProfileData;
  onChange: (patch: Partial<VolunteerProfileData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const toggleItem = (list: string[], item: string): string[] =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

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

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6l5 5 5-5" />
  </svg>
);

export default function Step1({ data, onChange, onBack, onNext }: Step1Props) {
  const [errors, setErrors] = useState<FormErrors>({});

  const handleToggleCategory = (category: string) => {
    const categories = toggleItem(data.categories, category);
    onChange({ categories });
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: undefined }));
  };

  const handleToggleSkill = (skill: string) => {
    const skills = toggleItem(data.skills, skill);
    onChange({ skills });
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: undefined }));
  };

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
      <fieldset className="volunteer-fieldset">
        <legend className="register-field__label volunteer-legend">Category</legend>
        <div className="volunteer-options">
          {CATEGORIES.map((category) => (
            <label key={category} className="volunteer-check">
              <input
                type="checkbox"
                className="volunteer-check__input"
                checked={data.categories.includes(category)}
                onChange={() => handleToggleCategory(category)}
              />
              <span className="volunteer-check__box" aria-hidden="true">
                <CheckIcon />
              </span>
              <span className="volunteer-check__label">{category}</span>
            </label>
          ))}
        </div>
        {errors.categories && (
          <p className="register-field__error" role="alert">{errors.categories}</p>
        )}
      </fieldset>

      <div className="register-field">
        <label htmlFor="supportMode" className="register-field__label">
          Preferred Support Mode
        </label>
        <div className="volunteer-select">
          <select
            id="supportMode"
            name="supportMode"
            className="register-field__input volunteer-select__control"
            value={data.supportMode}
            onChange={(e) => onChange({ supportMode: e.target.value })}
          >
            {SUPPORT_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>{mode.label}</option>
            ))}
          </select>
          <span className="volunteer-select__icon"><ChevronDown /></span>
        </div>
      </div>

      <fieldset className="volunteer-fieldset">
        <legend className="register-field__label volunteer-legend">Skills</legend>
        <div className="volunteer-options volunteer-options--grid">
          {SKILLS.map((skill) => (
            <label key={skill} className="volunteer-check">
              <input
                type="checkbox"
                className="volunteer-check__input"
                checked={data.skills.includes(skill)}
                onChange={() => handleToggleSkill(skill)}
              />
              <span className="volunteer-check__box" aria-hidden="true">
                <CheckIcon />
              </span>
              <span className="volunteer-check__label">{skill}</span>
            </label>
          ))}
        </div>
        {errors.skills && (
          <p className="register-field__error" role="alert">{errors.skills}</p>
        )}
      </fieldset>

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