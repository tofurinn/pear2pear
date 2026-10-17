import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//state objects: currentStep - which step is showing
//state object: formData - holds all form input values across steps
//state object: summary - snapshot of the submitted request, shown on the confirmation page
//state object: isSubmitting / submitMessage / errorMessage - submission state
//state object: showConfirm - whether the "Submit this support request?" popup is open

import Navbar from '../../../components/navbar/main-navbar.tsx';
import '../../../components/category-tag/category-tag.css';
import StepProgress from '../../../components/step-progress.tsx';
import ConfirmPopup from '../../../components/popup/confirm-popup.tsx';
import SupportTypeStep from './steps/step1.tsx';
import FilteringStep from './steps/step2.tsx';
import AvailabilityStep from './steps/step3.tsx';
import VolunteerMatchStep from './steps/step4.tsx';
import RequestSubmittedStep from './steps/step5.tsx';
import { createEmptyForm, buildSummary } from './request-utils.tsx';
import type { RequestFormData, RequestSummary } from './request-utils.tsx';
import { useAuth } from '../../../context/authContext';
import { createSupportRequest } from '../../../services/RequestService';
import { loadRequestFormVolunteers } from '../../../services/StudentRequestService';
import type { StudentRequestVolunteer } from '../../../types/StudentRequestVolunteer';

import '../../../components/ui.css';
import '../../../components/page-css/request-form.css';

const NO_VOLUNTEERS: StudentRequestVolunteer[] = [];

// ─── Component ─────────────────────────────────────────────────────────────────

function StudentMultiStepRequestForm() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RequestFormData>(createEmptyForm);
  const [summary, setSummary] = useState<RequestSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [volunteerLoad, setVolunteerLoad] = useState<{
    supportMode: RequestFormData['supportMode'];
    status: 'loading' | 'loaded' | 'error';
    volunteers: StudentRequestVolunteer[];
    error: string;
  }>({
    supportMode: 'Physical',
    status: 'loading',
    volunteers: [],
    error: '',
  });

  const totalSteps = 4; // the confirmation page is not a numbered step

  useEffect(() => {
    let isCurrent = true;

    loadRequestFormVolunteers(formData.supportMode)
      .then(data => {
        if (isCurrent) {
          setVolunteerLoad({ supportMode: formData.supportMode, status: 'loaded', volunteers: data, error: '' });
        }
      })
      .catch(error => {
        console.error('Error loading request form volunteers:', error);
        if (isCurrent) {
          setVolunteerLoad({
            supportMode: formData.supportMode,
            status: 'error',
            volunteers: [],
            error: 'Could not load volunteers. Please try again.',
          });
        }
      });

    return () => { isCurrent = false; };
  }, [formData.supportMode]);

  const isCurrentVolunteerLoad = volunteerLoad.supportMode === formData.supportMode;
  const volunteers = isCurrentVolunteerLoad && volunteerLoad.status === 'loaded'
    ? volunteerLoad.volunteers.filter(volunteer => volunteer.volUID !== firebaseUser?.uid)
    : NO_VOLUNTEERS;
  const volunteersLoading = !isCurrentVolunteerLoad || volunteerLoad.status === 'loading';
  const volunteersError = isCurrentVolunteerLoad && volunteerLoad.status === 'error'
    ? volunteerLoad.error
    : '';

  const availableSkills = useMemo(
    () => [...new Set(volunteers.flatMap(volunteer => volunteer.skills))].sort(),
    [volunteers],
  );

  const updateFormData = (data: Partial<RequestFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      if (!firebaseUser) throw new Error('You must be signed in to submit a support request');
      if (formData.volUID === firebaseUser.uid) throw new Error('You cannot send a support request to yourself');

      const submitted = buildSummary(formData, volunteers);
      if (!submitted) throw new Error('Could not find the selected volunteer');

      await createSupportRequest({
        studUID: firebaseUser.uid,
        volUID: formData.volUID,
        title: formData.title,
        description: formData.description,
        category: submitted.category,
        reqStatus: 'Pending',
        supportMode: formData.supportMode,
      });

      setSummary(submitted);
      setSubmitMessage('success');

      // Reset form (the summary above keeps what the confirmation page needs)
      setFormData(createEmptyForm());
      setCurrentStep(1);
    } catch (error) {
      console.error('Request submission error:', error);
      setErrorMessage('Error submitting request. Please try again.');
      setSubmitMessage('error');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SupportTypeStep
            formData={{
              category: formData.category,
              title: formData.title,
              description: formData.description,
            }}
            updateFormData={updateFormData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <FilteringStep
            formData={{
              supportMode: formData.supportMode,
              requiredSkills: formData.requiredSkills,
            }}
            availableSkills={availableSkills}
            volunteersLoading={volunteersLoading}
            volunteersError={volunteersError}
            updateFormData={updateFormData}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <AvailabilityStep
            formData={{
              availability: formData.availability,
            }}
            updateFormData={updateFormData}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <VolunteerMatchStep
            formData={{
              category: formData.category,
              requiredSkills: formData.requiredSkills,
              availability: formData.availability,
              volUID: formData.volUID,
            }}
            supportMode={formData.supportMode}
            volunteers={volunteers}
            volunteersLoading={volunteersLoading}
            volunteersError={volunteersError}
            updateFormData={updateFormData}
            onPrevious={handlePrevious}
            onSubmit={() => setShowConfirm(true)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const isSubmitted = submitMessage === 'success' && summary !== null;

  return (
    <div className="ui-page">
      <Navbar />
      <main className="ui-page-student-background">
        <section className={`ui-card ${isSubmitted ? 'ui-card--centered' : ''}`}>
          {isSubmitted ? (
            // Confirmation has its own heading, so no "Support Request" title/divider
            <RequestSubmittedStep
              summary={summary}
              onReturnToDashboard={() => navigate('/student/dashboard')}
              onViewRequests={() => navigate('/student/my-requests')}
            />
          ) : (
            <>
              <h1 className="ui-card-title">Support Request</h1>
              <hr className="ui-card-divider" />

              {submitMessage === 'error' ? (
                <div className="ui-error" role="alert">
                  <p>{errorMessage}</p>
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
                </div>
              ) : (
                <>
                  <StepProgress
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    label="Support request progress"
                    tone="green"
                  />
                  {renderStep()}
                </>
              )}
            </>
          )}
        </section>
      </main>

      <ConfirmPopup
        open={showConfirm}
        title="Submit this support request?"
        message="Are you sure you want to submit this support request?"
        confirmLabel="Submit Request"
        busy={isSubmitting}
        busyLabel="Submitting…"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default StudentMultiStepRequestForm;