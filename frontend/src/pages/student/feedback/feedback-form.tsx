import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
//state objects: rating / hoverRating - chosen stars and the star under the cursor
//state object: comments - optional written feedback
//state object: isSubmitting / errorMessage - submission state
//state object: submitted - the saved Feedback; when set, the thank-you screen is shown
//state object: showConfirm - whether the "Submit feedback?" popup is open

import { Timestamp } from 'firebase/firestore';
import type { Feedback } from '../../../types/Feedback';

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { StarIcon } from '../../../components/icons.tsx';
import FeedbackThanks from './feedback-thanks.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';

import '../../../components/ui.css';
import '../../../components/page-css/feedback-form.css';

const MAX_RATING = 5;
const STAR_VALUES = Array.from({ length: MAX_RATING }, (_, i) => i + 1);

// TODO: look the volunteer up from sessID -> Support_Session.reqID -> Support_Request.volUID
const MOCK_VOLUNTEER: { name: string; avatarUrl?: string } = { name: 'Chiikawa' };

// ─── Component ─────────────────────────────────────────────────────────────────

function StudentFeedbackForm() {
  const { sessID = '' } = useParams<{ sessID: string }>(); // route e.g. /feedback/:sessID
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState<Feedback | null>(null);

  const volunteer = MOCK_VOLUNTEER;
  const shownRating = hoverRating || rating; // preview while hovering, otherwise the chosen rating

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (rating < 1) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // TODO: save to Firestore and use the new document's id as fbID
      const feedback: Feedback = {
        fbID: 'TODO',
        sessID,
        rating,
        comments: comments.trim(),
        fbTimestamp: Timestamp.now(),
      };

      setSubmitted(feedback);
    } catch (error) {
      console.error('Feedback submission error:', error);
      setErrorMessage('Could not submit your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false); // close the popup whether it worked or not, so it never covers the next screen
    }
  };

  return (
    <div className="ui-page">
      <Navbar />
      <main className="ui-page-student-background">
        <section className={`ui-card ${submitted ? 'ui-card--centered' : ''}`}>
          {submitted ? (
            <FeedbackThanks
              feedback={submitted}
              volunteerName={volunteer.name}
              avatarUrl={volunteer.avatarUrl}
              onReturnToDashboard={() => navigate('/student/dashboard')}
            />
          ) : (
            <>
              <h1 className="ui-card-title">Feedback Form</h1>
              <hr className="ui-card-divider" />
              <h2 className="ui-card-heading">
                How was your experience with <span className="ui-accent">{volunteer.name}</span>?
              </h2>

              <div className="ui-card-body feedback-fields">
                <div className="feedback-group">
                  <p className="feedback-label" id="rating-label">Give them a rating!</p>
                  <div
                    className="rating-stars"
                    role="radiogroup"
                    aria-labelledby="rating-label"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {STAR_VALUES.map(value => (
                      <label key={value} className="rating-star" onMouseEnter={() => setHoverRating(value)}>
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          checked={rating === value}
                          onChange={() => setRating(value)}
                          className="ui-visually-hidden"
                        />
                        <StarIcon filled={value <= shownRating} className="rating-star-icon" />
                        <span className="ui-visually-hidden">{value} {value === 1 ? 'star' : 'stars'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="feedback-group">
                  <label className="feedback-label" htmlFor="comments">Tell us more! (Optional)</label>
                  <textarea
                    id="comments"
                    className="ui-field-control feedback-textarea"
                    value={comments}
                    placeholder="Share what went well, or what could be better"
                    onChange={e => setComments(e.target.value)}
                  />
                </div>
              </div>

              {errorMessage && <p className="ui-error" role="alert">{errorMessage}</p>}

              <div className="ui-actions ui-actions--end">
                <button
                  type="button"
                  className="ui-btn ui-btn-solid"
                  onClick={() => setShowConfirm(true)}
                  disabled={rating < 1 || isSubmitting}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <ConfirmPopup
        open={showConfirm}
        title="Submit feedback?"
        message="Are you sure you want to submit this feedback?"
        confirmLabel="Submit Feedback"
        busy={isSubmitting}
        busyLabel="Arranging…"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />

    </div>
  );
}

export default StudentFeedbackForm;