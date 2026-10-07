import { useEffect } from 'react';
import type { ReactNode } from 'react';

import './popup.css';

// Reusable "are you sure?" popup. Render it inside the page's .ui-page wrapper (no portal)
// so it picks up the sizing tokens, and import forms-ui.css for the .ui-btn buttons.
interface ConfirmPopupProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;          // true while the confirmed action is running: disables everything
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmPopup({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  busyLabel = 'Please wait…',
  onConfirm,
  onCancel,
}: ConfirmPopupProps) {
  // Escape closes the popup
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="popup-backdrop" onClick={() => !busy && onCancel()}>
      <div
        className="popup-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        aria-describedby="popup-message"
        onClick={e => e.stopPropagation()}   // clicks inside the card shouldn't close it
      >
        <h2 className="popup-title" id="popup-title">{title}</h2>
        <p className="popup-message" id="popup-message">{message}</p>

        <div className="popup-actions">
          <button type="button" className="ui-btn ui-btn-outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="ui-btn ui-btn-solid" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmPopup;