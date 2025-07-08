"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Clock, CheckCircle2 } from "lucide-react";
import { getDateOfISOWeek } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import NewDayJournal from "./NewDayJournal";
import type { Entry as PrismaEntry } from "@prisma/client";
type Entry = PrismaEntry;

type Props = {
  initialWeek: number;
  initialYear: number;
  entries: Array<Entry | null>;
  user: any;
  entry: any;
};

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
    d.setUTCDate(startDate.getUTCDate() + i);
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
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

function sentimentToColor(sentiment: number): string {
  if (sentiment > 0) return "#16a34a"; // green
  if (sentiment < 0) return "#eab308"; // yellow
  return "#a3a3a3"; // gray for neutral
}

function AnimatedHourglass() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // 4s total, flip at 2s
    const interval = setInterval(() => {
      setFlipped((f) => !f);
    }, 2000); // 2000ms = half of 4s
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      role="img"
      aria-label="hourglass"
      className={`hourglass-tip${flipped ? " hourglass-flip" : ""}`}
    >
      ⏳
    </span>
  );
}

export default function WeeklyCalendar({
  initialWeek,
  initialYear,
  entries,
  user,
  entry,
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
  const weekEnd = weekDays[6];
  console.log('getDateOfISOWeek:', initialWeek, initialYear, weekStart.toISOString());
  console.log('weekDays:', weekDays.map(d => d.toISOString()));
  const today = new Date();
  const totalWeeks = getWeeksInYear(initialYear);

  // Format week range for display
  function formatWeekRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)}–${end.toLocaleDateString("en-US", options)}`;
  }

  const getSentimentForDate = (date: Date): number | null => {
    const sentiments = entries
      .filter(
        (e): e is Entry =>
          e !== null &&
          e.createdAt !== undefined &&
          e.summary !== null &&
          (() => { try { return typeof e.summary === 'string' ? JSON.parse(e.summary).sentiment !== undefined : (e.summary as any).sentiment !== undefined; } catch { return false; } })() &&
          isSameDay(new Date(e.createdAt), date),
      )
      .map((e) => {
        if (!e) return null;
        try {
          return typeof e.summary === 'string' ? JSON.parse(e.summary).sentiment : (e.summary as any).sentiment;
        } catch {
          return null;
        }
      });

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

  // Calculate current ISO week and year
  const now = new Date();
  // Helper to get ISO week number
  function getISOWeek(date: Date): number {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  const currentWeek = getISOWeek(now);
  const currentYear = now.getUTCFullYear();
  const isCurrentWeek = initialWeek === currentWeek && initialYear === currentYear;

  // Calculate average positivity score for the week
  const weekSentiments = entries
    .map(e => {
      if (!e) return null;
      let sentiment = null;
      try {
        sentiment = typeof e.summary === 'string' ? JSON.parse(e.summary).sentiment : (e.summary as any).sentiment;
      } catch {}
      return sentiment !== null && typeof sentiment === 'number' ? sentiment : null;
    })
    .filter((s): s is number => s !== null && s !== undefined);
  // Cumulative positivity score for the week (translated)
  const weekSentimentTotal = weekSentiments
    .map(s => ((s + 1) / 2) * 10)
    .reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Back to this week button sits above the card */}
      {!isCurrentWeek && (
        <Button
          variant="secondary"
          className="w-full py-3 rounded-b-none rounded-t-lg text-base font-semibold mb-0 max-w-4xl mx-auto"
          onClick={() => router.push(`/${currentYear}/week/${currentWeek}`)}
        >
          Back to Current Week
        </Button>
      )}
      <div className="bg-background flex flex-col rounded-lg border px-4 py-2 w-full max-w-4xl mx-auto">
        {/* Week selector and navigation at the top */}
        <div className="mb-4 flex flex-col items-center justify-between gap-1">
          <div className="flex w-full items-center justify-between">
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
          <div className="text-xs text-muted-foreground">
            {formatWeekRange(weekStart, weekEnd)}
          </div>
        </div>

        {/* New Day entry component or weekly wrap up placeholder */}
        {isCurrentWeek ? (
          <div className="mt-8 mb-10 w-full max-w-4xl mx-auto">
            {(() => {
              // Find today's entry
              const todayDate = new Date();
              const todayEntry = getEntryForDate(todayDate);
              // Map to correct shape if entry exists
              if (todayEntry) {
                const mappedEntry: Entry = {
                  ...todayEntry,
                  summary: typeof todayEntry.summary === 'string' ? todayEntry.summary : JSON.stringify(todayEntry.summary ?? ''),
                  journalEntry: todayEntry.journalEntry ?? {},
                  journalEntry2: todayEntry.journalEntry2 ?? {},
                  userResponse: todayEntry.userResponse ?? {},
                  userResponse2: todayEntry.userResponse2 ?? {},
                  isOpen: todayEntry.isOpen ?? 'open',
                  authorId: todayEntry.authorId ?? '',
                  createdAt: todayEntry.createdAt ? new Date(todayEntry.createdAt) : new Date(),
                  updatedAt: todayEntry.updatedAt ? new Date(todayEntry.updatedAt) : new Date(),
                  id: todayEntry.id,
                };
                // Only force countdown for 'partial' or 'open', not for 'partial_open' after 5pm
                const now = new Date();
                const isAfterFive = now.getHours() >= 17;
                if (mappedEntry.isOpen === 'partial' || (mappedEntry.isOpen === 'open')) {
                  return <NewDayJournal user={user} entry={mappedEntry} forceCountdown={true} />;
                } else if (mappedEntry.isOpen === 'partial_open' && isAfterFive) {
                  return <NewDayJournal user={user} entry={mappedEntry} />;
                } else {
                  return <NewDayJournal user={user} entry={mappedEntry} />;
                }
              } else {
                return <NewDayJournal user={user} entry={null} />;
              }
            })()}
          </div>
        ) : (
          <div className="mt-8 mb-10 w-full max-w-4xl mx-auto flex flex-col items-center">
            <span className="mb-4 text-lg font-medium text-muted-foreground">View Weekly Wrap Up</span>
            <Button asChild>
              <Link href={`/week-wrap-up/${initialYear}/${initialWeek}`}>View Wrap Up</Link>
            </Button>
          </div>
        )}

        {/* Days grid below the New Day entry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center mt-8">
          {weekDays.map((date) => {
            const isToday = isSameDay(date, today);
            const sentiment = getSentimentForDate(date);
            const entry = getEntryForDate(date);

            let todayBorder = '';
            if (isToday) {
              if (!entry) {
                todayBorder = ' border-black border-2';
              } else if (entry.isOpen === 'partial') {
                const now = new Date();
                const entryDate = new Date(entry.createdAt);
                const isSameDay =
                  now.getFullYear() === entryDate.getFullYear() &&
                  now.getMonth() === entryDate.getMonth() &&
                  now.getDate() === entryDate.getDate();
                const fivePmEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 17, 0, 0, 0);
                if (isSameDay && now.getTime() < fivePmEntryDate.getTime()) {
                  todayBorder = ' border-yellow-400 border-2'; // waiting
                } else {
                  todayBorder = ' border-green-500 border-2'; // ready
                }
              } else if (entry.isOpen === 'open' || entry.isOpen === 'partial_open') {
                todayBorder = ' border-blue-500 border-2'; // open
              } else if (entry.isOpen === 'closed') {
                todayBorder = ' border-gray-500 border-2'; // completed
              }
            }
            return (
              <div
                key={date.toISOString()}
                className={`flex flex-col items-center bg-background border rounded-lg p-2 min-w-0 flex-1${todayBorder}`}
                style={{ minHeight: '90px' }}
              >
                <span className="text-muted-foreground text-xs mb-1">
                  {formatDayName(date)}
                </span>
                {entry ? (
                  <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                    <Link
                      href={`/journal/?entryId=${entry.id}`}
                      className={
                        "mt-2 block w-full truncate rounded bg-muted px-2 py-1 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      {formatDayNumber(date)}
                    </Link>
                    {/* Status label and indicator at the bottom */}
                    <div className="flex flex-col items-center justify-end w-full mt-auto min-h-[32px]">
                      {(() => {
                        // Partial logic (hourglass or bell)
                        if (entry.isOpen === "partial") {
                          const now = new Date();
                          const entryDate = new Date(entry.createdAt);
                          const isSameDay =
                            now.getFullYear() === entryDate.getFullYear() &&
                            now.getMonth() === entryDate.getMonth() &&
                            now.getDate() === entryDate.getDate();
                          const fivePmEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 17, 0, 0, 0);
                          if (isSameDay && now.getTime() < fivePmEntryDate.getTime()) {
                            return <>
                              <span className="text-[10px] text-muted-foreground mb-0.5">Awaiting</span>
                              <span title="Awaiting response window"><AnimatedHourglass /></span>
                            </>;
                          } else if ((isSameDay && now.getTime() >= fivePmEntryDate.getTime()) || now > fivePmEntryDate) {
                            return <>
                              <span className="text-[10px] text-muted-foreground mb-0.5">Ready</span>
                              <span title="Ready for response">🔔</span>
                            </>;
                          }
                        }
                        // Sentiment dot for closed
                        let entryObject = (() => { try { return typeof entry.summary === 'string' ? JSON.parse(entry.summary) : (entry.summary as any) || {}; } catch { return {}; } })();
                        if (entry.isOpen === "closed" && entryObject && typeof entryObject.sentiment === 'number') {
                          return <>
                            <span className="text-[10px] text-muted-foreground mb-0.5">Completed</span>
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: sentimentToColor(entryObject.sentiment) }}
                              title={`Sentiment: ${entryObject.sentiment}`}
                            />
                          </>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <span className="mt-2 block w-full rounded bg-muted px-2 py-1 text-xs text-gray-400 opacity-40 border border-dashed border-gray-400">
                    –
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Positivity score bar below the calendar grid */}
        <div className="w-full max-w-4xl mx-auto mt-4">
          <div className="w-full py-3 rounded-t-none rounded-b-lg text-base font-semibold bg-secondary text-secondary-foreground text-center">
            {weekSentiments.length > 0 ? `Positivity Score: ${weekSentimentTotal.toFixed(1)}` : 'Positivity Score: N/A'}
          </div>
        </div>
      </div>
    </>
  );
}
