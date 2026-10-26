import { CheckIcon } from '../icons';
import './toast.css';

interface ToastMessageProps {
  message: string;
}

function ToastMessage({ message }: ToastMessageProps) {
  if (!message) return null;

  return (
    <div className="toast-message" role="status" aria-live="polite">
      <CheckIcon className="toast-message-icon" />
      <span>{message}</span>
    </div>
  );
}

export default ToastMessage;
