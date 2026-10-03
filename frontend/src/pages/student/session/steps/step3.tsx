import type { SessionFormData } from '../session-utils.tsx';
import { ChevronDown, StepNav } from '../session-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step3Props {
  formData: Pick<SessionFormData, 'supportMode' | 'meetingLocation'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function MeetupDetailsStep({ formData, updateFormData, onPrevious, onSubmit, isSubmitting }: Step3Props) {
  const canSubmit = formData.meetingLocation.trim() !== '' && !isSubmitting;

  return (
    <>
      <h2 className="step-heading">Step 3: Meetup Details</h2>

      <div className="step-body field-stack">
        <div className="field">
          <label className="field-label" htmlFor="supportMode">Support Mode</label>
          <div className="select-wrap">
            <select
              id="supportMode"
              className="field-control"
              value={formData.supportMode}
              onChange={e => updateFormData({ supportMode: e.target.value as SessionFormData['supportMode'] })}
            >
              <option value="Physical">Physical</option>
              <option value="Online">Online</option>
            </select>
            <ChevronDown className="select-icon" />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="meetingLocation">Meeting Location</label>
          <input
            id="meetingLocation"
            type="text"
            className="field-control"
            value={formData.meetingLocation}
            placeholder={formData.supportMode === 'Online' ? 'Paste the meeting link' : 'e.g. Student Lounge 2 at the sofa'}
            onChange={e => updateFormData({ meetingLocation: e.target.value })}
          />
        </div>
      </div>

      <StepNav
        onPrevious={onPrevious}
        onNext={onSubmit}
        nextLabel={isSubmitting ? 'Arranging…' : 'Arrange Session'}
        nextVariant="solid"
        nextDisabled={!canSubmit}
      />
    </>
  );
}

export default MeetupDetailsStep;