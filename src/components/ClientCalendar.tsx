"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ClassNames } from "react-day-picker";
import { format } from "date-fns";

type Props = {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
};

const sentimentMap: Record<string, number> = {
  "2025-06-21": 4.0,
  "2025-06-22": 2.5,
};

const modifiers: Record<string, Date[]> = {
  positive: [],
  neutral: [],
  negative: [],
};

for (const [dateStr, score] of Object.entries(sentimentMap)) {
  const date = new Date(dateStr);
  if (score >= 4) modifiers.positive.push(date);
  else if (score >= 2.5) modifiers.neutral.push(date);
  else modifiers.negative.push(date);
}

const modifiersClassNames: ClassNames = {
  positive: "bg-green-200 text-green-900",
  neutral: "bg-yellow-200 text-yellow-900",
  negative: "bg-red-200 text-red-900",
};

function getWeeksInMonth(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  for (
    let date = new Date(firstDay);
    date <= lastDay;
    date.setDate(date.getDate() + 1)
  ) {
    const current = new Date(date);
    currentWeek.push(current);
    if (current.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  return weeks;
}

export function ClientCalendar({ date, setDate }: Props) {
  const today = new Date();
  const [selectedWeek, setSelectedWeek] = useState<Date[] | null>(null);
  const weeks = getWeeksInMonth(today.getFullYear(), today.getMonth());

  return (
    <div className="space-y-4">
      {/* Week dropdown */}
      <select
        className="rounded-md border p-2"
        onChange={(e) => {
          const weekIndex = parseInt(e.target.value);
          setSelectedWeek(weeks[weekIndex]);
          setDate(weeks[weekIndex][0]); // set first day of week
        }}
        value={
          selectedWeek
            ? weeks.findIndex((w) =>
                w.some(
                  (d) => d.toDateString() === selectedWeek[0].toDateString(),
                ),
              )
            : ""
        }
      >
        <option value="">Select a week</option>
        {weeks.map((week, i) => (
          <option key={i} value={i}>
            Week {i + 1}: {format(week[0], "MMM d")} –{" "}
            {format(week.at(-1)!, "MMM d")}
          </option>
        ))}
      </select>

      {/* Calendar view */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border shadow-sm"
        captionLayout="dropdown"
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        defaultMonth={today}
      />
    </div>
  );
}

export default ClientCalendar;
