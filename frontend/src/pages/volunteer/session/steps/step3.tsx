import type { SessionFormData } from '../session-utils.tsx';
import { MAX_MEETING_LOCATION_LENGTH } from '../session-utils.tsx';
import { ChevronDown } from '../../../../components/icons.tsx';


// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step3Props {
  formData: Pick<SessionFormData, 'supportMode' | 'meetingLocation'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function MeetupDetailsStep({ formData, updateFormData }: Step3Props) {
  const locationLength = formData.meetingLocation.trim().length;
  const isTooLong = locationLength > MAX_MEETING_LOCATION_LENGTH;
  return (
    <>
      <h2 className="ui-card-heading">Step 3: Meetup Details</h2>

      <div className="ui-card-body ui-field-stack">
        <div className="ui-field">
          <label className="ui-field-label" htmlFor="supportMode">Support Mode</label>
          <div className="ui-select-wrap">
            <select
              id="supportMode"
              className="ui-field-control"
              value={formData.supportMode}
              onChange={e => updateFormData({ supportMode: e.target.value as SessionFormData['supportMode'] })}
            >
              <option value="Physical">Physical</option>
              <option value="Virtual">Virtual</option>
            </select>
            <ChevronDown className="ui-select-icon" />
          </div>
        </div>

        <div className="ui-field">
          <label className="ui-field-label" htmlFor="meetingLocation">Meeting Location</label>
          <input
            id="meetingLocation"
            type="text"
            className={`ui-field-control ${isTooLong ? 'ui-field-control--error' : ''}`.trim()}
            value={formData.meetingLocation}
            placeholder={formData.supportMode === 'Virtual' ? 'Paste the meeting link' : 'e.g. Student Lounge 2 at the sofa'}
            aria-invalid={isTooLong}
            aria-describedby={isTooLong ? 'meetingLocation-error' : undefined}
            onChange={e => updateFormData({ meetingLocation: e.target.value })}
          />
          {isTooLong && (
            <p id="meetingLocation-error" className="ui-field-error" role="alert">
              Please keep this under {MAX_MEETING_LOCATION_LENGTH} characters ({locationLength}/{MAX_MEETING_LOCATION_LENGTH})
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default MeetupDetailsStep;