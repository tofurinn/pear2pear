import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
//state object: currentStep - 2 or 3 (step 1, the request, is already fixed for an existing session)
//state object: formData - starts as the session's current arrangement
//state objects: showConfirm / isSaving / errorMessage - the save flow
//state object: summary - the saved arrangement, shown on the confirmation page

import Navbar from '../../../components/navbar/main-navbar.tsx';
import StepProgress from '../../../components/step-progress.tsx';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';
import { useAuth } from '../../../context/authContext';
import { getRequestsByVolunteer } from '../../../services/RequestService';
import { getSessionsByRequestIDs, getSupportSession, updateSupportSession } from '../../../services/SessionService';
import { getAvailabilityByVolunteer } from '../../../services/AvailabilityService';
import { getUser } from '../../../services/UserService';
import { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';
import TimeSlotStep from './steps/step2.tsx';
import MeetupDetailsStep from './steps/step3.tsx';
import SessionConfirmationStep from './steps/step4.tsx';
import {
  EMPTY_FORM,
  canEditSession,
  isSessionSlotBookable,
  isStepValid,
  sessionToFormData,
  toWeeklyAvailability,
} from './session-utils.tsx';
import type { SessionFormData, SessionSummary, Student } from './session-utils.tsx';
import { formatLongDate, formatTimeslotRange, parseDateKey, slotToHour } from '../volunteer-utils.ts';

import '../../../components/ui.css';
import './../../../components/page-css/session-form.css';

// Same numbering as the booking form, so the step headings ("Step 2: ...", "Step 3: ...") still match
const FIRST_STEP = 2;
const LAST_STEP = 3;
const totalSteps = 3;

// ─── Component ─────────────────────────────────────────────────────────────────

function VolunteerSessionRearrangement() {
  const { sessID = '' } = useParams<{ sessID: string }>(); // route e.g. /sessions/:sessID/edit
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();

  const [session, setSession] = useState<Support_Session | null>(null);
  const [request, setRequest] = useState<Support_Request | null>(null);
  const [sessionStudent, setSessionStudent] = useState<Student | null>(null);
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState('');

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_FORM);
  const [availability, setAvailability] = useState<Record<number, number[]>>({});
  const [bookedSessions, setBookedSessions] = useState<Support_Session[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const isLoadingSession = authLoading || (!!userDoc?.UID && !!sessID && loadedSessionKey !== `${userDoc.UID}:${sessID}`);

  useEffect(() => {
    if (authLoading) return;
    if (!userDoc?.UID || !sessID) return;

    let isCurrent = true;

    const loadSession = async () => {
      try {
        const [loadedSession, ownedRequests] = await Promise.all([
          getSupportSession(sessID),
          getRequestsByVolunteer(userDoc.UID)
        ]);

        const ownedRequest = loadedSession
          ? ownedRequests.find(candidate => candidate.reqID === loadedSession.reqID) ?? null
          : null;

        if (!loadedSession || !ownedRequest) {
          if (isCurrent) setSessionLoadError('We couldn’t find this session.');
          return;
        }

        const [studentUser, availabilityRecords, volunteerRequests] = await Promise.all([
          getUser(ownedRequest.studUID),
          getAvailabilityByVolunteer(ownedRequest.volUID),
          getRequestsByVolunteer(ownedRequest.volUID),
        ]);
        const bookedSessions = await getSessionsByRequestIDs(volunteerRequests.map(candidate => candidate.reqID));

        const mappedStudent: Student = {
          studUID: ownedRequest.studUID,
          name: studentUser?.name ?? 'Student',
        };

        if (isCurrent) {
          setSessionLoadError('');
          setSession(loadedSession);
          setRequest(ownedRequest);
          setSessionStudent(mappedStudent);
          setAvailability(toWeeklyAvailability(availabilityRecords));
          setBookedSessions(bookedSessions);
          setFormData(sessionToFormData(loadedSession));
        }
      } catch (error) {
        console.error('Error loading session for rearrangement:', error);
        if (isCurrent) setSessionLoadError('Could not load this session. Please try again.');
      } finally {
        if (isCurrent) setLoadedSessionKey(`${userDoc.UID}:${sessID}`);
      }
    };

    void loadSession();
    return () => {
      isCurrent = false;
    };
  }, [authLoading, sessID, userDoc?.UID]);

  const isLastStep = currentStep === LAST_STEP;
  const isTimeSlotValid = isSessionSlotBookable(
    formData.sessDate,
    formData.sessTimeSlot,
    availability,
    bookedSessions,
    session?.sessID,
  );
  const canGoNext = (isLastStep ? isStepValid('meetup', formData) : isTimeSlotValid) && !isSaving;

  const updateFormData = (data: Partial<SessionFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (!session || !request || !sessionStudent) throw new Error('Could not load the session details');
      if (!isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, availability, bookedSessions, session.sessID)) {
        throw new Error('Choose an available future time slot.');
      }

      const sessDate = parseDateKey(formData.sessDate);
      const hour = slotToHour(formData.sessTimeSlot);
      const sessTimeSlot = new Date(sessDate);
      sessTimeSlot.setHours(hour, 0, 0, 0);
      if (sessTimeSlot <= new Date()) throw new Error('Choose a future time slot.');

      await updateSupportSession(sessID, {
        sessDate,
        sessTimeSlot: Timestamp.fromDate(sessTimeSlot),
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        sessStatus: 'Planned',
        studConfirmed: false, // the volunteer made the change, so the student has to confirm again
        volConfirmed: true,
      });

      const rearranged: SessionSummary = {
        category: request.category,
        title: request.title,
        dateLabel: formatLongDate(sessDate),
        timeslotLabel: formatTimeslotRange(hour),
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        student: sessionStudent,
      };

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
        <Navbar dashboardPath={"/volunteer/dashboard"} />
        <main className={"ui-page-volunteer-background"}>
          <section className="ui-card ui-card--centered">
            <SessionConfirmationStep
              summary={summary}
              title="Your Support Session Has Been Rearranged!"
              message="Sit tight, you will receive a notification once your matched Student confirms the new arrangement"
              onReturnToDashboard={() => navigate("/volunteer/dashboard")}
              onViewSession={() => navigate("/volunteer/my-sessions")}
            />
          </section>
        </main>
      </div>
    );
  }

  if (isLoadingSession) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={"/volunteer/dashboard"} />
        <main className={"ui-page-volunteer-background"}>
          <section className="ui-card">
            <p className="ui-card-heading" role="status">Loading session...</p>
          </section>
        </main>
      </div>
    );
  }

  // ─── Not allowed / not found ─────────────────────────────────────────────────

  if (!session || !canEditSession(session)) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={"/volunteer/dashboard"} />
        <main className={"ui-page-volunteer-background"}>
          <section className="ui-card">
            <h1 className="ui-card-title">Rearrange Session</h1>
            <hr className="ui-card-divider" />
            <div className="ui-error" role="alert">
              <p>
                {sessionLoadError || (!session
                  ? userDoc?.UID ? 'We couldn’t find this session.' : 'Sign in to rearrange this session.'
                  : 'Only Planned or Confirmed sessions can be rearranged.')}
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
      <Navbar dashboardPath={"/volunteer/dashboard"} />
      <main className={"ui-page-volunteer-background"}>
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
              availability={availability}
              sessions={bookedSessions}
              isLoading={isLoadingSession}
              excludedSessionID={session.sessID}
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
        message="Your student will need to confirm the new arrangement again."
        confirmLabel="Save Changes"
        busy={isSaving}
        busyLabel="Saving…"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default VolunteerSessionRearrangement;