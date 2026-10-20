import { useEffect } from 'react';
import type { RequestFormData } from '../request-utils.tsx';
import { StepNav } from '../request-ui.tsx';
import HourPicker from '../../../../components/hour-picker/hour-picker.tsx';

interface Step3Props {
  formData: Pick<RequestFormData, 'availability'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  availableSlots: ReadonlySet<string>;
  volunteersLoading: boolean;
  volunteersError: string;
  onPrevious: () => void;
  onNext: () => void;
}

function AvailabilityStep({
  formData,
  updateFormData,
  availableSlots,
  volunteersLoading,
  volunteersError,
  onPrevious,
  onNext,
}: Step3Props) {
  const count = formData.availability.length;

  useEffect(() => {
    if (volunteersLoading || volunteersError) return;
    const availableSelection = formData.availability.filter(slot => availableSlots.has(slot));
    if (availableSelection.length !== count) {
      updateFormData({ availability: availableSelection });
    }
  }, [availableSlots, count, formData.availability, updateFormData, volunteersError, volunteersLoading]);

  return (
    <>
      <h2 className="ui-card-heading">Step 3: Availability Filtering</h2>

      {volunteersLoading ? (
        <div className="ui-card-body rf-empty" role="status"><p>Loading volunteer availability...</p></div>
      ) : volunteersError ? (
        <div className="ui-card-body rf-empty" role="alert"><p>{volunteersError}</p></div>
      ) : (
        <HourPicker
          selectedSlots={formData.availability}
          onSelectionChange={availability => updateFormData({ availability })}
          availableSlots={availableSlots}
          showSelectAll
        />
      )}

      <StepNav
        onPrevious={onPrevious}
        onNext={onNext}
        nextDisabled={count === 0 || volunteersLoading || Boolean(volunteersError)}
      />
    </>
  );
}

export default AvailabilityStep;
