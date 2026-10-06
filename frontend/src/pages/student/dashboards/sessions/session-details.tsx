import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, CheckIcon, ClockIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import type { SessionItem } from '../dashboards-utils.tsx';

import '../../../../components/page-css/details.css';

// ─── Extra fields the popup needs ──────────────────────────────────────────────
// Schedule details are populated by buildSessionItems() when session data is mapped.

export interface SessionDetailsExtras {
  description?: string;
  sessionDateLabel?: string; // e.g. "11 Aug 2025" (falls back to item.dateLabel)
  supportMode?: string; // e.g. "Physical"
  timeslot?: string; // e.g. "3PM – 4PM"
  location?: string; // e.g. "Help's Founder's Library Discussion Room 1"
  volunteer?: {
    name: string;
    rating: number;
    reviewCount: number;
    skills?: string[];
    requestStatusLabel?: string; // e.g. "Accepted"
  };
}

export type SessionDetailsItem = SessionItem & SessionDetailsExtras;

// ─── Small icons (swap for ones in icons.tsx if you already have them) ─────────

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

const SwapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M7 3l-4 4 4 4M3 7h12a4 4 0 014 4M17 21l4-4-4-4M21 17H9a4 4 0 01-4-4" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.2" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </svg>
);

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
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SessionDetailsModal({ item, onClose, onSubmitFeedback }: SessionDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { tone, label } = item.status;
  const volunteer = item.volunteer;
  const canGiveFeedback = item.sessStatus === 'Completed' && !!onSubmitFeedback;

  // Escape to close, Tab stays inside the dialog, page behind doesn't scroll,
  // and focus returns to the "View Details" button afterwards.
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
            <CalendarIcon /> {item.sessionDateLabel ?? item.dateLabel}
          </span>
        </div>

        <dl className="session-modal-info">
          <div className="session-modal-info-row">
            <dt><CalendarIcon /> Session Date</dt>
            <dd>{item.sessionDateLabel ?? item.dateLabel}</dd>
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

        {volunteer && (
          <section className="session-modal-volunteer" aria-label="Matched volunteer">
            <div className="session-modal-volunteer-head">
              <span className="session-modal-volunteer-name">{volunteer.name}</span>
              <Stars rating={volunteer.rating} />
              <span className="session-modal-volunteer-rating">
                {volunteer.rating} ({volunteer.reviewCount})
              </span>
              {volunteer.requestStatusLabel && (
                <span className="session-modal-volunteer-status">{volunteer.requestStatusLabel}</span>
              )}
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