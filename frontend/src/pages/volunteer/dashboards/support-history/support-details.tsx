import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ClockIcon, CloseIcon, PinIcon, SwapIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { StatusPill } from '../../../../components/dashboard-components.tsx';
import type { VolunteerSessionItem } from '../../volunteer-utils.ts';

import '../../../../components/page-css/details.css';

interface SupportDetailsProps {
  item: VolunteerSessionItem;
  onClose: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="session-modal-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(index => {
        const fill = Math.max(0, Math.min(1, rating - index)) * 100;
        return (
          <span
            key={index}
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

function SupportDetailsModal({ item, onClose }: SupportDetailsProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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

  const dateLabel = item.dateLabel;

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
        aria-labelledby="volunteer-history-modal-title"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="session-modal-close"
          aria-label="Close support history details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <h2 id="volunteer-history-modal-title" className="session-modal-title">{item.title}</h2>

        <div className="session-modal-tagrow">
          <CategoryTag className="session-modal-tag">{item.category}</CategoryTag>
          <span className="session-modal-topdate"><CalendarIcon /> {dateLabel}</span>
        </div>

        <dl className="session-modal-info">
          <div className="session-modal-info-row">
            <dt><CalendarIcon /> Session Date</dt>
            <dd>{dateLabel}</dd>
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

        <section className="session-modal-volunteer session-modal-requester" aria-label="Requesting student">
          <div className="session-modal-volunteer-head">
            <span className="session-modal-requested-by">Requested by <strong>{item.personName}</strong></span>
            {item.requesterStatus && <span className="session-modal-volunteer-status">{item.requesterStatus}</span>}
          </div>
          {item.studentFeedback && (
            <div className="session-modal-feedback">
              <h3 className="session-modal-feedback-title">Submitted Feedback</h3>
              <div className="session-modal-feedback-content">
                <Stars rating={item.studentFeedback.rating} />
                {item.studentFeedback.comments && (
                  <p className="session-modal-feedback-comments">{item.studentFeedback.comments}</p>
                )}
              </div>
            </div>
          )}
        </section>

        <footer className="session-modal-footer">
          <StatusPill tone={item.status.tone} label={item.status.label} />
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SupportDetailsModal;
