import React from 'react';
import type { Timestamp } from 'firebase/firestore';
import type { Feedback } from '../../../types/Feedback';
import { CalendarIcon, StarIcon } from '../../../components/icons.tsx';
import volunteerPfp from '../../../assets/images/volunteerpfp-cropped.png';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FeedbackThanksProps {
    feedback: Feedback;
    volunteerName: string;
    avatarUrl?: string;
    onReturnToDashboard: () => void;
}

const formatDate = (ts: Timestamp) =>
    ts.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
import pearHeartIcon from '../../../assets/images/pearheart.png';

const HeartPearIcon: React.FC<{ className?: string }> = ({ className }) => (
    <img src={pearHeartIcon} alt="" className={className} />
);

// ─── Component ─────────────────────────────────────────────────────────────────

function FeedbackThanks({ feedback, volunteerName, onReturnToDashboard }: FeedbackThanksProps) {
    return (
        <div className="feedback-thanks">
            <HeartPearIcon className="feedback-thanks-icon" />
            <h1 className="feedback-thanks-title">Thanks for helping our community grow!</h1>
            <p className="feedback-thanks-message">
                Your feedback helps our volunteers learn and makes future peer sessions even better for everyone
            </p>

            <div className="feedback-summary">
                <div className="feedback-volunteer">
                    <img className="feedback-avatar" src={volunteerPfp} alt={volunteerName} />
                    <span className="feedback-volunteer-name">{volunteerName}</span>
                </div>

                <div className="feedback-review">
                    <div className="feedback-review-top">
                        <div className="feedback-stars" role="img" aria-label={`${feedback.rating} out of 5 stars`}>
                            {Array.from({ length: feedback.rating }, (_, i) => (
                                <StarIcon key={i} filled outlined={false} />
                            ))}
                        </div>
                        <span className="feedback-date">
                            <CalendarIcon /> {formatDate(feedback.fbTimestamp)}
                        </span>
                    </div>
                    {feedback.comments && <p className="feedback-comment">{feedback.comments}</p>}
                </div>
            </div>

            <button type="button" className="ui-btn ui-btn-solid" onClick={onReturnToDashboard}>
                Return to Dashboard
            </button>
        </div>
    );
}

export default FeedbackThanks;