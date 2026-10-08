import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ClockIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { StatusPill } from '../volunteer-shared.tsx';
import type { VolunteerSessionItem } from '../volunteer-utils.ts';

import '../../../../components/page-css/details.css';

interface SessionDetailsProps {
  item: VolunteerSessionItem;
  onClose: () => void;
  onConfirm: () => void;
  onCancelSession: () => void;
  onMarkComplete: () => void;
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

function SessionDetailsModal({
  item,
  onClose,
  onConfirm,
  onCancelSession,
  onMarkComplete,
}: SessionDetailsProps) {
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
  const canConfirm = item.awaitingMyConfirmation;
  const canMarkComplete = item.sessStatus === 'Confirmed' && item.canMarkComplete;
  const canCancel = item.sessStatus === 'Confirmed' && !item.canMarkComplete;

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
        aria-labelledby="volunteer-session-modal-title"
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

        <h2 id="volunteer-session-modal-title" className="session-modal-title">{item.title}</h2>

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
        </section>

        <footer className="session-modal-footer">
          <StatusPill tone={item.status.tone} label={item.status.label} />
          {canConfirm && (
            <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={onConfirm}>
              Confirm Session
            </button>
          )}
          {canMarkComplete && (
            <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={onMarkComplete}>
              Mark Completion
            </button>
          )}
          {canCancel && (
            <button type="button" className="ui-chip-btn ui-chip-btn--danger session-modal-action" onClick={onCancelSession}>
              Cancel Session
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SessionDetailsModal;
