import type { SessionSummary } from '../session-utils.tsx';
import {
  CalendarIcon,
  ChevronRight,
  ClockIcon,
  PinIcon,
  StarRating,
  SwapIcon,
} from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';

// Approximation of the Figma clipboard icon: export the real SVG from Figma and swap it in
const SessionArrangedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="arranged-gradient" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#5fc77a" />
        <stop offset="1" stopColor="#e3e66d" />
      </linearGradient>
    </defs>
    <g stroke="url(#arranged-gradient)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 28h-4a8 8 0 00-8 8v62a8 8 0 008 8h68a8 8 0 008-8V36a8 8 0 00-8-8h-4" />
      <path d="M40 20v16M80 20v16M52 28h16" />
      <path d="M44 84l4-14 26-26 10 10-26 26-14 4z" />
    </g>
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step4Props {
  summary: SessionSummary;
  title?: string;      // defaults to the "arranged" wording used by the booking form
  message?: string;
  onReturnToDashboard: () => void;
  onViewSession: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

function SessionConfirmationStep({
  summary,
  title = 'Your Support Session Has Been Arranged!',
  message = 'Sit tight, you will receive a notification once your matched Volunteer confirms the session',
  onReturnToDashboard,
  onViewSession,
}: Step4Props) {
  const { volunteer } = summary;

  return (
    <div className="ui-confirmation">
      <SessionArrangedIcon className="ui-confirmation-icon" />
      <h1 className="ui-confirmation-title">{title}</h1>
      <p className="ui-confirmation-message">{message}</p>

      <h2 className="summary-label">Session Booking Summary</h2>
      <div className="summary">
        <CategoryTag>{summary.category}</CategoryTag>
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
            <span className="rating-text">{volunteer.rating.toFixed(1)} ({volunteer.ratingCount})</span>
          </div>
          <p className="volunteer-tags">{volunteer.tags.join(' • ')}</p>
        </div>
      </div>

      <div className="ui-confirmation-actions">
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