import type { CSSProperties } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { MOCK_REQUESTS, getVolunteerById } from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import { CheckIcon, StepNav } from '../session-ui.tsx';
import '../../../../global.css';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step1Props {
  formData: Pick<SessionFormData, 'reqID'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
  onNext: () => void;
}

const CARDS_PER_PAGE = 4; // a 2 x 2 block, as in the Figma frame

const formatDate = (ts: Timestamp) =>
  ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Cards 1-4 fill a 2x2 block (left to right, top to bottom); card 5 starts the next block to the right
const gridPosition = (index: number): CSSProperties =>
  ({
    '--row': Math.floor((index % CARDS_PER_PAGE) / 2) + 1,
    '--col': (index % 2) + 2 * Math.floor(index / CARDS_PER_PAGE) + 1,
  }) as CSSProperties;

// ─── Component ─────────────────────────────────────────────────────────────────

function SelectRequestStep({ formData, updateFormData, onNext }: Step1Props) {
  const selectRequest = (reqID: string) => {
    if (reqID === formData.reqID) return;
    // A different request means a different volunteer, so clear any chosen slot
    updateFormData({ reqID, sessDate: '', sessTimeSlot: '' });
  };

  return (
    <>
      <h2 className="step-heading">Step 1: Select A Request</h2>

      <div className="step-body request-grid" role="radiogroup" aria-label="Select a request">
        {MOCK_REQUESTS.map((request, index) => {
          const isSelected = formData.reqID === request.reqID;
          return (
            <button
              key={request.reqID}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`request-card ${isSelected ? 'selected' : ''}`}
              style={gridPosition(index)}
              onClick={() => selectRequest(request.reqID)}
            >
              <span className="category-tag">{request.category}</span>
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

      <StepNav onNext={onNext} nextDisabled={!formData.reqID} />
    </>
  );
}

export default SelectRequestStep;