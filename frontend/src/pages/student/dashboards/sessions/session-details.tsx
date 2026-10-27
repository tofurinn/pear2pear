import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, CloseIcon, PinIcon, SwapIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { getStudentSessionStatus } from '../../student-utils.tsx';
import type { StudentSessionItem } from '../../student-utils.tsx';

import '../../../../components/page-css/details.css';

// ─── Extra fields the popup needs ──────────────────────────────────────────────
// Schedule details are populated by buildStudentSessionItems() when session data is mapped.

export interface SessionDetailsExtras {
  description?: string;
  createdLabel?: string;
  supportMode?: string; // e.g. "Physical"
  timeslot?: string; // e.g. "3PM – 4PM"
  location?: string; // e.g. "Help's Founder's Library Discussion Room 1"
  studentDetails?: {
    name: string;
    requestStatus: string;
    feedback?: { rating: number; comments: string };
  };
  volunteer?: {
    name: string;
    rating: number;
    skills?: string[];
    requestStatusLabel?: string; // e.g. "Accepted"
  };
}

export type SessionDetailsItem = StudentSessionItem & SessionDetailsExtras;

// ─── Small icons (swap for ones in icons.tsx if you already have them) ─────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="session-modal-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <span
            key={i}
            className="session-modal-star"
            style={{ ['--fill' as string]: `${fill}%` }}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </span>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface SessionDetailsModalProps {
  item: SessionDetailsItem;
  onClose: () => void;
  onSubmitFeedback?: (item: SessionDetailsItem) => void;
  onCancelSession?: (item: SessionDetailsItem) => void;
  onRearrange?: (item: SessionDetailsItem) => void;
  onConfirmArrangement?: (item: SessionDetailsItem) => void;
  footerActions?: ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SessionDetailsModal({
  item,
  onClose,
  onSubmitFeedback,
  onCancelSession,
  onRearrange,
  onConfirmArrangement,
  footerActions,
}: SessionDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { tone, label } = getStudentSessionStatus(item);
  const volunteer = item.volunteer;
  const student = item.studentDetails;

  const canGiveFeedback = item.sessStatus === 'Completed' && !!onSubmitFeedback;
  const canChangeArrangement = item.sessStatus === 'Planned' || item.sessStatus === 'Confirmed';
  const needsStudentConfirmation =
    item.sessStatus === 'Planned' &&
    !item.studConfirmed &&
    item.volConfirmed &&
    label !== 'Elapsed';

  // Escape to close, Tab stays inside the dialog, page behind doesn't scroll,
  // and focus returns to the card that opened the dialog.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="session-modal-backdrop"
      onMouseDown={e => {
        // only close when the backdrop itself is clicked, not the dialog
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-modal-title"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="session-modal-close"
          aria-label="Close session details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <h2 id="session-modal-title" className="session-modal-title">
          {item.title}
        </h2>

        <div className="session-modal-tagrow">
          <CategoryTag className="session-modal-tag">{item.category}</CategoryTag>
          <span className="session-modal-topdate">
            <CalendarIcon /> {item.createdLabel}
          </span>
        </div>

        <dl className="session-modal-info">
          <div className="session-modal-info-row">
            <dt><CalendarIcon /> Session Date</dt>
            <dd>{item.dateLabel}</dd>
          </div>
          <div className="session-modal-info-row">
            <dt><SwapIcon /> Support Mode</dt>
            <dd>{item.supportMode ?? '—'}</dd>
          </div>
          <div className="session-modal-info-row">
            <dt><ClockIcon /> Timeslot</dt>
            <dd>{item.timeslot ?? '—'}</dd>
          </div>
          <div className="session-modal-info-row">
            <dt><PinIcon /> Meeting Location</dt>
            <dd>{item.location ?? '—'}</dd>
          </div>
        </dl>

        {item.description && <p className="session-modal-description">{item.description}</p>}

        {student && (
          <section className="session-modal-volunteer session-modal-requester" aria-label="Requesting student">
            <div className="session-modal-volunteer-head">
              <span className="session-modal-requested-by">Requested by <strong>{student.name}</strong></span>
            </div>
            {student.feedback && (
              <div className="session-modal-feedback">
                <h3 className="session-modal-feedback-title">Submitted Feedback</h3>
                <div className="session-modal-feedback-content">
                  <div className="session-modal-feedback-stars" aria-label={`${student.feedback.rating} out of 5 stars`}>
                    {'★'.repeat(Math.floor(student.feedback.rating))}
                    {student.feedback.rating % 1 >= 0.5 ? '½' : ''}
                  </div>
                  <p className="session-modal-feedback-comments">{student.feedback.comments}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {volunteer && (
          <section className="session-modal-volunteer" aria-label="Matched volunteer">
            <div className="session-modal-volunteer-head">
              <span className="session-modal-volunteer-name">{volunteer.name}</span>
              <Stars rating={volunteer.rating} />
              <span className="session-modal-volunteer-rating">
                {volunteer.rating.toFixed(1)} ({volunteer.ratingCount})
              </span>
            </div>
            {volunteer.skills && volunteer.skills.length > 0 && (
              <p className="session-modal-skills">{volunteer.skills.join(' • ')}</p>
            )}
          </section>
        )}

        <footer className="session-modal-footer">
          <span className={`ui-status-pill ui-status-pill--${tone}`}>
            {tone === 'planned' ? <ClockIcon /> : tone === 'to-confirm' ? <AlertIcon /> : tone === 'confirmed' ? <CheckIcon /> : <CalendarIcon />} {label}
          </span>
          {canChangeArrangement && (
            <div className="session-modal-actions">
              {onCancelSession && (
                <button type="button" className="ui-chip-btn ui-chip-btn--danger session-modal-action" onClick={() => onCancelSession(item)}>
                  Cancel
                </button>
              )}
              {onRearrange && (
                <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={() => onRearrange(item)}>
                  Rearrange
                </button>
              )}
              {needsStudentConfirmation && onConfirmArrangement && (
                <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={() => onConfirmArrangement(item)}>
                  Confirm Arrangement
                </button>
              )}
            </div>
          )}
          {footerActions}
          {canGiveFeedback && (
            <button
              type="button"
              className="session-modal-feedback-btn"
              onClick={() => onSubmitFeedback?.(item)}
            >
              Submit Feedback
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SessionDetailsModal;