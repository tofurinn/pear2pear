import type { ReactNode } from 'react';

import {
  AlertIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  StarRating,
} from './icons.tsx';

export interface ItemCardProps {
  category: string;
  title: string;
  personName: string;
  dateLabel: string;
  rating?: number;
  pill?: ReactNode;
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
          <StarRating rating={rating} className="vol-stars" />
        </div>
      )}

      <div className="ui-item-card-footer">
        <span className="ui-item-card-date">{dateLabel}</span>
        <div className="dashboard-item-actions">
          {pill}
          <button type="button" className="ui-chip-btn ui-chip-btn--info" onClick={onViewDetails}>
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}

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
      return null;
  }
}

export function StatusPill({
  tone,
  label,
  icon,
}: {
  tone: string;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <span className={`ui-status-pill ui-status-pill--${tone}`}>
      {icon ?? pillIcon(tone)} {label}
    </span>
  );
}

export interface BoardSectionProps {
  title: string;
  count: number;
  emptyText: string;
  cardsClassName?: string;
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