import './step-progress.css';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  label: string;
  tone: 'green' | 'blue';
}

function StepProgress({ currentStep, totalSteps, label, tone }: StepProgressProps) {
  return (
    <div className="step-progress-wrap">
      <p className="step-progress-text" aria-hidden="true">
        Step {currentStep} of {totalSteps}
      </p>
      <div
        className={`step-progress step-progress--${tone}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
        aria-valuetext={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="step-progress-fill"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default StepProgress;
