import React from 'react';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';

// Shared icons and StarRating live in components/icons; re-exported so the steps keep their imports
export * from '../../../components/icons.tsx';

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