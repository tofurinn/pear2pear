import { SKILLS, addDays, getTomorrowKey } from '../request-utils.tsx';
import type { RequestFormData, SupportMode } from '../request-utils.tsx';
import { CheckIcon, ChevronDown, StepNav } from '../request-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step2Props {
  formData: Pick<RequestFormData, 'prefStart' | 'prefEnd' | 'supportMode' | 'requiredSkills'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function FilteringStep({ formData, updateFormData, onPrevious, onNext }: Step2Props) {
  const { prefStart, prefEnd, requiredSkills } = formData;

  // Changing the date range clears chosen slots in step 3, since they may fall outside it
  const changeStart = (start: string) => {
    if (!start) return;
    const keepEnd = prefEnd >= start && prefEnd <= addDays(start, 6);
    updateFormData({ prefStart: start, prefEnd: keepEnd ? prefEnd : addDays(start, 6), availability: [] });
  };

  const changeEnd = (end: string) => {
    if (!end) return;
    updateFormData({ prefEnd: end, availability: [] });
  };

  const toggleSkill = (skill: string) =>
    updateFormData({
      requiredSkills: requiredSkills.includes(skill)
        ? requiredSkills.filter(s => s !== skill)
        : [...requiredSkills, skill],
    });

  const validRange = prefStart !== '' && prefEnd !== '' && prefEnd >= prefStart;

  return (
    <>
      <h2 className="ui-card-heading">Step 2: Filtering</h2>

      <div className="ui-card-body ui-field-stack">
        <div className="ui-field">
          <span className="ui-field-label" id="date-label">Preferred Date</span>
          <div className="ui-field-control rf-date-range" role="group" aria-labelledby="date-label">
            <input
              type="date"
              className="rf-date-input"
              aria-label="From date"
              value={prefStart}
              min={getTomorrowKey()}
              onChange={e => changeStart(e.target.value)}
            />
            <span aria-hidden="true">–</span>
            <input
              type="date"
              className="rf-date-input"
              aria-label="To date"
              value={prefEnd}
              min={prefStart}
              max={prefStart ? addDays(prefStart, 6) : undefined}
              onChange={e => changeEnd(e.target.value)}
            />
          </div>
        </div>

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
              <option value="Online">Online</option>
            </select>
            <ChevronDown className="ui-select-icon" />
          </div>
        </div>

        <div className="ui-field">
          <span className="ui-field-label" id="skills-label">Required Skills</span>
          <div className="rf-skill-grid" role="group" aria-labelledby="skills-label">
            {SKILLS.map(skill => {
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
          </div>
        </div>
      </div>

      <StepNav onPrevious={onPrevious} onNext={onNext} nextDisabled={!validRange} />
    </>
  );
}

export default FilteringStep;