import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ClockIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import type { SessionItem } from '../dashboards-utils.tsx';

import '../../../../components/page-css/details.css';

interface SupportFeedback {
  rating: number;
  comments: string;
}

interface SupportDetailsModalProps {
  item: SessionItem;
  feedback?: SupportFeedback;
  onClose: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`session-modal-stars ${className}`.trim()} role="img" aria-label={`${rating} out of 5 stars`}>
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

function SupportDetailsModal({ item, feedback, onClose }: SupportDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const volunteer = item.volunteer;
  const statusTone = item.sessStatus === 'Cancelled' ? item.status.tone : 'completed';
  const statusLabel = item.sessStatus === 'Cancelled' ? item.status.label : 'Completed';

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
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
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="session-modal-close"
          aria-label="Close support details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <h2 id="support-modal-title" className="session-modal-title">
          {item.title}
        </h2>

        <div className="session-modal-tagrow">
          <CategoryTag className="session-modal-tag">{item.category}</CategoryTag>
          <span className="session-modal-topdate">
            <CalendarIcon /> {item.dateLabel}
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

        {volunteer && (
          <section className="session-modal-volunteer" aria-label="Matched volunteer and feedback">
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
            {feedback && (
              <div className="session-modal-feedback">
                <h3 className="session-modal-feedback-title">Submitted Feedback</h3>
                <div className="session-modal-feedback-content">
                  <Stars rating={feedback.rating} className="session-modal-feedback-stars" />
                  {feedback.comments && <p className="session-modal-feedback-comments">{feedback.comments}</p>}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="session-modal-footer">
          <span className={`ui-status-pill ui-status-pill--${statusTone}`}>
            {item.sessStatus === 'Cancelled' ? <CloseIcon /> : <CalendarIcon />} {statusLabel}
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SupportDetailsModal;
