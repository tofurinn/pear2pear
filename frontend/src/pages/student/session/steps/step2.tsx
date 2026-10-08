import React, { useMemo, useState } from 'react';
import {
  DAY_NAMES,
  formatDayMonth,
  formatHour,
  formatTimeslotRange,
  hourToSlot,
  parseDateKey,
  slotToHour,
  toDateKey,
} from '../../student-utils.tsx';
import {
  getAvailability,
  getRequestById,
  getUpcomingDays,
  getVolunteerById,
} from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import { CheckIcon } from '../../../../components/icons.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step2Props {
  formData: Pick<SessionFormData, 'reqID' | 'sessDate' | 'sessTimeSlot'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
}

interface SlotRef {
  date: Date;
  hour: number;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am – 8pm

const describeSlot = ({ date, hour }: SlotRef) =>
  `${DAY_NAMES[date.getDay()]}, ${formatDayMonth(date)} · ${formatTimeslotRange(hour)}`;

// ─── Component ─────────────────────────────────────────────────────────────────

function TimeSlotStep({ formData, updateFormData }: Step2Props) {
  // The 7 days after today, from the device clock (fixed when the step opens)
  const days = useMemo(() => getUpcomingDays(7), []);
  const [hovered, setHovered] = useState<SlotRef | null>(null);

  const request = getRequestById(formData.reqID);
  const volunteer = request ? getVolunteerById(request.volID) : undefined;
  const availability = request ? getAvailability(request.volID) : {};

  const selected: SlotRef | null =
    formData.sessDate && formData.sessTimeSlot
      ? { date: parseDateKey(formData.sessDate), hour: slotToHour(formData.sessTimeSlot) }
      : null;

  return (
    <>
      <h2 className="ui-card-heading">
        Step 2: Select <span className="ui-accent">{volunteer?.name ?? 'Volunteer'}'s</span> Available Time Slot
      </h2>

      <div className="ui-card-body slot-scroll">
        <div className="slot-grid" role="radiogroup" aria-label="Available time slots">
          {/* Header row */}
          <span />
          {days.map(day => (
            <div className="slot-day" key={toDateKey(day)}>
              <span>{DAY_NAMES[day.getDay()]}</span>
              <strong>{formatDayMonth(day)}</strong>
            </div>
          ))}

          {/* One row per hour */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <span className="slot-hour">{formatHour(hour)}</span>
              {days.map(day => {
                const dateKey = toDateKey(day);
                const isAvailable = availability[day.getDay()]?.includes(hour) ?? false;
                const isSelected = formData.sessDate === dateKey && formData.sessTimeSlot === hourToSlot(hour);
                const preview = () => isAvailable && setHovered({ date: day, hour });
                return (
                  <div
                    className="slot-cell"
                    key={dateKey}
                    onMouseEnter={preview}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${DAY_NAMES[day.getDay()]} ${formatDayMonth(day)}, ${formatHour(hour)}${isAvailable ? '' : ' (unavailable)'}`}
                      className={`slot ${isSelected ? 'selected' : isAvailable ? 'available' : ''}`}
                      disabled={!isAvailable}
                      onFocus={preview}
                      onBlur={() => setHovered(null)}
                      onClick={() => updateFormData({ sessDate: dateKey, sessTimeSlot: hourToSlot(hour) })}
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

      {/* Hovered slot wins; otherwise show what is selected */}
      <p className="slot-readout">
        {hovered ? (
          <><span className="slot-readout-label">Hovering:</span> {describeSlot(hovered)}</>
        ) : selected ? (
          <><span className="slot-readout-label">Selected:</span> {describeSlot(selected)}</>
        ) : (
          'Select a time slot to see the date and time here'
        )}
      </p>
    </>
  );
}

export default TimeSlotStep;