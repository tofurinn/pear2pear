// Category, Support Mode and Skills fields.
// Shared by the volunteer registration (step 1) and the volunteer settings page.

export const CATEGORIES = [
  "Academic Support",
  "Technology Support",
  "New Student Support",
  "General Student Support",
] as const;

export const CATEGORY_SKILLS = {
  "Academic Support": [
    "Mathematics",
    "Programming",
    "Poster & Slides Design",
    "Proofreading",
    "Presentation Rehearsal",
    "Language Practice",
  ],
  "Technology Support": [
    "Operating System Setup",
    "Software Installation",
    "Device Troubleshooting",
  ],
  "New Student Support": [
    "Campus Navigation",
    "Course Registration Help",
    "Orientation Guidance",
    "Housing Setup",
    "Club & Activity Guide",
  ],
  "General Student Support": [
    "Cooking & Meal Prep",
    "Sewing & Clothing",
    "Furniture Assembly",
    "Errands & Transport",
    "Time & Study Planning",
  ],
} as const;

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

/**
 * Groups the selected categories with their available skills.
 * Used for rendering the skills section with per-category headers.
 */
function getGroupedSkills(selectedCategories: string[]) {
  return selectedCategories
    .map((category) => {
      const skills = CATEGORY_SKILLS[category as keyof typeof CATEGORY_SKILLS] ?? [];
      return { category, skills };
    })
    .filter((group) => group.skills.length > 0);
}

/**
 * Flattened list of all skills available for the given categories.
 * Used by handleToggleCategory to prune orphaned skills.
 */
function getAvailableSkills(selectedCategories: string[]): string[] {
  const allSkills = selectedCategories.flatMap(
    (category) => CATEGORY_SKILLS[category as keyof typeof CATEGORY_SKILLS] ?? []
  );
  return [...new Set(allSkills)];
}

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
  const groupedSkills = getGroupedSkills(value.categories);
  const hasCategories = value.categories.length > 0;

  /**
   * When a category is toggled, also remove any currently selected skills
   * that no longer belong to any remaining category.
   */
  const handleToggleCategory = (category: string) => {
    const nextCategories = toggleItem(value.categories, category);
    const validSkills = new Set(getAvailableSkills(nextCategories));
    const filteredSkills = value.skills.filter((s) => validSkills.has(s));

    onChange({
      categories: nextCategories,
      skills: filteredSkills,
    });
  };

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

        {!hasCategories ? (
          <p className="volunteer-skills-empty">Select a category above to see the relevant skills.</p>
        ) : (
          <div className="volunteer-skills-groups">
            {groupedSkills.map((group) => (
              <div key={group.category} className="volunteer-skill-group">
                <h4 className="volunteer-skill-group__title">{group.category}</h4>

                <div className="volunteer-options volunteer-options--grid">
                  {group.skills.map((skill) => (
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
              </div>
            ))}
          </div>
        )}

        {errors.skills && (
          <p className="register-field__error" role="alert">{errors.skills}</p>
        )}
      </fieldset>
    </>
  );
}