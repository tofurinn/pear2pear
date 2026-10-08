import type { RequestFormData } from '../request-utils.tsx';
import { StepNav } from '../request-ui.tsx';
import HourPicker from '../../../../components/hour-picker/hour-picker.tsx';

interface Step3Props {
  formData: Pick<RequestFormData, 'availability'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function AvailabilityStep({ formData, updateFormData, onPrevious, onNext }: Step3Props) {
  const count = formData.availability.length;

  return (
    <>
      <h2 className="ui-card-heading">Step 3: Availability Filtering</h2>

      <HourPicker
        selectedSlots={formData.availability}
        onSelectionChange={availability => updateFormData({ availability })}
      />

      <StepNav onPrevious={onPrevious} onNext={onNext} nextDisabled={count === 0} />
    </>
  );
}

export default AvailabilityStep;
