import React, { useEffect, useRef, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { updateUser, getUserByEmail } from "../../services/UserService";
import { useAuth } from "../../context/authContext";
import "../page-css/settings.css";

interface ChangeEmailDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@helplive\.edu\.my$/;

export default function ChangeEmailDialog({
  open,
  onClose,
}: ChangeEmailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { userDoc, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewEmail("");
      setError("");
      setSuccess("");
      setIsSaving(false);
    }
  }, [open]);

  const handleClose = async () => {
    if (success) {
      await auth.signOut();
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedNewEmail = newEmail.trim().toLowerCase();

    // Validation
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (!trimmedNewEmail) {
      setError("Enter your new email address.");
      return;
    }
    //if (!EMAIL_PATTERN.test(trimmedNewEmail)) {
    //  setError("Please use a valid @helplive.edu.my email address.");
    //  return;
    //}
    if (userDoc?.email && trimmedNewEmail === userDoc.email.toLowerCase()) {
      setError("New email must be different from your current one.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("You must be signed in to change your email.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Check if the new email is already registered by someone else
      const emailInUse = await getUserByEmail(trimmedNewEmail);
      if (emailInUse && emailInUse.UID !== userDoc?.UID) {
        setError("That email is already registered to another account.");
        setIsSaving(false);
        return;
      }

      // 2. Re-authenticate with the current password.
      // Firebase requires a recent login before changing email addresses.
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await verifyBeforeUpdateEmail(user, trimmedNewEmail);
      setSuccess("Verification link sent to your new email! Click it to confirm, then log in with your new email.");

      // 4. Update the Firestore document.
      if (userDoc?.UID) {
        await updateUser(userDoc.UID, { email: trimmedNewEmail });
        await refreshUser();
      }

      setSuccess(
        "Verification link sent to your new email. Click the link to confirm, then log in again with your new address."
      );
      // Don't close the dialog — let the user read the message and click Close
    } catch (err: any) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Current password is incorrect.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("That email is already in use.");
      } else if (err.code === "auth/invalid-email") {
        setError("Enter a valid email address.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please log out and log back in to change your email.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("Email change is not allowed for this account.");
      } else {
        console.error("Email change failed:", err);
        setError("Couldn't update your email. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="settings-dialog"
      aria-labelledby="change-email-title"
      onClose={onClose}
    >
      <h2 id="change-email-title" className="settings-dialog__title">
        Change Email
      </h2>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div className="register-field">
          <label htmlFor="newEmail" className="register-field__label">
            New Email
          </label>
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            className="register-field__input"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="b2401411@helplive.edu.my"
            autoComplete="email"
            disabled={isSaving}
          />
        </div>

        <div className="register-field">
          <label htmlFor="currentPasswordEmail" className="register-field__label">
            Current Password
          </label>
          <input
            id="currentPasswordEmail"
            name="currentPassword"
            type="password"
            className="register-field__input"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (error) setError("");
            }}
            autoComplete="current-password"
            disabled={isSaving}
          />
        </div>

        <p
          className={`register-field__error ${success ? "settings-message" : ""}`}
          role={error ? "alert" : success ? "status" : undefined}
          style={{ minHeight: "1.5rem", textAlign: "center" }}
        >
          {error || success}
        </p>

        <div className="settings-dialog__actions">
          <button
            type="button"
            className="ui-btn ui-btn-outline settings-dialog-btn"
            onClick={handleClose}
            disabled={isSaving}
          >
            {success ? "Close" : "Cancel"}
          </button>
          <button type="submit" className="ui-btn ui-btn-solid" disabled={isSaving || !!success}>
            {isSaving ? "Sending..." : "Send Verification Link"}
          </button>
        </div>
      </form>
    </dialog>
  );
}