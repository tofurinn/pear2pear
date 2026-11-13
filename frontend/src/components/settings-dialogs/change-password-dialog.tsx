import React, { useRef, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import "../page-css/settings.css";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync the native <dialog> element with the `open` prop
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Reset state whenever the dialog opens fresh
  React.useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError("");
      setIsSaving(false);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validate = (): string | null => {
    if (!form.currentPassword) return "Enter your current password.";
    if (!form.newPassword) return "Enter a new password.";
    if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (form.newPassword === form.currentPassword) {
      return "New password must be different from your current password.";
    }
    if (form.newPassword !== form.confirmPassword) {
      return "New passwords do not match.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("You must be signed in to change your password.");
      return;
    }

    setIsSaving(true);
    try {
      // Step 1 — Re-authenticate with the current password.
      // Firebase requires a recent login before allowing sensitive operations
      // like password changes. Without this, updatePassword throws
      // auth/requires-recent-login for older accounts.
      const credential = EmailAuthProvider.credential(
        user.email,
        form.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Step 2 — Update to the new password.
      await updatePassword(user, form.newPassword);

      onSuccess();
      onClose();
    } catch (err: any) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/weak-password") {
        setError("New password is too weak. Try a longer one.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        console.error("Password change failed:", err);
        setError("Couldn't update your password. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="settings-dialog"
      aria-labelledby="change-password-title"
      onClose={onClose}
    >
      <h2 id="change-password-title" className="settings-dialog__title">
        Change Password
      </h2>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div className="register-field">
          <label htmlFor="currentPassword" className="register-field__label">
            Current Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="register-field__input"
            value={form.currentPassword}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={isSaving}
          />
        </div>

        <div className="register-field">
          <label htmlFor="newPassword" className="register-field__label">
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="register-field__input"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isSaving}
          />
        </div>

        <div className="register-field">
          <label htmlFor="confirmPassword" className="register-field__label">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="register-field__input"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isSaving}
          />
        </div>

        <p
          className="register-field__error"
          role={error ? "alert" : undefined}
          style={{ minHeight: "1.5rem", textAlign: "center" }}
        >
          {error}
        </p>

        <div className="settings-dialog__actions">
          <button
            type="button"
            className="ui-btn ui-btn-outline settings-dialog-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="ui-btn ui-btn-solid" disabled={isSaving}>
            {isSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </dialog>
  );
}