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
}

function HourPicker({ selectedSlots, onSelectionChange }: HourPickerProps) {
  const toggleSlot = (key: string) => {
    onSelectionChange(
      selectedSlots.includes(key)
        ? selectedSlots.filter(slot => slot !== key)
        : [...selectedSlots, key],
    );
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
          {WEEKDAYS.map(({ name, weekday }) => (
            <div className="rf-slot-day" key={weekday}>
              <span>{name}</span>
            </div>
          ))}

          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <span className="rf-slot-hour">{formatHour(hour)}</span>
              {WEEKDAYS.map(({ name, weekday }) => {
                const key = weekdaySlotKey(weekday, hour);
                const isSelected = selectedSlots.includes(key);
                return (
                  <div className="rf-slot-cell" key={weekday}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`${name}, ${formatHour(hour)}`}
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
        {selectedSlots.length === 0
          ? 'Select every time slot you are free'
          : <><span className="rf-slot-readout-label">Selected:</span> {selectedSlots.length} time slot{selectedSlots.length === 1 ? '' : 's'}</>}
      </p>
    </>
  );
}

export default HourPicker;
