import type { RequestFormData, SupportMode } from '../request-utils.tsx';
import { CheckIcon, ChevronDown, StepNav } from '../request-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step2Props {
  formData: Pick<RequestFormData, 'supportMode' | 'requiredSkills'>;
  availableSkills: string[];
  volunteersLoading: boolean;
  volunteersError: string;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function FilteringStep({
  formData,
  availableSkills,
  volunteersLoading,
  volunteersError,
  updateFormData,
  onPrevious,
  onNext,
}: Step2Props) {
  const { requiredSkills } = formData;

  const toggleSkill = (skill: string) =>
    updateFormData({
      requiredSkills: requiredSkills.includes(skill)
        ? requiredSkills.filter(s => s !== skill)
        : [...requiredSkills, skill],
    });

  return (
    <>
      <h2 className="ui-card-heading">Step 2: Filtering</h2>

      <div className="ui-card-body ui-field-stack">
        <div className="ui-field">
          <label className="ui-field-label" htmlFor="supportMode">Preferred Support Mode</label>
          <div className="ui-select-wrap">
            <select
              id="supportMode"
              className="ui-field-control"
              value={formData.supportMode}
              onChange={e => updateFormData({ supportMode: e.target.value as SupportMode })}
            >
              <option value="Physical">Physical</option>
              <option value="Virtual">Virtual</option>
            </select>
            <ChevronDown className="ui-select-icon" />
          </div>
        </div>

        <div className="ui-field">
          <span className="ui-field-label" id="skills-label">Required Skills</span>
          <div className="rf-skill-grid" role="group" aria-labelledby="skills-label">
            {volunteersLoading ? (
              <p className="dashboard-empty">Loading volunteer skills...</p>
            ) : volunteersError ? (
              <p className="ui-error" role="alert">{volunteersError}</p>
            ) : null}
            {availableSkills.map(skill => {
              const checked = requiredSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className="rf-skill"
                  onClick={() => toggleSkill(skill)}
                >
                  <span className="rf-skill-dot">{checked && <CheckIcon size={16} />}</span>
                  {skill}
                </button>
              );
            })}
            {!volunteersLoading && !volunteersError && availableSkills.length === 0 && (
              <p className="dashboard-empty">No volunteer skills are available for this support mode.</p>
            )}
          </div>
        </div>
      </div>

      <StepNav onPrevious={onPrevious} onNext={onNext} />
    </>
  );
}

export default FilteringStep;