import React from 'react';

// ─── Icons (stroke icons inherit currentColor) ─────────────────────────────────

interface IconProps {
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps & { children: React.ReactNode }> = ({ className, size = 20, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="M4 12.5l5 5L20 6.5" /></Icon>;
export const ChevronLeft = (p: IconProps) => <Icon {...p}><path d="M15 4l-8 8 8 8" /></Icon>;
export const ChevronRight = (p: IconProps) => <Icon {...p}><path d="M9 4l8 8-8 8" /></Icon>;
export const ChevronDown = (p: IconProps) => <Icon {...p}><path d="M4 9l8 8 8-8" /></Icon>;
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
);
export const ClockIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export const SwapIcon = (p: IconProps) => <Icon {...p}><path d="M7 7h11l-3-3M17 17H6l3 3" /></Icon>;
export const PinIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>
);

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

// ─── Star rating (supports halves, e.g. 4.5) ───────────────────────────────────

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="stars" role="img" aria-label={`${rating} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map(i => (
      <span className="star" key={i}>
        <span className="star-fill" style={{ width: `${Math.min(Math.max(rating - i, 0), 1) * 100}%` }}>★</span>
        ★
      </span>
    ))}
  </span>
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
  <div className="session-actions">
    {onPrevious ? (
      <button type="button" className="btn btn-outline" onClick={onPrevious}>
        <ChevronLeft /> Previous Page
      </button>
    ) : (
      <span /> /* keeps Next on the right when there is no Previous */
    )}
    <button type="button" className={`btn btn-${nextVariant}`} onClick={onNext} disabled={nextDisabled}>
      {nextLabel}
      {nextVariant === 'outline' && <ChevronRight />}
    </button>
  </div>
);