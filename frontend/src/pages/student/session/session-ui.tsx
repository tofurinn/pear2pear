import React from 'react';
import { ChevronLeft, ChevronRight } from '../../../components/icons.tsx';

// Shared icons and StarRating now live in components/ui; re-exported so the steps keep their imports
export * from '../../../components/icons.tsx';

// ─── Session-only icon ─────────────────────────────────────────────────────────

// Approximation of the Figma clipboard icon: export the real SVG from Figma and swap it in
export const SessionArrangedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="arranged-gradient" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#5fc77a" />
        <stop offset="1" stopColor="#e3e66d" />
      </linearGradient>
    </defs>
    <g stroke="url(#arranged-gradient)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 28h-4a8 8 0 00-8 8v62a8 8 0 008 8h68a8 8 0 008-8V36a8 8 0 00-8-8h-4" />
      <path d="M40 20v16M80 20v16M52 28h16" />
      <path d="M44 84l4-14 26-26 10 10-26 26-14 4z" />
    </g>
  </svg>
);

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