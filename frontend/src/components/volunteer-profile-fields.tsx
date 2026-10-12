// Category, Support Mode and Skills fields.
// Shared by the volunteer registration (step 1) and the volunteer settings page.
// Styled by the register-* and volunteer-* classes (register.css + volunteer-register.css).

export const CATEGORIES = [
  "Academic Support",
  "Technology Support",
  "New Student Support",
  "General Student Support",
] as const;

// Listed row by row so the 3-column grid matches the wireframe
export const SKILLS = [
  "High Achiever", "Navigation", "Cooking",
  "Patience", "Friendly", "Sewing",
  "Tech Wiz", "Strength", "Problem-solver",
] as const;

export const SUPPORT_MODES = [
  { value: "Virtual", label: "Virtual" },
  { value: "Physical", label: "Physical" },
];

export interface ProfileFieldsValue {
  categories: string[];
  supportMode: "Physical" | "Virtual";
  skills: string[];
}

export interface ProfileFieldsErrors {
  categories?: string;
  skills?: string;
}

interface VolunteerProfileFieldsProps {
  value: ProfileFieldsValue;
  onChange: (patch: Partial<ProfileFieldsValue>) => void;
  errors?: ProfileFieldsErrors;
  supportModeLabel?: string;
}

const toggleItem = (list: string[], item: string): string[] =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6l5 5 5-5" />
  </svg>
);

export default function VolunteerProfileFields({
  value,
  onChange,
  errors = {},
  supportModeLabel = "Preferred Support Mode",
}: VolunteerProfileFieldsProps) {
  return (
    <>
      <fieldset className="volunteer-fieldset">
        <legend className="register-field__label volunteer-legend">Category</legend>
        <div className="volunteer-options">
          {CATEGORIES.map((category) => (
            <label key={category} className="volunteer-check">
              <input
                type="checkbox"
                className="volunteer-check__input"
                checked={value.categories.includes(category)}
                onChange={() => onChange({ categories: toggleItem(value.categories, category) })}
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
          {supportModeLabel}
        </label>
        <div className="volunteer-select">
          <select
            id="supportMode"
            name="supportMode"
            className="register-field__input volunteer-select__control"
            value={value.supportMode}
            onChange={(e) => onChange({ supportMode: e.target.value as "Physical" | "Virtual" })}
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
                checked={value.skills.includes(skill)}
                onChange={() => onChange({ skills: toggleItem(value.skills, skill) })}
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
    </>
  );
}
