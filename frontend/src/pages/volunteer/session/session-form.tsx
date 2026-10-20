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
import type { SessionFormData, SessionSummary, Student } from './session-utils.tsx';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';
import { getRequestsByVolunteerAndStatus, getRequestsByVolunteer } from '../../../services/RequestService';
import { updateRequestStatus } from '../../../services/RequestService';
import { getAvailabilityByVolunteer } from '../../../services/AvailabilityService';
import { createSupportSession, getSessionsByRequestIDs } from '../../../services/SessionService';
import { createNotification } from '../../../services/NotificationService';
import { getUser } from '../../../services/UserService';
import { parseDateKey, slotToHour } from '../volunteer-utils.ts';

import '../../../components/ui.css';
import './../../../components/page-css/session-form.css';

const STEP_KEYS: SessionStepKey[] = ['request', 'timeSlot', 'meetup'];

// ─── Component ─────────────────────────────────────────────────────────────────

function VolunteerMultiStepSessionForm() {
  const navigate = useNavigate();
  const { userDoc, loading: authLoading } = useAuth();
  const volunteerUID = userDoc?.UID ?? null;
  
  const location = useLocation();
  const requestedReqID = (location.state as { reqID?: unknown } | null)?.reqID;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_FORM);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [requests, setRequests] = useState<Support_Request[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [loadedRequestsVolunteerUID, setLoadedRequestsVolunteerUID] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [availability, setAvailability] = useState<Record<number, number[]>>({});
  const [bookedSessions, setBookedSessions] = useState<Support_Session[]>([]);
  const [loadedAvailabilityVolunteerUID, setLoadedAvailabilityVolunteerUID] = useState<string | null>(null);

  const initialRequest = requests.find(request => request.reqID === requestedReqID);
  const selectedRequest = requests.find(request => request.reqID === formData.reqID) ?? initialRequest;
  const selectedStudent = selectedRequest ? students[selectedRequest.studUID] : undefined;
  const isLoadingRequests = authLoading || (!!volunteerUID && loadedRequestsVolunteerUID !== volunteerUID);
  const isLoadingAvailability = !!volunteerUID && loadedAvailabilityVolunteerUID !== volunteerUID;
  const visibleLoadError = loadError || (!authLoading && !volunteerUID ? 'Sign in to arrange a session.' : '');

  useEffect(() => {
    if (authLoading || !volunteerUID) return;

    let isCurrent = true;
    const loadRequests = async () => {
      try {
        const acceptedRequests = await getRequestsByVolunteerAndStatus(volunteerUID, 'Accepted');
        const studentIDs = [...new Set(acceptedRequests.map(request => request.studUID))];
        const studentEntries = await Promise.all(studentIDs.map(async studUID => {
          const user = await getUser(studUID);
          const student: Student = {
            studUID,
            name: user?.name ?? 'Student',
          };
          return [studUID, student] as const;
        }));
        if (isCurrent) {
          setRequests(acceptedRequests);
          setStudents(Object.fromEntries(studentEntries));
          setLoadError('');
        }
      } catch (error) {
        console.error('Error loading accepted requests:', error);
        if (isCurrent) setLoadError('Could not load your accepted requests. Please try again.');
      } finally {
        if (isCurrent) setLoadedRequestsVolunteerUID(volunteerUID);
      }
    };
    void loadRequests();
    return () => { isCurrent = false; };
  }, [authLoading, volunteerUID]);

  // The slot grid is the signed-in volunteer's own availability, so it doesn't depend on which request is picked
  useEffect(() => {
    if (authLoading || !volunteerUID) return;

    let isCurrent = true;
    const loadVolunteerSlots = async () => {
      try {
        const [availabilityRecords, volunteerRequests] = await Promise.all([
          getAvailabilityByVolunteer(volunteerUID),
          getRequestsByVolunteer(volunteerUID),
        ]);
        const sessions = await getSessionsByRequestIDs(volunteerRequests.map(request => request.reqID));
        if (isCurrent) {
          setAvailability(toWeeklyAvailability(availabilityRecords));
          setBookedSessions(sessions);
          setLoadError('');
        }
      } catch (error) {
        console.error('Error loading volunteer availability:', error);
        if (isCurrent) setLoadError('Could not load your availability. Please try again.');
      } finally {
        if (isCurrent) setLoadedAvailabilityVolunteerUID(volunteerUID);
      }
    };
    void loadVolunteerSlots();
    return () => { isCurrent = false; };
  }, [authLoading, volunteerUID]);

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

    try {
      if (!selectedRequest || !selectedStudent) throw new Error('REQUEST_NOT_FOUND');

      if (!isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, availability, bookedSessions)) {
        throw new Error('SLOT_UNAVAILABLE');
      }
      const baseDate = parseDateKey(formData.sessDate);
      const hour = slotToHour(formData.sessTimeSlot);
      const slotDate = new Date(baseDate);
      slotDate.setHours(hour, 0, 0, 0);
      const sessTimeSlot = Timestamp.fromDate(slotDate);
      if (sessTimeSlot.toMillis() <= Date.now()) throw new Error('SLOT_PASSED');

      await createSupportSession({
        reqID: formData.reqID,
        sessDate: baseDate,
        sessTimeSlot,
        supportMode: formData.supportMode,
        meetingLocation: formData.meetingLocation.trim(),
        sessStatus: 'Planned',
        studConfirmed: false, // the volunteer is arranging it, so the student is the one who still has to confirm
        volConfirmed: true,
      });
      await updateRequestStatus(formData.reqID, 'Scheduled');

      try {
        await createNotification({
          UID: selectedRequest.studUID,
          kind: 'session',
          actorName: userDoc?.name ?? 'Your volunteer',
          message: 'has arranged a support session with you.',
          category: selectedRequest.category,
          title: selectedRequest.title,
          redirectionLink: '/student/my-sessions',
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Session arranged, but its notification could not be created:', notificationError);
      }

      setSummary(buildSessionSummary(formData, selectedRequest, selectedStudent));
      setSubmitMessage('success');

      // Reset form (the summary above keeps what the confirmation page needs)
      setFormData(EMPTY_FORM);
      setCurrentStep(1);
    } catch (error) {
      console.error('Session submission error:', error);
      setErrorMessage(
        error instanceof Error && error.message === 'SLOT_PASSED'
          ? 'That time slot has already passed. Please go back and choose another one.'
          : error instanceof Error && error.message === 'SLOT_UNAVAILABLE'
            ? 'That time slot is no longer available. Please choose another one.'
            : 'Error arranging session. Please try again.'
      );
      setSubmitMessage('error');
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
            students={students}
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
      <Navbar dashboardPath={"/volunteer/dashboard"} />
      <main className={"volunteer-dashboard-background"}>
        <section className={`ui-card ${isConfirmed ? 'ui-card--centered' : ''}`}>
          {isConfirmed ? (
            // Confirmation has its own heading, so no "Support Session" title/divider
            <SessionConfirmationStep
              summary={summary}
              onReturnToDashboard={() => navigate("/volunteer/dashboard")}
              onViewSession={() => navigate("/volunteer/my-sessions")}
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
        message="Your student will be asked to confirm the session."
        confirmLabel="Arrange Session"
        busy={isSubmitting}
        busyLabel="Arranging…"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default VolunteerMultiStepSessionForm;