import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//state objects: currentStep - which step is showing
//state object: formData - holds all form input values across steps
//state object: summary - snapshot of the submitted request, shown on the confirmation page
//state object: isSubmitting / submitMessage / errorMessage - submission state

import Navbar from '../../../components/navbar/main-navbar.tsx';
import '../../../components/category-tag/category-tag.css';
import StepProgress from '../../../components/step-progress.tsx';
import SupportTypeStep from './steps/step1.tsx';
import FilteringStep from './steps/step2.tsx';
import AvailabilityStep from './steps/step3.tsx';
import VolunteerMatchStep from './steps/step4.tsx';
import RequestSubmittedStep from './steps/step5.tsx';
import { createEmptyForm, buildSummary } from './request-utils.tsx';
import type { RequestFormData, RequestSummary } from './request-utils.tsx';

import '../../../components/ui.css';
import '../../../components/page-css/request-form.css';

// ─── Component ─────────────────────────────────────────────────────────────────

function MultiStepRequestForm() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RequestFormData>(createEmptyForm);
  const [summary, setSummary] = useState<RequestSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalSteps = 4; // the confirmation page is not a numbered step

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
      // TODO: create the Support_Request document from formData
      //   category, title, description -> as entered
      //   availability                 -> recurring weekday/hour preferences
      //   volID                        -> the chosen volunteer, reqStatus: 'Pending'

      const submitted = buildSummary(formData);
      if (!submitted) throw new Error('Could not find the selected volunteer');

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
              volID: formData.volID,
            }}
            updateFormData={updateFormData}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
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
      <main className="ui-page-background ui-page-request-background">
        <section className={`ui-card ${isSubmitted ? 'ui-card--centered' : ''}`}>
          {isSubmitted ? (
            // Confirmation has its own heading, so no "Support Request" title/divider
            <RequestSubmittedStep
              summary={summary}
              onReturnToDashboard={() => navigate('/dashboard')}
              onViewRequests={() => navigate('/requests')} // adjust to your request list route
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
                    tone="blue"
                  />
                  {renderStep()}
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default MultiStepRequestForm;