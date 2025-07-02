"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Entry = {
  id: string;
  createdAt: string; // ISO date string
  summary: { sentiment: number } | null;
  isOpen?: "open" | "closed" | string;
};

type Props = {
  initialWeek: number;
  initialYear: number;
  entries: Array<Entry | null>;
};

function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  ISOweekStart.setHours(0, 0, 0, 0);
  return ISOweekStart;
}

function getWeekOfYear(date: Date): number {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - oneJan.getTime()) / 86400000);
  return Math.ceil((dayOfYear + oneJan.getDay() + 1) / 7);
}

function getWeeksInYear(year: number): number {
  const d = new Date(year, 11, 31);
  const week = getWeekOfYear(d);
  return week === 1 ? 52 : week;
}

function getWeekDays(startDate: Date): Date[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

function formatDayNumber(date: Date): number {
  return date.getDate();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function sentimentToColor(sentiment: number): string {
  // Green if sentiment > 0, yellow otherwise
  return sentiment > 0 ? "#16a34a" : "#eab308";
}

export default function WeeklyCalendar({
  initialWeek,
  initialYear,
  entries,
}: Props) {
  const router = useRouter();

  const goToPreviousWeek = () => {
    let newWeek = initialWeek - 1;
    let newYear = initialYear;
    if (newWeek < 1) {
      newYear = initialYear - 1;
      newWeek = getWeeksInYear(newYear);
    }
    router.push(`/${newYear}/week/${newWeek}`);
  };

  const goToNextWeek = () => {
    let newWeek = initialWeek + 1;
    let newYear = initialYear;
    const maxWeek = getWeeksInYear(initialYear);
    if (newWeek > maxWeek) {
      newWeek = 1;
      newYear = initialYear + 1;
    }
    router.push(`/${newYear}/week/${newWeek}`);
  };

  const weekStart = getDateOfISOWeek(initialWeek, initialYear);
  const weekDays = getWeekDays(weekStart);
  const today = new Date();
  const totalWeeks = getWeeksInYear(initialYear);

  const getSentimentForDate = (date: Date): number | null => {
    const sentiments = entries
      .filter(
        (e): e is Entry =>
          e !== null &&
          e.createdAt !== undefined &&
          e.summary !== null &&
          e.summary.sentiment !== undefined &&
          isSameDay(new Date(e.createdAt), date),
      )
      .map((e) => e.summary!.sentiment);

    if (sentiments.length === 0) return null;

    const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    return Number.isFinite(avg) ? avg : null;
  };

  const getEntryForDate = (date: Date): Entry | null => {
    return (
      entries.find(
        (e) =>
          e !== null &&
          e.createdAt !== undefined &&
          isSameDay(new Date(e.createdAt), date),
      ) ?? null
    );
  };

  return (
    <div className="bg-background flex flex-col rounded-lg border px-4 py-2 shadow-sm">
      {/* Navigation and week number */}
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="text-foreground text-center text-sm font-medium">
          Week {initialWeek} / {totalWeeks} — {initialYear}
        </div>

        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((date) => {
          const isToday = isSameDay(date, today);
          const sentiment = getSentimentForDate(date);
          const entry = getEntryForDate(date);

          return (
            <div
              key={date.toISOString()}
              className="flex flex-col items-center"
            >
              <span className="text-muted-foreground text-xs">
                {formatDayName(date)}
              </span>

              {entry ? (
                <Link
                  href={
                    entry.isOpen === "open"
                      ? `/plan/?entryId=${entry.id}`
                      : `/journal/?entryId=${entry.id}`
                  }
                  className={`text-sm font-medium underline ${
                    isToday
                      ? "text-foreground font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatDayNumber(date)}
                </Link>
              ) : (
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? "text-foreground font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatDayNumber(date)}
                </span>
              )}

              {/* Show sentiment dot only if entry.isOpen is "closed" (case-insensitive) */}
              {sentiment !== null &&
                entry?.isOpen?.toLowerCase() === "closed" && (
                  <span
                    className="mt-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: sentimentToColor(sentiment) }}
                    title={`Sentiment: ${sentiment.toFixed(2)}`}
                  />
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
