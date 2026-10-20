import React from 'react';
import type { CSSProperties } from 'react';
import { DAY_NAMES, formatHour } from '../../pages/student/student-utils.tsx';
import { weekdaySlotKey } from '../../pages/student/request/request-utils.tsx';
import { CheckIcon } from '../../pages/student/request/request-ui.tsx';
import './hour-picker.css';

const WEEKDAYS = DAY_NAMES.map((name, weekday) => ({ name, weekday }));
const HOURS = Array.from({ length: 13 }, (_, index) => index + 8);

interface HourPickerProps {
  selectedSlots: string[];
  onSelectionChange: (slots: string[]) => void;
  availableSlots?: ReadonlySet<string>;
  showSelectAll?: boolean;
}

function HourPicker({
  selectedSlots,
  onSelectionChange,
  availableSlots,
  showSelectAll = false,
}: HourPickerProps) {
  const toggleSlot = (key: string) => {
    onSelectionChange(
      selectedSlots.includes(key)
        ? selectedSlots.filter(slot => slot !== key)
        : [...selectedSlots, key],
    );
  };

  const toggleDay = (weekday: number) => {
    const daySlots = HOURS
      .map(hour => weekdaySlotKey(weekday, hour))
      .filter(key => availableSlots?.has(key) ?? true);
    if (daySlots.length === 0) return;

    const selected = new Set(selectedSlots);
    if (daySlots.every(key => selected.has(key))) {
      daySlots.forEach(key => selected.delete(key));
    } else {
      daySlots.forEach(key => selected.add(key));
    }
    onSelectionChange([...selected]);
  };

  return (
    <>
      <div className="ui-card-body rf-slot-scroll">
        <div
          className="rf-slot-grid"
          style={{ '--days': WEEKDAYS.length } as CSSProperties}
          role="group"
          aria-label="Times you are available"
        >
          <span />
          {WEEKDAYS.map(({ name, weekday }) => {
            const availableDaySlots = HOURS
              .map(hour => weekdaySlotKey(weekday, hour))
              .filter(key => availableSlots?.has(key) ?? true);
            const allSelected = availableDaySlots.length > 0 &&
              availableDaySlots.every(key => selectedSlots.includes(key));
            return (
              <div className="rf-slot-day" key={weekday}>
                <span>{name}</span>
                {showSelectAll && (
                  <button
                    type="button"
                    className="rf-slot-day-select-all"
                    aria-label={`${allSelected ? 'Deselect' : 'Select'} all available times for ${name}`}
                    disabled={availableDaySlots.length === 0}
                    onClick={() => toggleDay(weekday)}
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>
            );
          })}

          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <span className="rf-slot-hour">{formatHour(hour)}</span>
              {WEEKDAYS.map(({ name, weekday }) => {
                const key = weekdaySlotKey(weekday, hour);
                const isSelected = selectedSlots.includes(key);
                const isAvailable = availableSlots?.has(key) ?? true;
                return (
                  <div className="rf-slot-cell" key={weekday}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`${name}, ${formatHour(hour)}${isAvailable ? '' : ' (unavailable)'}`}
                      aria-disabled={!isAvailable}
                      className={`rf-slot ${isAvailable ? (isSelected ? 'selected' : '') : 'unavailable'}`}
                      disabled={!isAvailable}
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
        {selectedSlots.length === 0
          ? 'Select every time slot you are free'
          : <><span className="rf-slot-readout-label">Selected:</span> {selectedSlots.length} time slot{selectedSlots.length === 1 ? '' : 's'}</>}
      </p>
    </>
  );
}

export default HourPicker;
