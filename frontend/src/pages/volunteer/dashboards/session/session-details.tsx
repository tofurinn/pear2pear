import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, CloseIcon, PinIcon, SwapIcon } from '../../../../components/icons.tsx';
import CategoryTag from '../../../../components/category-tag/category-tag.tsx';
import { getVolunteerSessionStatus } from '../../volunteer-utils.ts';
import type { VolunteerSessionItem } from '../../volunteer-utils.ts';

import '../../../../components/page-css/details.css';

// ─── Modal ─────────────────────────────────────────────────────────────────────

interface SessionDetailsModalProps {
  item: VolunteerSessionItem;
  onClose: () => void;
  onMarkComplete?: (item: VolunteerSessionItem) => void;
  onCancelSession?: (item: VolunteerSessionItem) => void;
  onRearrange?: (item: VolunteerSessionItem) => void;
  onConfirmArrangement?: (item: VolunteerSessionItem) => void;
  footerActions?: ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function SessionDetailsModal({
  item,
  onClose,
  onMarkComplete,
  onCancelSession,
  onRearrange,
  onConfirmArrangement,
  footerActions,
}: SessionDetailsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { tone, label } = getVolunteerSessionStatus(item);
  const canMarkComplete = item.sessStatus === 'Confirmed' && label === 'Elapsed';
  const canChangeArrangement = item.sessStatus === 'Planned' || item.sessStatus === 'Confirmed';
  const needsVolunteerConfirmation =
    item.sessStatus === 'Planned' &&
    item.studConfirmed &&
    !item.volConfirmed &&
    label !== 'Elapsed';

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
          <span className="session-modal-topdate"><CalendarIcon /> {item.createdLabel}</span>
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

        <section className="session-modal-volunteer session-modal-requester" aria-label="Requesting student">
          <div className="session-modal-volunteer-head">
            <span className="session-modal-requested-by">Requested by <strong>{item.personName}</strong></span>
            {item.requesterStatus && <span className="session-modal-volunteer-status">{item.requesterStatus}</span>}
          </div>
        </section>
        
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
              {needsVolunteerConfirmation && onConfirmArrangement && (
                <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={() => onConfirmArrangement(item)}>
                  Confirm Arrangement
                </button>
              )}
            </div>
          )}
          {footerActions}
          {canMarkComplete && (
            <button type="button" className="ui-chip-btn ui-chip-btn--success session-modal-action" onClick={() => onMarkComplete?.(item)}>
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
