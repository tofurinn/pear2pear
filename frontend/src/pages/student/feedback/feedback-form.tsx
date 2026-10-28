import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
//state objects: rating / hoverRating - chosen stars and the star under the cursor
//state object: comments - optional written feedback
//state object: isSubmitting / errorMessage - submission state
//state object: submitted - the saved Feedback; when set, the thank-you screen is shown
//state object: showConfirm - whether the "Submit feedback?" popup is open

import { Timestamp } from 'firebase/firestore';
import type { Feedback } from '../../../types/Feedback';

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { ChevronLeft, StarIcon } from '../../../components/icons.tsx';
import FeedbackThanks from './feedback-thanks.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';
import { createFeedback, getFeedbackBySession } from '../../../services/FeedbackService';
import { getSupportSession, getSessionsByRequestIDs, updateSessionStatus } from '../../../services/SessionService';
import { getSupportRequest, getRequestsByVolunteer } from '../../../services/RequestService';
import { getUser } from '../../../services/UserService';
import { updateVolunteer } from '../../../services/VolunteerService';
import { createNotification } from '../../../services/NotificationService';

import '../../../components/ui.css';
import '../../../components/page-css/feedback-form.css';

const MAX_RATING = 5;
const STAR_VALUES = Array.from({ length: MAX_RATING }, (_, i) => i + 1);
export const MAX_FEEDBACK_COMMENT_LENGTH = 255;

// ─── Component ─────────────────────────────────────────────────────────────────

function StudentFeedbackForm() {
  const { sessID = '' } = useParams<{ sessID: string }>(); // route e.g. /feedback/:sessID
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState<Feedback | null>(null);
  const [volunteer, setVolunteer] = useState<{
    name: string;
    UID: string;
    category: string;
    title: string;
  } | null>(null);

  const commentLength = comments.trim().length;
  const isCommentTooLong = commentLength > MAX_FEEDBACK_COMMENT_LENGTH;
  const shownRating = hoverRating || rating; // preview while hovering, otherwise the chosen rating

  useEffect(() => {
    let isCurrent = true;

    const loadFeedbackForm = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const session = sessID ? await getSupportSession(sessID) : null;
        if (!session || session.sessStatus !== 'Completed' || await getFeedbackBySession(sessID)) {
          if (isCurrent) {
            setLoadError('This session is not eligible for feedback or has already been rated.');
          }
          return;
        }

        const request = await getSupportRequest(session.reqID);
        if (!request) {
          if (isCurrent) setLoadError('Could not find the volunteer for this session.');
          return;
        }

        const user = await getUser(request.volUID);
        if (!user) {
          if (isCurrent) setLoadError('Could not find the volunteer for this session.');
          return;
        }

        if (isCurrent) {
          setVolunteer({
            name: user.name,
            UID: request.volUID,
            category: request.category,
            title: request.title,
          });
        }
      } catch (error) {
        console.error('Feedback form loading error:', error);
        if (isCurrent) setLoadError('Could not load this feedback form. Please try again.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadFeedbackForm();
    return () => {
      isCurrent = false;
    };
  }, [sessID]);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (rating < 1 || isCommentTooLong || !volunteer) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const fbID = await createFeedback({ sessID, rating, comments: comments.trim() });
      const feedback: Feedback = {
        fbID,
        sessID,
        rating,
        comments: comments.trim(),
        fbTimestamp: Timestamp.now(),
      };
      await updateSessionStatus(sessID, 'Rated');

      const requests = await getRequestsByVolunteer(volunteer.UID);
      const sessions = await getSessionsByRequestIDs(requests.map(request => request.reqID));
      const completedSessions = sessions.filter(session =>
        session.sessStatus === 'Completed' || session.sessStatus === 'Rated'
      );
      const feedbackRecords = await Promise.all(
        completedSessions.map(session => getFeedbackBySession(session.sessID))
      );
      const feedbackBySession = new Map(
        feedbackRecords.flatMap(feedback => feedback ? [[feedback.sessID, feedback] as const] : [])
      );
      feedbackBySession.set(sessID, feedback);
      const allFeedback = Array.from(feedbackBySession.values());
      const totalStars = allFeedback.reduce((total, feedback) => total + feedback.rating, 0);
      const totalReviews = allFeedback.length;
      const rawAverage = totalStars / totalReviews;
      const avgRating = Math.round(rawAverage * 10) / 10;

      await updateVolunteer(volunteer.UID, { avgRating, ratingCount: totalReviews });

      try {
        await createNotification({
          UID: volunteer.UID,
          kind: 'session',
          actorName: 'A student',
          message: 'left feedback for your support session.',
          category: volunteer.category,
          title: volunteer.title,
          redirectionLink: '/volunteer/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Feedback submitted, but its notification could not be created:', notificationError);
      }

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
              volunteerName={volunteer?.name ?? ''}
              onReturnToDashboard={() => navigate('/student/dashboard')}
            />
          ) : loadError ? (
            <>
              <h1 className="ui-card-title">Feedback Form</h1>
              <div className="ui-error feedback-eligibility-error" role="alert">
                <span className="feedback-eligibility-error-message">{loadError}</span>
              </div>
              <div className="ui-actions feedback-eligibility-actions">
                <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate(-1)}>
                  <ChevronLeft /> Go Back
                </button>
              </div>
            </>
          ) : isLoading || !volunteer ? (
            <p role="status">Loading feedback form…</p>
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
                    className={`ui-field-control feedback-textarea${isCommentTooLong ? ' ui-field-control--error' : ''}`}
                    value={comments}
                    aria-invalid={isCommentTooLong}
                    aria-describedby={isCommentTooLong ? 'comments-error' : undefined}
                    placeholder="Share what went well, or what could be better"
                    onChange={e => setComments(e.target.value)}
                  />
                  {isCommentTooLong && (
                    <p id="comments-error" className="ui-field-error" role="alert">
                      Please keep your comments under 255 characters ({commentLength}/255)
                    </p>
                  )}
                </div>
              </div>

              {errorMessage && <p className="ui-error" role="alert">{errorMessage}</p>}

              <div className="ui-actions ui-actions--end">
                <button
                  type="button"
                  className="ui-btn ui-btn-solid"
                  onClick={() => setShowConfirm(true)}
                  disabled={rating < 1 || isCommentTooLong || isSubmitting}
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