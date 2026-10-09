import type { Timestamp } from 'firebase/firestore';
import { MOCK_REQUESTS, getVolunteerById } from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import { CheckIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import '../../../../global.css';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step1Props {
  formData: Pick<SessionFormData, 'reqID'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
}

const formatDate = (ts: Timestamp) =>
  ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Component ─────────────────────────────────────────────────────────────────

function SelectRequestStep({ formData, updateFormData }: Step1Props) {
  const selectRequest = (reqID: string) => {
    if (reqID === formData.reqID) return;
    // A different request means a different volunteer, so clear any chosen slot
    updateFormData({ reqID, sessDate: '', sessTimeSlot: '' });
  };

  return (
    <>
      <h2 className="ui-card-heading">Step 1: Select A Request</h2>

      <div className="ui-card-body request-grid" role="radiogroup" aria-label="Select a request">
        {MOCK_REQUESTS.map((request) => {
          const isSelected = formData.reqID === request.reqID;
          return (
            <button
              key={request.reqID}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`request-card ${isSelected ? 'selected' : ''}`}
              onClick={() => selectRequest(request.reqID)}
            >
              <CategoryTag>{request.category}</CategoryTag>
              <span className="request-title">{request.title}</span>
              <span className="volunteer-name">{getVolunteerById(request.volID)?.name}</span>
              <span className="request-footer">
                <span className="request-date">{formatDate(request.reqTimestamp)}</span>
                <span className={`status-pill ${request.reqStatus.toLowerCase()}`}>
                  <CheckIcon size={14} /> {request.reqStatus}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default SelectRequestStep;