import type { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../../types/Support_Request';
import type { Student } from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import { ItemCard, StatusPill } from '../../../../components/dashboard-components.tsx';
import '../../../../global.css';
import '../../../../components/page-css/subdashboards.css';

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
            <ItemCard
              key={request.reqID}
              category={request.category}
              title={request.title}
              personName={students[request.studUID]?.name ?? 'Student'}
              dateLabel={formatDate(request.reqTimestamp)}
              pill={<StatusPill tone={request.reqStatus.toLowerCase()} label={request.reqStatus} />}
              role="radio"
              ariaChecked={isSelected}
              ariaLabel={`Select request: ${request.title}`}
              className={`request-card ${isSelected ? 'selected' : ''}`}
              onViewDetails={() => selectRequest(request.reqID)}
            />
          );
        })}
      </div>
      )}
    </>
  );
}

export default SelectRequestStep;