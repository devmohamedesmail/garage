"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DatePickerWithRangeProps {
  date: DateRange;
  onDateChange: (date: DateRange) => void;
}

export function DatePickerWithRange({
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (range: any) => {
    onDateChange(range);
    if (range.from && range.to) {
      setIsCalendarOpen(false);
    }
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleCalendar}
        className="px-4 py-2 border rounded-md bg-white flex items-center justify-between w-64 text-left"
      >
        <span>
          {date.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM dd, yyyy")} -{" "}
                {format(date.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(date.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </span>
        <span className="ml-2">📅</span>
      </button>

      {isCalendarOpen && (
        <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg p-4">
          <DayPicker
            mode="range"
            defaultMonth={date.from || undefined}
            selected={date as any}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}