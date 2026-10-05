import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import {
  DAY_NAMES,
  formatDayMonth,
  formatHour,
  getDaysInRange,
  slotKey,
  toDateKey,
} from '../request-utils.tsx';
import type { RequestFormData } from '../request-utils.tsx';
import { CheckIcon, StepNav } from '../request-ui.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step3Props {
  formData: Pick<RequestFormData, 'prefStart' | 'prefEnd' | 'availability'>;
  updateFormData: (data: Partial<RequestFormData>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am – 8pm

// ─── Component ─────────────────────────────────────────────────────────────────

function AvailabilityStep({ formData, updateFormData, onPrevious, onNext }: Step3Props) {
  const { prefStart, prefEnd, availability } = formData;

  // One column per day in the preferred date range chosen in step 2
  const days = useMemo(() => getDaysInRange(prefStart, prefEnd), [prefStart, prefEnd]);

  const toggleSlot = (key: string) =>
    updateFormData({
      availability: availability.includes(key)
        ? availability.filter(k => k !== key)
        : [...availability, key],
    });

  const count = availability.length;

  return (
    <>
      <h2 className="ui-card-heading">Step 3: Availability Filtering</h2>

      <div className="ui-card-body rf-slot-scroll">
        <div
          className="rf-slot-grid"
          style={{ '--days': days.length } as CSSProperties}
          role="group"
          aria-label="Times you are available"
        >
          {/* Header row */}
          <span />
          {days.map(day => (
            <div className="rf-slot-day" key={toDateKey(day)}>
              <span>{DAY_NAMES[day.getDay()]}</span>
              <strong>{formatDayMonth(day)}</strong>
            </div>
          ))}

          {/* One row per hour */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <span className="rf-slot-hour">{formatHour(hour)}</span>
              {days.map(day => {
                const dateKey = toDateKey(day);
                const key = slotKey(dateKey, hour);
                const isSelected = availability.includes(key);
                return (
                  <div className="rf-slot-cell" key={dateKey}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`${DAY_NAMES[day.getDay()]} ${formatDayMonth(day)}, ${formatHour(hour)}`}
                      className={`rf-slot ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSlot(key)}
                    >
                      {isSelected && <CheckIcon size={16} />}
                    </button>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <p className="rf-slot-readout">
        {count === 0
          ? 'Select every time slot you are free'
          : <><span className="rf-slot-readout-label">Selected:</span> {count} time slot{count === 1 ? '' : 's'}</>}
      </p>

      <StepNav onPrevious={onPrevious} onNext={onNext} nextDisabled={count === 0} />
    </>
  );
}

export default AvailabilityStep;