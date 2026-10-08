import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { CalendarIcon, CloseIcon } from '../../../../components/icons.tsx';
import type { VolunteerRequestItem } from '../volunteer-utils.ts';

import '../../../../components/page-css/details.css';

interface RequestDetailsModalProps {
  item: VolunteerRequestItem;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onSchedule: () => void;
  onViewSession: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function RequestDetailsModal({ item, onClose, onAccept, onReject, onSchedule, onViewSession }: RequestDetailsModalProps) {
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
        aria-labelledby="volunteer-request-modal-title"
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

        <h2 id="volunteer-request-modal-title" className="session-modal-title">{item.title}</h2>
        <div className="session-modal-tagrow">
          <CategoryTag className="session-modal-tag">{item.category}</CategoryTag>
          <span className="session-modal-topdate"><CalendarIcon /> {item.dateLabel}</span>
        </div>
        <p className="session-modal-description">{item.description}</p>
        <section className="session-modal-volunteer session-modal-requester" aria-label="Requesting student">
          <div className="session-modal-volunteer-head">
            <span className="session-modal-requested-by">Requested by <strong>{item.personName}</strong></span>
            {item.reqStatus !== 'Pending' && (
              <span className="session-modal-volunteer-status">{item.status.label}</span>
            )}
          </div>
        </section>
        <footer className="session-modal-footer">
          {item.reqStatus === 'Pending' && (
            <div className="vol-modal-actions">
              <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={onAccept}>Accept</button>
              <button type="button" className="ui-chip-btn ui-chip-btn--danger session-modal-action" onClick={onReject}>Reject</button>
            </div>
          )}
          {item.reqStatus === 'Accepted' && (
            <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={onSchedule}>Schedule Session</button>
          )}
          {item.reqStatus === 'Scheduled' && (
            <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={onViewSession}>View Session</button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default RequestDetailsModal;
