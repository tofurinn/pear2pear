import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, CloseIcon, StarRating } from '../../../../components/icons.tsx';
import { isPendingRequestActionAvailable, PENDING_REQUEST_ACTION_DELAY_MS } from '../../../../services/RequestService';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import type { StudentRequestItem } from '../../student-utils.tsx';

import '../../../../components/page-css/details.css';

interface RequestDetailsModalProps {
  item: StudentRequestItem;
  onClose: () => void;
  onSchedule: () => void;
  onCancelRequest: () => void;
  onResubmitRequest: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function RequestDetailsModal({
  item,
  onClose,
  onSchedule,
  onCancelRequest,
  onResubmitRequest,
}: RequestDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const volunteer = item.volunteer;
  const availableAt = item.reqTimestamp.toMillis() + PENDING_REQUEST_ACTION_DELAY_MS;
  const canChangePendingRequest = isPendingRequestActionAvailable(item.reqTimestamp, now);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(0, availableAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [availableAt]);

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
              {volunteer.rating}
            </span>
          </div>
          {volunteer.skills && volunteer.skills.length > 0 && (
            <p className="session-modal-skills">{volunteer.skills.join(' • ')}</p>
          )}
        </section>

        <footer className="session-modal-footer">
          <span className={`ui-status-pill ui-status-pill--${item.status.tone}`}>
            {item.status.tone === 'pending' ? <ClockIcon /> : item.status.tone === 'accepted' ? <CheckIcon /> : item.status.tone === 'scheduled' ? <CalendarIcon /> : item.status.tone === 'rejected' || item.status.tone === 'cancelled' ? <CloseIcon /> : <AlertIcon />} {item.status.label}
          </span>
          {item.reqStatus === 'Accepted' && (
            <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={onSchedule}>
              Schedule Session
            </button>
          )}
          {item.reqStatus === 'Pending' && canChangePendingRequest && (
            <>
              <button type="button" className="ui-chip-btn ui-chip-btn--danger session-modal-action" onClick={onCancelRequest}>
                Cancel Request
              </button>
              <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={onResubmitRequest}>
                Find Another Volunteer
              </button>
            </>
          )}
          {item.reqStatus === 'Pending' && !canChangePendingRequest && (
            <p className="session-modal-action-note">
              You can cancel this request or choose another volunteer after one week.
            </p>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default RequestDetailsModal;
