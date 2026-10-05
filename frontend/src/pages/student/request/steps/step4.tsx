import { matchVolunteers } from '../request-utils.tsx';
import type { RequestFormData } from '../request-utils.tsx';
import { StarRating, StepNav } from '../request-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step4Props {
  formData: Pick<RequestFormData, 'category' | 'requiredSkills' | 'availability' | 'volID'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function VolunteerMatchStep({ formData, updateFormData, onPrevious, onSubmit, isSubmitting }: Step4Props) {
  // Volunteers who fit the category, skills and availability chosen in the earlier steps
  const matches = matchVolunteers(formData);

  // A volunteer picked earlier may no longer match after the filters changed
  const hasValidChoice = matches.some(v => v.volID === formData.volID);

  return (
    <>
      <h2 className="ui-card-heading">Step 4: Volunteer Match-making</h2>

      {matches.length === 0 ? (
        <div className="ui-card-body rf-empty">
          <p>No volunteers match your filters yet.</p>
          <p>Go back and try fewer required skills or more time slots.</p>
        </div>
      ) : (
        <div className="ui-card-body rf-volunteer-grid" role="radiogroup" aria-label="Select a volunteer">
          {matches.map(volunteer => {
            const isSelected = formData.volID === volunteer.volID;
            return (
              <button
                key={volunteer.volID}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`rf-volunteer-card ${isSelected ? 'selected' : ''}`}
                onClick={() => updateFormData({ volID: volunteer.volID })}
              >
                <span className="rf-tag rf-tag--static">{formData.category}</span>
                <span className="rf-volunteer-name">{volunteer.name}</span>
                <span className="rf-volunteer-tags">{volunteer.tags.join(' • ')}</span>
                <span className="rf-volunteer-rating">
                  <StarRating rating={volunteer.rating} />
                  <span className="rf-rating-text">{volunteer.rating} ({volunteer.ratingCount})</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <StepNav
        onPrevious={onPrevious}
        onNext={onSubmit}
        nextLabel={isSubmitting ? 'Submitting…' : 'Submit Request'}
        nextVariant="solid"
        nextDisabled={!hasValidChoice || isSubmitting}
      />
    </>
  );
}

export default VolunteerMatchStep;