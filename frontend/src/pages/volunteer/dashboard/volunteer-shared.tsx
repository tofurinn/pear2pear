import type { ReactNode } from 'react';

import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon } from '../../../components/icons.tsx';

// ─── Icons ─────────────────────────────────────────────────────────────────────

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

// ─── Stars (half stars supported through --fill) ───────────────────────────────
// TODO: swap for your existing star component if you have one.

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="vol-stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <span key={i} className="vol-star" style={{ ['--fill' as string]: `${fill}%` }} aria-hidden="true">
            ★
          </span>
        );
      })}
    </span>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────

function pillIcon(tone: string) {
  switch (tone) {
    case 'pending':
    case 'planned':
      return <ClockIcon />;
    case 'accepted':
    case 'confirmed':
      return <CheckIcon />;
    case 'to-confirm':
      return <AlertIcon />;
    case 'scheduled':
    case 'completed':
    case 'rated':
      return <CalendarIcon />;
    case 'rejected':
    case 'cancelled':
      return <CloseIcon />;
    default:
      return null; // e.g. "awaiting" has no icon
  }
}

export function StatusPill({ tone, label }: { tone: string; label: string }) {
  const icon = pillIcon(tone);
  return (
    <span className={`ui-status-pill ui-status-pill--${tone}`}>
      {icon} {label}
    </span>
  );
}

// ─── Card (same markup on all three volunteer pages) ───────────────────────────

interface ItemCardProps {
  category: string;
  title: string;
  personName: string;
  dateLabel: string;
  rating?: number;
  pill?: ReactNode; // status pill
  onViewDetails: () => void;
}

export function ItemCard({
  category,
  title,
  personName,
  dateLabel,
  rating,
  pill,
  onViewDetails,
}: ItemCardProps) {
  return (
    <article className="ui-item-card">
      <span className="ui-category-tag">{category}</span>
      <h3 className="ui-item-card-title">{title}</h3>
      <p className="ui-item-card-person">{personName}</p>

      {rating !== undefined && (
        <div className="ui-item-card-rating">
          <Stars rating={rating} />
        </div>
      )}

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{dateLabel}</span>
        <div className="vol-card-actions">
          {pill}
          <button type="button" className="ui-chip-btn ui-chip-btn--info" onClick={onViewDetails}>
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Titled board column ───────────────────────────────────────────────────────

interface BoardSectionProps {
  title: string;
  count: number;
  emptyText: string;
  cardsClassName?: string; // e.g. "dashboard-cards--two"
  children: ReactNode;
}

export function BoardSection({ title, count, emptyText, cardsClassName = '', children }: BoardSectionProps) {
  return (
    <section>
      <h2 className="dashboard-section-title">{title}</h2>
      <div className={`dashboard-cards ${cardsClassName}`.trim()}>
        {children}
        {count === 0 && <p className="dashboard-empty">{emptyText}</p>}
      </div>
    </section>
  );
}
