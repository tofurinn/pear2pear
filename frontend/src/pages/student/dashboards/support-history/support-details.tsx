import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ClockIcon, CloseIcon, HistoryUpdateIcon, PinIcon, RatedIcon, StarRating, SwapIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { StatusPill } from '../../../../components/dashboard-components.tsx';
import type { StudentSessionItem } from '../../student-utils.tsx';

import '../../../../components/page-css/details.css';

interface SupportFeedback {
  rating: number;
  comments: string;
}

interface SupportDetailsModalProps {
  item: StudentSessionItem;
  feedback?: SupportFeedback;
  onClose: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SupportDetailsModal({ item, feedback, onClose }: SupportDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const volunteer = item.volunteer;

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
            <HistoryUpdateIcon /> {item.createdLabel}
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
              <StarRating rating={volunteer.rating} className="session-modal-stars" />
              <span className="session-modal-volunteer-rating rating-text">
                {volunteer.rating.toFixed(1)} ({volunteer.ratingCount})
              </span>
            </div>
            {volunteer.skills && volunteer.skills.length > 0 && (
              <p className="session-modal-skills">{volunteer.skills.join(' • ')}</p>
            )}
            {feedback && (
              <div className="session-modal-feedback">
                <h3 className="session-modal-feedback-title">Submitted Feedback</h3>
                <div className="session-modal-feedback-content">
                  <StarRating rating={feedback.rating} className="session-modal-feedback-stars" />
                  {feedback.comments && <p className="session-modal-feedback-comments">{feedback.comments}</p>}
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="session-modal-footer">
          <StatusPill
            tone={item.status.tone}
            label={item.status.label}
            icon={item.sessStatus === 'Cancelled' ? <CloseIcon /> : <RatedIcon />}
          />
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SupportDetailsModal;
