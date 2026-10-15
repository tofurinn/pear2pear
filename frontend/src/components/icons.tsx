import React from 'react';

// ─── Stroke icons (inherit currentColor; sized by the `size` prop or by CSS) ───

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
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M5 5l14 14M19 5L5 19" /></Icon>;
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
  <Icon {...p}>
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

// ─── Single star: yellow when filled, optional green outline (feedback form) ───

interface StarIconProps {
  filled?: boolean;
  outlined?: boolean;
  className?: string;
}

export const StarIcon: React.FC<StarIconProps> = ({ filled = true, outlined = true, className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <path
      d="M12 2.6l2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.8 3.3 1.3-6.5L2.6 9.4l6.6-.8z"
      fill={filled ? 'var(--color-star)' : '#fff'}
      stroke={outlined ? 'var(--color-green1)' : filled ? 'var(--color-star)' : 'none'}
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Read-only star row that supports halves (e.g. 4.5) ───

export const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className }) => (
  <span className={`ui-stars ${className ?? ''}`.trim()} role="img" aria-label={`${rating} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map(i => (
      <span className="ui-star" key={i}>
        <span className="ui-star-fill" style={{ width: `${Math.min(Math.max(rating - i, 0), 1) * 100}%` }}>★</span>
        ★
      </span>
    ))}
  </span>
);

// Exclamation in a circle for the "To confirm" pill (needs the student's attention)
export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Icon>
);

// Outline star so the Rated pill's icon takes the pill colour like the other pill icons
export const RatedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 2.6l2.8 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1l-5.8 3.3 1.3-6.5L2.6 9.4l6.6-.8z" />
  </svg>
);
