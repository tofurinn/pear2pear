import type { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../../types/Support_Request';
import type { Student } from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import { CheckIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import '../../../../global.css';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step1Props {
  formData: Pick<SessionFormData, 'reqID'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
  requests: Support_Request[];
  students: Record<string, Student>;
  isLoading: boolean;
}

const formatDate = (ts: Timestamp) =>
  ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Component ─────────────────────────────────────────────────────────────────

function SelectRequestStep({ formData, updateFormData, requests, students, isLoading }: Step1Props) {
  const selectRequest = (reqID: string) => {
    if (reqID === formData.reqID) return;
    // The volunteer's own slots don't change with the request, but a slot picked earlier may no longer suit, so clear it
    updateFormData({ reqID, sessDate: '', sessTimeSlot: '' });
  };

  return (
    <>
      <h2 className="ui-card-heading">Step 1: Select A Request</h2>

      {isLoading ? (
        <p className="ui-card-body" role="status">Loading accepted requests...</p>
      ) : requests.length === 0 ? (
        <p className="ui-card-body">You have no accepted requests available to schedule.</p>
      ) : (
      <div className="ui-card-body request-grid" role="radiogroup" aria-label="Select a request">
        {requests.map((request) => {
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
              <span className="volunteer-name">{students[request.studUID]?.name ?? 'Student'}</span>
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
      )}
    </>
  );
}

export default SelectRequestStep;