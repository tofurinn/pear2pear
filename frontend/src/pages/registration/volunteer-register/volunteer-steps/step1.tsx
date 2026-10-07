import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../../../components/navbar/global-navbar";
import "../../user-register/user-register.css";
import "../volunteer-register.css";

// TODO: fill in your route paths
const ROUTES = {
  previousPage: "", // e.g. the student step 1 page
  nextPage: "",
};

// TODO: swap these labels for ids/enums if your backend expects them
const CATEGORIES = [
  "Academic Support",
  "Technology Support",
  "New Student Support",
  "General Student Support",
] as const;

// Listed row by row so the 3-column grid matches the wireframe
const SKILLS = [
  "High Achiever",
  "Navigation",
  "Cooking",
  "Patience",
  "Friendly",
  "Sewing",
  "Tech Wiz",
  "Strength",
  "Problem-solver",
] as const;

// TODO: add the rest of the support modes
const SUPPORT_MODES = [
  { value: "virtual", label: "Virtual" },
  { value: "physical", label: "Physical" }
];

export interface VolunteerProfileData {
  categories: string[];
  supportMode: string;
  skills: string[];
}

type FormErrors = {
  categories?: string;
  skills?: string;
};

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

const VolunteerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<string[]>([]);
  const [supportMode, setSupportMode] = useState<string>(SUPPORT_MODES[0].value);
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleToggleCategory = (category: string) => {
    setCategories((prev) => toggleItem(prev, category));
    if (errors.categories) setErrors((prev) => ({ ...prev, categories: undefined }));
  };

  const handleToggleSkill = (skill: string) => {
    setSkills((prev) => toggleItem(prev, skill));
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: undefined }));
  };

  const handlePrevious = () => {
    navigate(ROUTES.previousPage);
  };

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: FormErrors = {};
    if (categories.length === 0) nextErrors.categories = "Choose at least one category.";
    if (skills.length === 0) nextErrors.skills = "Choose at least one skill.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const volunteerProfile: VolunteerProfileData = { categories, supportMode, skills };

    // TODO: save via your API here if this step needs to be stored before moving on

    // Keep anything passed from earlier pages and add this step's data
    navigate(ROUTES.nextPage, {
      state: { ...(location.state as object | null), volunteerProfile },
    });
  };

  return (
    // "ui-page" provides the sizing tokens the .ui-btn buttons rely on
    <div className="ui-page register-page">
      <Navbar />

      <main className="register-main">
        <section className="register-card">
          <h1 className="register-card__title">Register as a Volunteer</h1>

          <form className="register-form" onSubmit={handleNext} noValidate>
            {/* Category */}
            <fieldset className="volunteer-fieldset">
              <legend className="register-field__label volunteer-legend">Category</legend>
              <div className="volunteer-options">
                {CATEGORIES.map((category) => (
                  <label key={category} className="volunteer-check">
                    <input
                      type="checkbox"
                      className="volunteer-check__input"
                      checked={categories.includes(category)}
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
                <p className="register-field__error" role="alert">
                  {errors.categories}
                </p>
              )}
            </fieldset>

            {/* Preferred Support Mode */}
            <div className="register-field">
              <label htmlFor="supportMode" className="register-field__label">
                Preferred Support Mode
              </label>
              <div className="volunteer-select">
                <select
                  id="supportMode"
                  name="supportMode"
                  className="register-field__input volunteer-select__control"
                  value={supportMode}
                  onChange={(e) => setSupportMode(e.target.value)}
                >
                  {SUPPORT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <span className="volunteer-select__icon">
                  <ChevronDown />
                </span>
              </div>
            </div>

            {/* Skills */}
            <fieldset className="volunteer-fieldset">
              <legend className="register-field__label volunteer-legend">Skills</legend>
              <div className="volunteer-options volunteer-options--grid">
                {SKILLS.map((skill) => (
                  <label key={skill} className="volunteer-check">
                    <input
                      type="checkbox"
                      className="volunteer-check__input"
                      checked={skills.includes(skill)}
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
                <p className="register-field__error" role="alert">
                  {errors.skills}
                </p>
              )}
            </fieldset>

            {/* Buttons follow the shared ui.css styles */}
            <div className="ui-actions volunteer-actions">
              <button type="button" className="ui-btn ui-btn-outline" onClick={handlePrevious}>
                <ChevronLeft />
                Previous Page
              </button>
              <button type="submit" className="ui-btn ui-btn-outline">
                Next Page
                <ChevronRight />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default VolunteerRegisterPage;