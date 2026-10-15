import React, { useEffect, useMemo, useState } from 'react';
import {
  DAY_NAMES,
  formatDayMonth,
  formatHour,
  formatTimeslotRange,
  hourToSlot,
  toDateKey,
} from '../../volunteer-utils.tsx';
import { getUpcomingDays, isSessionSlotBookable, isSessionSlotOccupied } from '../session-utils.tsx';
import type { SessionFormData } from '../session-utils.tsx';
import type { Support_Session } from '../../../../types/Support_Session';
import { CheckIcon } from '../../../../components/icons.tsx';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Step2Props {
  formData: Pick<SessionFormData, 'reqID' | 'sessDate' | 'sessTimeSlot'>;
  updateFormData: (data: Partial<SessionFormData>) => void;
  availability: Record<number, number[]>;
  sessions: Support_Session[];
  isLoading: boolean;
  excludedSessionID?: string;
}

interface SlotRef {
  date: Date;
  hour: number;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am – 8pm

const describeSlot = ({ date, hour }: SlotRef) =>
  `${DAY_NAMES[date.getDay()]}, ${formatDayMonth(date)} · ${formatTimeslotRange(hour)}`;

// ─── Component ─────────────────────────────────────────────────────────────────

function TimeSlotStep({
  formData,
  updateFormData,
  availability,
  sessions,
  isLoading,
  excludedSessionID,
}: Step2Props) {
  const days = useMemo(() => getUpcomingDays(7, new Date()), []);
  const [hovered, setHovered] = useState<SlotRef | null>(null);

  useEffect(() => {
    if (isLoading || !formData.sessDate || !formData.sessTimeSlot) return;
    if (!isSessionSlotBookable(formData.sessDate, formData.sessTimeSlot, availability, sessions, excludedSessionID)) {
      updateFormData({ sessDate: '', sessTimeSlot: '' });
    }
  }, [availability, excludedSessionID, formData.sessDate, formData.sessTimeSlot, isLoading, sessions, updateFormData]);

  const selectedDay = days.find(day => toDateKey(day) === formData.sessDate);
  const selectedHour = Number.parseInt(formData.sessTimeSlot, 10);
  const selected = selectedDay && Number.isInteger(selectedHour)
    ? { date: selectedDay, hour: selectedHour }
    : null;

  return (
    <>
      <h2 className="ui-card-heading">Step 2: Select From Your Available Time Slot</h2>

      {isLoading && <p role="status">Loading availability...</p>}

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
                const isOccupied = isSessionSlotOccupied(dateKey, hour, sessions, excludedSessionID);
                const canSelect = isAvailable && !isOccupied && !isLoading;
                const preview = () => canSelect && setHovered({ date: day, hour });
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
                      aria-label={`${DAY_NAMES[day.getDay()]} ${formatDayMonth(day)}, ${formatHour(hour)}${isOccupied ? ' (booked)' : canSelect ? '' : ' (unavailable)'}`}
                      aria-disabled={!canSelect}
                      className={`slot ${isOccupied ? 'occupied' : isSelected ? 'selected' : canSelect ? 'available' : ''}`}
                      disabled={!canSelect}
                      onFocus={preview}
                      onBlur={() => setHovered(null)}
                      onClick={() => canSelect && updateFormData({ sessDate: dateKey, sessTimeSlot: hourToSlot(hour) })}
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