import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ClockIcon, CloseIcon, PinIcon, SwapIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { getVolunteerSessionStatus } from '../volunteer-utils.ts';
import { StatusPill } from '../volunteer-shared.tsx';
import type { VolunteerSessionItem } from '../volunteer-utils.ts';

import '../../../../components/page-css/details.css';

interface SessionDetailsProps {
  item: VolunteerSessionItem;
  onClose: () => void;
  onConfirm: () => void;
  onCancelSession: () => void;
  onMarkComplete: () => void;
  onRearrange: () => void;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SessionDetailsModal({
  item,
  onClose,
  onConfirm,
  onCancelSession,
  onMarkComplete,
  onRearrange,
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
  const status = getVolunteerSessionStatus(item);
  const isPlanned = item.sessStatus === 'Planned';
  const isConfirmed = item.sessStatus === 'Confirmed';
  const isElapsed = isConfirmed && status.label === 'Elapsed';
  const needsVolunteerConfirmation = isPlanned && item.studConfirmed && !item.volConfirmed;
  const canCancel = isPlanned || isConfirmed;
  const canRearrange = isPlanned || (isConfirmed && !isElapsed);
  const canMarkComplete = isElapsed;

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
          <StatusPill tone={status.tone} label={status.label} />
          {canCancel && (
            <button type="button" className="ui-chip-btn ui-chip-btn--danger session-modal-action" onClick={onCancelSession}>
              Cancel
            </button>
          )}
          {canRearrange && (
            <button type="button" className="ui-chip-btn ui-chip-btn--info session-modal-action" onClick={onRearrange}>
              Rearrange
            </button>
          )}
          {needsVolunteerConfirmation && (
            <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={onConfirm}>
              Confirm Arrangement
            </button>
          )}
          {canMarkComplete && (
            <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={onMarkComplete}>
              Mark Complete
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default SessionDetailsModal;
