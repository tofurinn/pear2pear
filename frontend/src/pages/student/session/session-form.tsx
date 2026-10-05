import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//state objects: currentStep - which step is showing
//state object: formData - holds all form input values across steps
//state object: summary - snapshot of the booked session, shown on the confirmation page
//state object: isSubmitting / submitMessage / errorMessage - submission state

import Navbar from '../../../components/navbar/main-navbar.tsx';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';
import SelectRequestStep from './steps/step1.tsx';
import TimeSlotStep from './steps/step2.tsx';
import MeetupDetailsStep from './steps/step3.tsx';
import SessionConfirmationStep from './steps/step4.tsx';
import { EMPTY_FORM, buildSummary } from './session-utils.tsx';
import type { SessionFormData, SessionSummary } from './session-utils.tsx';

import '../../../components/forms-ui.css';
import './session-form.css';

// ─── Component ─────────────────────────────────────────────────────────────────

function MultiStepSessionForm() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_FORM);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalSteps = 3; // the confirmation page is not a numbered step
  const isLastStep = currentStep === totalSteps;

  // Whether the current step has what it needs before moving on
  const canGoNext =
    currentStep === 1
      ? formData.reqID !== ''
      : currentStep === 2
        ? formData.sessDate !== '' && formData.sessTimeSlot !== ''
        : formData.meetingLocation.trim() !== '' && !isSubmitting;

  const updateFormData = (data: Partial<SessionFormData>) => {
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
      // TODO: create the Support_Session document from formData
      //   sessDate     -> parseDateKey(formData.sessDate)
      //   sessTimeSlot -> Timestamp for formData.sessDate + formData.sessTimeSlot
      //   sessStatus   -> 'Planned', studConfirmed: true, volConfirmed: false

      const booked = buildSummary(formData);
      if (!booked) throw new Error('Could not find the selected request');

      setSummary(booked);
      setSubmitMessage('success');

      // Reset form (the summary above keeps what the confirmation page needs)
      setFormData(EMPTY_FORM);
      setCurrentStep(1);
    } catch (error) {
      console.error('Session submission error:', error);
      setErrorMessage('Error arranging session. Please try again.');
      setSubmitMessage('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Each step only draws its own content; the Previous / Next row is below, in one place
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SelectRequestStep formData={{ reqID: formData.reqID }} updateFormData={updateFormData} />;
      case 2:
        return (
          <TimeSlotStep
            formData={{
              reqID: formData.reqID,
              sessDate: formData.sessDate,
              sessTimeSlot: formData.sessTimeSlot,
            }}
            updateFormData={updateFormData}
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
      <Navbar />
      <main className="ui-page-background">
        <section className={`ui-card ${isConfirmed ? 'ui-card--centered' : ''}`}>
          {isConfirmed ? (
            // Confirmation has its own heading, so no "Support Session" title/divider
            <SessionConfirmationStep
              summary={summary}
              onReturnToDashboard={() => navigate('/dashboard')}
              onViewSession={() => navigate('/sessions')} // adjust to your session detail route
            />
          ) : (
            <>
              <h1 className="ui-card-title">Support Session</h1>
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
                  {/* Progress through the 3 steps (the confirmation page isn't counted) */}
                  <div className="session-progress-wrap">
                    <p className="session-progress-text" aria-hidden="true">Step {currentStep} of {totalSteps}</p>
                    <div
                      className="session-progress"
                      role="progressbar"
                      aria-label="Session booking progress"
                      aria-valuemin={1}
                      aria-valuemax={totalSteps}
                      aria-valuenow={currentStep}
                      aria-valuetext={`Step ${currentStep} of ${totalSteps}`}
                    >
                      <div className="session-progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                    </div>
                  </div>

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
                      onClick={isLastStep ? handleSubmit : handleNext}
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
    </div>
  );
}

export default MultiStepSessionForm;