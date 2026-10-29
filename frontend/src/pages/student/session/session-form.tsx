import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from "../../../context/authContext.tsx";
import { useLocation, useNavigate } from 'react-router-dom';
//state objects: currentStep - which step is showing
//state object: formData - holds all form input values across steps
//state object: summary - snapshot of the booked session, shown on the confirmation page
//state object: isSubmitting / submitMessage / errorMessage - submission state
//state object: showConfirm - whether the "Arrange this session?" popup is open

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';
import StepProgress from '../../../components/step-progress.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';
import SelectRequestStep from './steps/step1.tsx';
import TimeSlotStep from './steps/step2.tsx';
import MeetupDetailsStep from './steps/step3.tsx';
import SessionConfirmationStep from './steps/step4.tsx';
import {
  EMPTY_FORM,
  buildSessionSummary,
  isSessionSlotBookable,
  isStepValid,
  toWeeklyAvailability,
} from './session-utils.tsx';
import type { SessionStepKey } from './session-utils.tsx';
import type { SessionFormData, SessionSummary, Volunteer } from './session-utils.tsx';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';
import { getRequestsByStudentAndStatus, getRequestsByVolunteer } from '../../../services/RequestService';
import { updateRequestStatus } from '../../../services/RequestService';
import { getAvailabilityByVolunteer } from '../../../services/AvailabilityService';
import { createSupportSession, getSessionsByRequestIDs } from '../../../services/SessionService';
import { createNotification } from '../../../services/NotificationService';
import { getVolunteer } from '../../../services/VolunteerService';
import { getUser } from '../../../services/UserService';
import { parseDateKey, slotToHour } from '../student-utils.tsx';

import '../../../components/ui.css';
import './../../../components/page-css/session-form.css';

const STEP_KEYS: SessionStepKey[] = ['request', 'timeSlot', 'meetup'];

// ─── Component ─────────────────────────────────────────────────────────────────

function StudentMultiStepSessionForm() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const studentUID = userDoc?.UID ?? null;
  
  const location = useLocation();
  const requestedReqID = (location.state as { reqID?: unknown } | null)?.reqID;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_FORM);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSlotUnavailablePopup, setShowSlotUnavailablePopup] = useState(false);
  const [requests, setRequests] = useState<Support_Request[]>([]);
  const [volunteers, setVolunteers] = useState<Record<string, Volunteer>>({});
  const [loadedRequestsStudentUID, setLoadedRequestsStudentUID] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [availability, setAvailability] = useState<Record<number, number[]>>({});
  const [bookedSessions, setBookedSessions] = useState<Support_Session[]>([]);
  const [loadedAvailabilityVolunteerUID, setLoadedAvailabilityVolunteerUID] = useState<string | null>(null);

  const initialRequest = requests.find(request => request.reqID === requestedReqID);
  const selectedRequest = requests.find(request => request.reqID === formData.reqID) ?? initialRequest;
  const selectedVolunteer = selectedRequest ? volunteers[selectedRequest.volUID] : undefined;
  const isLoadingRequests = authLoading || (!!studentUID && loadedRequestsStudentUID !== studentUID);
  const isLoadingAvailability = !!selectedRequest && loadedAvailabilityVolunteerUID !== selectedRequest.volUID;
  const visibleLoadError = loadError || (!authLoading && !studentUID ? 'Sign in to arrange a session.' : '');

  useEffect(() => {
    if (authLoading || !studentUID) return;

    let isCurrent = true;
    const loadRequests = async () => {
      try {
        const acceptedRequests = await getRequestsByStudentAndStatus(studentUID, 'Accepted');
        const volunteerIDs = [...new Set(acceptedRequests.map(request => request.volUID))];
        const volunteerEntries = await Promise.all(volunteerIDs.map(async volUID => {
          const [user, volunteer] = await Promise.all([getUser(volUID), getVolunteer(volUID)]);
          const summary: Volunteer = {
            volUID,
            name: user?.name ?? 'Volunteer',
            rating: volunteer?.avgRating ?? 0,
            ratingCount: volunteer?.ratingCount ?? 0,
            tags: volunteer?.skills ?? [],
          };
          return [volUID, summary] as const;
        }));
        if (isCurrent) {
          setRequests(acceptedRequests);
          setVolunteers(Object.fromEntries(volunteerEntries));
          setLoadError('');
        }
      } catch (error) {
        console.error('Error loading accepted requests:', error);
        if (isCurrent) setLoadError('Could not load your accepted requests. Please try again.');
      } finally {
        if (isCurrent) setLoadedRequestsStudentUID(studentUID);
      }
    };
    void loadRequests();
    return () => { isCurrent = false; };
  }, [authLoading, studentUID]);

  useEffect(() => {
    if (!selectedRequest) return;

    let isCurrent = true;
    const loadVolunteerSlots = async () => {
      try {
        const [availabilityRecords, volunteerRequests] = await Promise.all([
          getAvailabilityByVolunteer(selectedRequest.volUID),
          getRequestsByVolunteer(selectedRequest.volUID),
        ]);
        const sessions = await getSessionsByRequestIDs(volunteerRequests.map(request => request.reqID));
        if (isCurrent) {
          setAvailability(toWeeklyAvailability(availabilityRecords));
          setBookedSessions(sessions);
          setLoadError('');
        }
      } catch (error) {
        console.error('Error loading volunteer availability:', error);
        if (isCurrent) setLoadError('Could not load this volunteer’s availability. Please try again.');
      } finally {
        if (isCurrent) setLoadedAvailabilityVolunteerUID(selectedRequest.volUID);
      }
    };
    void loadVolunteerSlots();
    return () => { isCurrent = false; };
  }, [selectedRequest]);

  const totalSteps = 3; // the confirmation page is not a numbered step
  const isLastStep = currentStep === totalSteps;

  // Whether the current step has what it needs before moving on
  const currentStepValid = currentStep === 2
    ? isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, availability, bookedSessions) && !isLoadingAvailability
    : isStepValid(STEP_KEYS[currentStep - 1], {
      ...formData,
      reqID: formData.reqID || initialRequest?.reqID || '',
    });
  const canGoNext = currentStepValid && !isSubmitting;

  const updateFormData = (data: Partial<SessionFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1 && !formData.reqID && initialRequest) {
        setFormData(prev => ({ ...prev, reqID: initialRequest.reqID }));
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');
    setShowSlotUnavailablePopup(false);

    try {
      if (!selectedRequest || !selectedVolunteer) throw new Error('REQUEST_NOT_FOUND');

      if (!formData.sessDate || !formData.sessTimeSlot) throw new Error('SLOT_UNAVAILABLE');
      const baseDate = parseDateKey(formData.sessDate);
      const hour = slotToHour(formData.sessTimeSlot);
      const slotDate = new Date(baseDate);
      slotDate.setHours(hour, 0, 0, 0);
      const sessTimeSlot = Timestamp.fromDate(slotDate);
      if (sessTimeSlot.toMillis() <= Date.now()) throw new Error('SLOT_PASSED');

      const [availabilityRecords, volunteerRequests] = await Promise.all([
        getAvailabilityByVolunteer(selectedRequest.volUID, 'server'),
        getRequestsByVolunteer(selectedRequest.volUID, 'server'),
      ]);
      const latestSessions = await getSessionsByRequestIDs(volunteerRequests.map(request => request.reqID), 'server');
      const latestAvailability = toWeeklyAvailability(availabilityRecords);
      setAvailability(latestAvailability);
      setBookedSessions(latestSessions);
      if (!isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, latestAvailability, latestSessions)) {
        throw new Error('SLOT_UNAVAILABLE');
      }

      await createSupportSession({
        reqID: formData.reqID,
        sessDate: baseDate,
        sessTimeSlot,
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        sessStatus: 'Planned',
        studConfirmed: true,
        volConfirmed: false,
      });
      await updateRequestStatus(formData.reqID, 'Scheduled');

      try {
        await createNotification({
          UID: selectedRequest.volUID,
          kind: 'session',
          actorName: userDoc?.name ?? 'Your student',
          message: 'has arranged a support session with you.',
          category: selectedRequest.category,
          title: selectedRequest.title,
          redirectionLink: '/volunteer/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Session arranged, but its notification could not be created:', notificationError);
      }

      setSummary(buildSessionSummary(formData, selectedRequest, selectedVolunteer));
      setSubmitMessage('success');

      // Reset form (the summary above keeps what the confirmation page needs)
      setFormData(EMPTY_FORM);
      setCurrentStep(1);
    } catch (error) {
      console.error('Session submission error:', error);
      const slotUnavailable = error instanceof Error && error.message === 'SLOT_UNAVAILABLE';
      setErrorMessage(
        error instanceof Error && error.message === 'SLOT_PASSED'
          ? 'That time slot has already passed. Please go back and choose another one.'
          : slotUnavailable
            ? 'That time slot is no longer available. Please choose another one.'
            : 'Error arranging session. Please try again.'
      );
      setSubmitMessage(slotUnavailable ? '' : 'error');
      setShowSlotUnavailablePopup(slotUnavailable);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false); // close the popup whether it worked or not, so it never covers the next screen
    }
  };

  // Each step only draws its own content; the Previous / Next row is below, in one place
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SelectRequestStep
            formData={{ reqID: formData.reqID || initialRequest?.reqID || '' }}
            updateFormData={updateFormData}
            requests={requests}
            volunteers={volunteers}
            isLoading={isLoadingRequests}
          />
        );
      case 2:
        return (
          <TimeSlotStep
            formData={{
              reqID: formData.reqID,
              sessDate: formData.sessDate,
              sessTimeSlot: formData.sessTimeSlot,
            }}
            updateFormData={updateFormData}
            volunteer={selectedVolunteer}
            availability={availability}
            sessions={bookedSessions}
            isLoading={isLoadingAvailability}
          />
        );
      case 3:
        return (
          <MeetupDetailsStep
            formData={{
              supportMode: formData.supportMode,
              meetingLocation: formData.meetingLocation,
            }}
            updateFormData={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  const isConfirmed = submitMessage === 'success' && summary !== null;

  return (
    <div className="ui-page">
      <Navbar dashboardPath={"/student/dashboard"} />
      <main className={"ui-page-student-background"}>
        <section className={`ui-card ${isConfirmed ? 'ui-card--centered' : ''}`}>
          {isConfirmed ? (
            // Confirmation has its own heading, so no "Support Session" title/divider
            <SessionConfirmationStep
              summary={summary}
              onReturnToDashboard={() => navigate("/student/dashboard")}
              onViewSession={() => navigate("/student/my-sessions")}
            />
          ) : (
            <>
              <h1 className="ui-card-title">Support Session</h1>
              <hr className="ui-card-divider" />

              {submitMessage === 'error' || visibleLoadError ? (
                <div className="ui-error" role="alert">
                  <p>{visibleLoadError || errorMessage}</p>
                  {!visibleLoadError && (
                    <button
                      type="button"
                      className="ui-btn ui-btn-outline"
                      onClick={() => {
                        setSubmitMessage('');
                        setCurrentStep(totalSteps); // form data is intact, so return to the last step
                      }}
                    >
                      Go Back
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <StepProgress
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    label="Session booking progress"
                    tone="green"
                  />

                  {renderStep()}

                  <div className="ui-actions">
                    {currentStep > 1 ? (
                      <button type="button" className="ui-btn ui-btn-outline" onClick={handlePrevious}>
                        <ChevronLeft /> Previous Page
                      </button>
                    ) : (
                      <span /> /* keeps Next on the right on step 1 */
                    )}

                    <button
                      type="button"
                      className={`ui-btn ${isLastStep ? 'ui-btn-solid' : 'ui-btn-outline'}`}
                      onClick={isLastStep ? () => setShowConfirm(true) : handleNext}
                      disabled={!canGoNext}
                    >
                      {isLastStep ? (
                        isSubmitting ? 'Arranging…' : 'Arrange Session'
                      ) : (
                        <>Next Page <ChevronRight /></>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>

      <ConfirmPopup
        open={showConfirm}
        title="Arrange this session?"
        message="Your volunteer will be asked to confirm the session."
        confirmLabel="Arrange Session"
        busy={isSubmitting}
        busyLabel="Arranging…"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
      <ConfirmPopup
        open={showSlotUnavailablePopup}
        title="Time slot unavailable"
        message={errorMessage}
        confirmLabel="Choose Another Time"
        hideCancel
        confirmStyle="outline"
        onConfirm={() => {
          setShowSlotUnavailablePopup(false);
          setCurrentStep(2);
        }}
        onCancel={() => setShowSlotUnavailablePopup(false)}
      />
    </div>
  );
}

export default StudentMultiStepSessionForm;