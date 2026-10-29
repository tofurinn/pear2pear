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
import { getRequestsByStudent } from '../../../services/RequestService';
import { getRequestsByVolunteer } from '../../../services/RequestService';
import { getSessionsByRequestIDs, getSupportSession, updateSupportSession } from '../../../services/SessionService';
import { createNotification } from '../../../services/NotificationService';
import { getAvailabilityByVolunteer } from '../../../services/AvailabilityService';
import { getVolunteer } from '../../../services/VolunteerService';
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
import type { SessionFormData, SessionSummary, Volunteer as SessionVolunteer } from './session-utils.tsx';
import { formatLongDate, formatTimeslotRange, parseDateKey, slotToHour } from '../student-utils.tsx';

import '../../../components/ui.css';
import './../../../components/page-css/session-form.css';

// Same numbering as the booking form, so the step headings ("Step 2: ...", "Step 3: ...") still match
const FIRST_STEP = 2;
const LAST_STEP = 3;
const totalSteps = 3;

// ─── Component ─────────────────────────────────────────────────────────────────

function StudentSessionRearrangement() {
  const { sessID = '' } = useParams<{ sessID: string }>(); // route e.g. /sessions/:sessID/edit
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();

  const [session, setSession] = useState<Support_Session | null>(null);
  const [request, setRequest] = useState<Support_Request | null>(null);
  const [sessionVolunteer, setSessionVolunteer] = useState<SessionVolunteer | null>(null);
  const [loadedSessionKey, setLoadedSessionKey] = useState<string | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState('');

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_FORM);
  const [availability, setAvailability] = useState<Record<number, number[]>>({});
  const [bookedSessions, setBookedSessions] = useState<Support_Session[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSlotUnavailablePopup, setShowSlotUnavailablePopup] = useState(false);
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
          getRequestsByStudent(userDoc.UID),
        ]);

        const ownedRequest = loadedSession
          ? ownedRequests.find(candidate => candidate.reqID === loadedSession.reqID) ?? null
          : null;

        if (!loadedSession || !ownedRequest) {
          if (isCurrent) setSessionLoadError('We couldn’t find this session.');
          return;
        }

        const [volunteer, volunteerUser, availabilityRecords, volunteerRequests] = await Promise.all([
          getVolunteer(ownedRequest.volUID),
          getUser(ownedRequest.volUID),
          getAvailabilityByVolunteer(ownedRequest.volUID),
          getRequestsByVolunteer(ownedRequest.volUID),
        ]);
        const bookedSessions = await getSessionsByRequestIDs(volunteerRequests.map(candidate => candidate.reqID));

        const mappedVolunteer: SessionVolunteer = {
          volUID: ownedRequest.volUID,
          name: volunteerUser?.name ?? 'Volunteer',
          rating: volunteer?.avgRating ?? 0,
          ratingCount: volunteer?.ratingCount ?? 0,
          tags: volunteer?.skills ?? [],
        };

        if (isCurrent) {
          setSessionLoadError('');
          setSession(loadedSession);
          setRequest(ownedRequest);
          setSessionVolunteer(mappedVolunteer);
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
      if (!session || !request || !sessionVolunteer) throw new Error('Could not load the session details');
      if (!formData.sessDate || !formData.sessTimeSlot) throw new Error('SLOT_UNAVAILABLE');

      const sessDate = parseDateKey(formData.sessDate);
      const hour = slotToHour(formData.sessTimeSlot);
      const sessTimeSlot = new Date(sessDate);
      sessTimeSlot.setHours(hour, 0, 0, 0);
      const sessionTimestamp = Timestamp.fromDate(sessTimeSlot);
      if (sessionTimestamp.toMillis() <= Date.now()) throw new Error('SLOT_PASSED');

      const [availabilityRecords, volunteerRequests] = await Promise.all([
        getAvailabilityByVolunteer(request.volUID, 'server'),
        getRequestsByVolunteer(request.volUID, 'server'),
      ]);
      const latestSessions = await getSessionsByRequestIDs(volunteerRequests.map(candidate => candidate.reqID), 'server');
      const latestAvailability = toWeeklyAvailability(availabilityRecords);
      setAvailability(latestAvailability);
      setBookedSessions(latestSessions);
      if (!isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, latestAvailability, latestSessions, session.sessID)) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      await updateSupportSession(sessID, {
        sessDate,
        sessTimeSlot: sessionTimestamp,
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        sessStatus: 'Planned',
        studConfirmed: true,
        volConfirmed: false,
      });
      try {
        await createNotification({
          UID: request.volUID,
          kind: 'session',
          actorName: userDoc?.name ?? 'Your student',
          message: 'proposed a new time for the support session.',
          category: request.category,
          title: request.title,
          redirectionLink: '/volunteer/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Session rearranged, but its notification could not be created:', notificationError);
      }

      const rearranged: SessionSummary = {
        category: request.category,
        title: request.title,
        dateLabel: formatLongDate(sessDate),
        timeslotLabel: formatTimeslotRange(hour),
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        volunteer: sessionVolunteer,
      };

      setSummary(rearranged); // switches the page to the confirmation screen
    } catch (error) {
      console.error('Session update error:', error);
      const slotUnavailable = error instanceof Error && error.message === 'SLOT_UNAVAILABLE';
      setErrorMessage(
        error instanceof Error && error.message === 'SLOT_PASSED'
          ? 'That time slot has already passed. Please go back and choose another one.'
          : slotUnavailable
            ? 'That time slot is no longer available. Please choose another one.'
            : 'Could not save your changes. Please try again.'
      );
      setShowSlotUnavailablePopup(slotUnavailable);
      if (slotUnavailable) setErrorMessage('');
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Saved ───────────────────────────────────────────────────────────────────

  if (summary) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={"/student/dashboard"} />
        <main className={"ui-page-student-background"}>
          <section className="ui-card ui-card--centered">
            <SessionConfirmationStep
              summary={summary}
              title="Your Support Session Has Been Rearranged!"
              message="Sit tight, you will receive a notification once your matched Volunteer confirms the new arrangement"
              onReturnToDashboard={() => navigate("/student/dashboard")}
              onViewSession={() => navigate("/student/my-sessions")}
            />
          </section>
        </main>
      </div>
    );
  }

  if (isLoadingSession) {
    return (
      <div className="ui-page">
        <Navbar dashboardPath={"/student/dashboard"} />
        <main className={"ui-page-student-background"}>
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
        <Navbar dashboardPath={"/student/dashboard"} />
        <main className={"ui-page-student-background"}>
          <section className="ui-card">
            <h1 className="ui-card-title">Rearrange Session</h1>
            <hr className="ui-card-divider" />
            <div className="ui-error" role="alert">
              <p>
                {sessionLoadError || (!session
                  ? userDoc?.UID ? 'We couldn’t find this session.' : 'Sign in to rearrange this session.'
                  : <>Only Planned or Confirmed<br />sessions can be rearranged.</>)}
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
      <Navbar dashboardPath={"/student/dashboard"} />
      <main className={"ui-page-student-background"}>
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
              volunteer={sessionVolunteer ?? undefined}
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
        message="Your volunteer will need to confirm the new arrangement again."
        confirmLabel="Save Changes"
        busy={isSaving}
        busyLabel="Saving…"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
      <ConfirmPopup
        open={showSlotUnavailablePopup}
        title="Time slot unavailable"
        message="That time slot is no longer available. Please choose another one."
        confirmLabel="Choose Another Time"
        hideCancel
        confirmStyle="outline"
        onConfirm={() => {
          setShowSlotUnavailablePopup(false);
          setCurrentStep(FIRST_STEP);
        }}
        onCancel={() => setShowSlotUnavailablePopup(false)}
      />
    </div>
  );
}

export default StudentSessionRearrangement;