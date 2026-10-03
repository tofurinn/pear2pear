import type { SessionSummary } from '../session-utils.tsx';
import {
  CalendarIcon,
  ChevronRight,
  ClockIcon,
  PinIcon,
  SessionArrangedIcon,
  StarRating,
  SwapIcon,
} from '../session-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step4Props {
  summary: SessionSummary;
  onReturnToDashboard: () => void;
  onViewSession: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function SessionConfirmationStep({ summary, onReturnToDashboard, onViewSession }: Step4Props) {
  const { volunteer } = summary;

  return (
    <div className="confirmation">
      <SessionArrangedIcon className="confirmation-icon" />
      <h1 className="confirmation-title">Your Support Session Has Been Arranged!</h1>
      <p className="confirmation-message">
        Sit tight, you will receive a notification once your matched Volunteer confirms the session
      </p>

      <h2 className="summary-label">Session Booking Summary</h2>
      <div className="summary">
        <span className="category-tag">{summary.category}</span>
        <h3 className="summary-title">{summary.title}</h3>

        <dl className="summary-details">
          <div className="detail">
            <dt><CalendarIcon size={26} /> Session Date</dt>
            <dd>{summary.dateLabel}</dd>
          </div>
          <div className="detail">
            <dt><SwapIcon size={26} /> Support Mode</dt>
            <dd>{summary.supportMode}</dd>
          </div>
          <div className="detail">
            <dt><ClockIcon size={26} /> Timeslot</dt>
            <dd>{summary.timeslotLabel}</dd>
          </div>
          <div className="detail">
            <dt><PinIcon size={26} /> Meeting Location</dt>
            <dd>{summary.meetingLocation}</dd>
          </div>
        </dl>

        <div className="volunteer-card">
          <div className="volunteer-card-header">
            <span className="volunteer-card-name">{volunteer.name}</span>
            <StarRating rating={volunteer.rating} />
            <span className="rating-text">{volunteer.rating} ({volunteer.ratingCount})</span>
          </div>
          <p className="volunteer-tags">{volunteer.tags.join(' • ')}</p>
        </div>
      </div>

      <div className="confirmation-actions">
        <button type="button" className="ui-btn ui-btn-solid" onClick={onReturnToDashboard}>
          Return to Dashboard
        </button>
        <button type="button" className="ui-btn ui-btn-outline" onClick={onViewSession}>
          View Session <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default SessionConfirmationStep;