import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, CloseIcon, StarRating } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import type { StudentRequestItem } from '../../student-utils.tsx';

import '../../../../components/page-css/details.css';

interface RequestDetailsModalProps {
  item: StudentRequestItem;
  onClose: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function RequestDetailsModal({ item, onClose }: RequestDetailsModalProps) {
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
        aria-labelledby="request-modal-title"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="session-modal-close"
          aria-label="Close request details"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <h2 id="request-modal-title" className="session-modal-title">
          {item.title}
        </h2>

        <div className="session-modal-tagrow">
          <CategoryTag className="session-modal-tag">{item.category}</CategoryTag>
          <span className="session-modal-topdate">
            <CalendarIcon /> {item.dateLabel}
          </span>
        </div>

        <p className="session-modal-description">{item.description}</p>

        <section className="session-modal-volunteer" aria-label="Matched volunteer">
          <div className="session-modal-volunteer-head">
            <span className="session-modal-volunteer-name">{volunteer.name}</span>
            <StarRating rating={volunteer.rating} className="session-modal-stars" />
            <span className="session-modal-volunteer-rating">
              {volunteer.rating} ({volunteer.reviewCount})
            </span>
            <span className="session-modal-volunteer-status">{volunteer.requestStatusLabel}</span>
          </div>
          {volunteer.skills && volunteer.skills.length > 0 && (
            <p className="session-modal-skills">{volunteer.skills.join(' • ')}</p>
          )}
        </section>

        <footer className="session-modal-footer">
          <span className={`ui-status-pill ui-status-pill--${item.status.tone}`}>
            {item.status.tone === 'pending' ? <ClockIcon /> : item.status.tone === 'accepted' ? <CheckIcon /> : item.status.tone === 'scheduled' ? <CalendarIcon /> : item.status.tone === 'rejected' || item.status.tone === 'cancelled' ? <CloseIcon /> : <AlertIcon />} {item.status.label}
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default RequestDetailsModal;
