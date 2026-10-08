import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
//state object: currentStep - 2 or 3 (step 1, the request, is already fixed for an existing session)
//state object: formData - starts as the session's current arrangement
//state objects: showConfirm / isSaving / errorMessage - the save flow
//state object: summary - the saved arrangement, shown on the confirmation page

import Navbar from '../../../components/navbar/main-navbar.tsx';
import StepProgress from '../../../components/step-progress.tsx';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';
import TimeSlotStep from './steps/step2.tsx';
import MeetupDetailsStep from './steps/step3.tsx';
import SessionConfirmationStep from './steps/step4.tsx';
import {
  EMPTY_FORM,
  buildSummary,
  canEditSession,
  getSessionById,
  isStepValid,
  sessionToFormData,
} from './session-utils.tsx';
import type { SessionFormData, SessionSummary } from './session-utils.tsx';

import '../../../components/page-css/forms-ui.css';
import './session-form.css';

// Same numbering as the booking form, so the step headings ("Step 2: ...", "Step 3: ...") still match
const FIRST_STEP = 2;
const LAST_STEP = 3;
const totalSteps = 3;

// ─── Component ─────────────────────────────────────────────────────────────────

function SessionRearrangement() {
  const { sessID = '' } = useParams<{ sessID: string }>(); // route e.g. /sessions/:sessID/edit
  const navigate = useNavigate();
  const location = useLocation();
  const isVolunteerRoute = location.pathname.startsWith('/volunteer/');
  const dashboardPath = isVolunteerRoute ? '/volunteer/dashboard' : '/student/dashboard';
  const sessionsPath = isVolunteerRoute ? '/volunteer/sessions' : '/student/my-sessions';

  // TODO: load this session from Firestore, and check it belongs to the signed-in student
  const session = getSessionById(sessID);

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  // Starting from the current arrangement means the booked slot is already selected in step 2
  const [formData, setFormData] = useState<SessionFormData>(() =>
    session ? sessionToFormData(session) : EMPTY_FORM
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const isLastStep = currentStep === LAST_STEP;
  const canGoNext = isStepValid(isLastStep ? 'meetup' : 'timeSlot', formData) && !isSaving;

  const updateFormData = (data: Partial<SessionFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      // TODO: UPDATE the existing Support_Session document in Firestore (don't create a new one):
      //   sessDate        -> parseDateKey(formData.sessDate)
      //   sessTimeSlot    -> Timestamp for formData.sessDate + formData.sessTimeSlot
      //   supportMode / meetingLocation -> from formData
      //   sessStatus      -> 'Planned', studConfirmed: true, volConfirmed: false (the volunteer has to agree again)
      //   then notify the volunteer

      const rearranged = buildSummary(formData);
      if (!rearranged) throw new Error('Could not find the selected request');

      setSummary(rearranged); // switches the page to the confirmation screen
    } catch (error) {
      console.error('Session update error:', error);
      setErrorMessage('Could not save your changes. Please try again.');
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Saved ───────────────────────────────────────────────────────────────────

  if (summary) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={dashboardPath} />
        <main className="ui-page-session-background">
          <section className="ui-card ui-card--centered">
            <SessionConfirmationStep
              summary={summary}
              title="Your Support Session Has Been Rearranged!"
              message="Sit tight, you will receive a notification once your matched Volunteer confirms the new arrangement"
              onReturnToDashboard={() => navigate(dashboardPath)}
              onViewSession={() => navigate(sessionsPath)}
            />
          </section>
        </main>
      </div>
    );
  }

  // ─── Not allowed / not found ─────────────────────────────────────────────────

  if (!session || !canEditSession(session)) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={dashboardPath} />
        <main className="ui-page-session-background">
          <section className="ui-card">
            <h1 className="ui-card-title">Rearrange Session</h1>
            <hr className="ui-card-divider" />
            <div className="ui-error" role="alert">
              <p>
                {!session
                  ? 'We couldn’t find this session.'
                  : 'Only Planned or Confirmed sessions that haven’t started yet can be changed.'}
              </p>
              <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate(-1)}>
                <ChevronLeft /> Go Back
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="ui-page">
      <Navbar dashboardPath={dashboardPath} />
      <main className="ui-page-session-background">
        <section className="ui-card">
          <h1 className="ui-card-title">Rearrange Session</h1>
          <hr className="ui-card-divider" />

          <StepProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            label="Session booking progress"
            tone="green"
          />

          {isLastStep ? (
            <MeetupDetailsStep
              formData={{ supportMode: formData.supportMode, meetingLocation: formData.meetingLocation }}
              updateFormData={updateFormData}
            />
          ) : (
            <TimeSlotStep
              formData={{ reqID: formData.reqID, sessDate: formData.sessDate, sessTimeSlot: formData.sessTimeSlot }}
              updateFormData={updateFormData}
            />
          )}

          {errorMessage && <p className="ui-error" role="alert">{errorMessage}</p>}

          <div className="ui-actions">
            {isLastStep ? (
              <button type="button" className="ui-btn ui-btn-outline" onClick={() => setCurrentStep(FIRST_STEP)}>
                <ChevronLeft /> Previous Page
              </button>
            ) : (
              <button type="button" className="ui-btn ui-btn-outline" onClick={() => navigate(-1)}>
                <ChevronLeft /> Cancel
              </button>
            )}

            {isLastStep ? (
              <button type="button" className="ui-btn ui-btn-solid" onClick={() => setShowConfirm(true)} disabled={!canGoNext}>
                Save Changes
              </button>
            ) : (
              <button type="button" className="ui-btn ui-btn-outline" onClick={() => setCurrentStep(LAST_STEP)} disabled={!canGoNext}>
                Next Page <ChevronRight />
              </button>
            )}
          </div>
        </section>
      </main>

      <ConfirmPopup
        open={showConfirm}
        title="Save these changes?"
        message="Your volunteer will need to confirm the new arrangement again."
        confirmLabel="Save Changes"
        busy={isSaving}
        busyLabel="Saving…"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default SessionRearrangement;