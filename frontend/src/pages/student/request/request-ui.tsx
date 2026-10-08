import React from 'react';
import { CheckIcon, ChevronDown, ChevronLeft, ChevronRight, StarRating } from '../../../components/icons.tsx';

export { CheckIcon, ChevronDown, StarRating };

// ─── Shared Previous / Next row ────────────────────────────────────────────────

interface StepNavProps {
  onPrevious?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextVariant?: 'outline' | 'solid';
  nextDisabled?: boolean;
}

export const StepNav: React.FC<StepNavProps> = ({
  onPrevious,
  onNext,
  nextLabel = 'Next Page',
  nextVariant = 'outline',
  nextDisabled = false,
}) => (
  <div className="ui-actions">
    {onPrevious ? (
      <button type="button" className="ui-btn ui-btn-outline" onClick={onPrevious}>
        <ChevronLeft /> Previous Page
      </button>
    ) : (
      <span /> /* keeps Next on the right when there is no Previous */
    )}
    <button type="button" className={`ui-btn ui-btn-${nextVariant}`} onClick={onNext} disabled={nextDisabled}>
      {nextLabel}
      {nextVariant === 'outline' && <ChevronRight />}
    </button>
  </div>
);