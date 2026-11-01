import { useEffect } from 'react';
import type { RequestFormData, SupportMode } from '../request-utils.tsx';
import { CheckIcon, ChevronDown, StepNav } from '../request-ui.tsx';
import HourPicker from '../../../../components/hour-picker/hour-picker.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step2Props {
  formData: Pick<RequestFormData, 'supportMode' | 'requiredSkills'>;
  availableSkills: readonly string[];
  skillsWithVolunteers: ReadonlySet<string>;
  availability: string[];
  availableSlots: ReadonlySet<string>;
  volunteersLoading: boolean;
  volunteersError: string;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious?: () => void;
  onNext: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function FilteringStep({
  formData,
  availableSkills,
  skillsWithVolunteers,
  availability,
  availableSlots,
  volunteersLoading,
  volunteersError,
  updateFormData,
  onPrevious,
  onNext,
}: Step2Props) {
  const { requiredSkills } = formData;
  const selectedAvailabilityCount = availability.length;

  useEffect(() => {
    if (volunteersLoading || volunteersError) return;
    const validSelection = availability.filter(slot => availableSlots.has(slot));
    if (validSelection.length !== selectedAvailabilityCount) {
      updateFormData({ availability: validSelection });
    }
  }, [availability, availableSlots, selectedAvailabilityCount, updateFormData, volunteersError, volunteersLoading]);

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
              onChange={e => updateFormData({
                supportMode: e.target.value as SupportMode,
                requiredSkills: [],
              })}
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
            {availableSkills.map(skill => {
              const checked = requiredSkills.includes(skill);
              const isUnavailable = !skillsWithVolunteers.has(skill);
              const disabled = !checked && (volunteersLoading || Boolean(volunteersError) || isUnavailable);
              return (
                <button
                  key={skill}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  aria-disabled={disabled}
                  className={`rf-skill${isUnavailable && !volunteersLoading && !volunteersError ? ' unavailable' : ''}`}
                  disabled={disabled}
                  onClick={() => toggleSkill(skill)}
                >
                  <span className="rf-skill-dot">{checked && <CheckIcon size={16} />}</span>
                  {skill}
                </button>
              );
            })}
            {!volunteersLoading && !volunteersError && availableSkills.length === 0 && (
              <p className="dashboard-empty">Select a support category to see its available skills.</p>
            )}
          </div>
        </div>
      </div>

      <div className="ui-field rf-availability-field">
        <span className="ui-field-label" id="availability-label">Availability</span>
        <div aria-busy={volunteersLoading}>
          {volunteersLoading && (
            <span className="ui-visually-hidden" role="status">Updating available times and skills.</span>
          )}
          <HourPicker
            selectedSlots={availability}
            onSelectionChange={slots => updateFormData({ availability: slots })}
            availableSlots={availableSlots}
            showSelectAll
          />
          {volunteersError && <p className="ui-error" role="alert">{volunteersError}</p>}
        </div>
      </div>

      <StepNav
        onPrevious={onPrevious}
        onNext={onNext}
        nextDisabled={selectedAvailabilityCount === 0 || volunteersLoading || Boolean(volunteersError)}
      />
    </>
  );
}

export default FilteringStep;