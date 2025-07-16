"use client";

type Props = {
  entry: Entry[];
};

import { Entry } from "@prisma/client";
import React, { useEffect, useMemo, useState } from "react";
import {
  SidebarGroupContent as SidebarGroupContentShadCN,
  SidebarMenu,
  SidebarMenuItem,
} from "./ui/sidebar";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import Fuse from "fuse.js";
import SelectEntryButton from "./SelectEntryButton";
import DeleteEntryButton from "./DeleteEntryButton";
import { getDateOfISOWeek } from "@/lib/utils";
import { isSameLocalDay } from "@/lib/utils";

function getWeekDays(startDate: Date): Date[] {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    return d;
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function SideBarGroupContent({ entry }: Props) {
  // Show the week of the earliest (oldest) entry, or current week if no entries
  const now = new Date();
  const oldest = entry.length > 0 ? new Date(entry[entry.length - 1].createdAt) : now;
  const weekStart = getDateOfISOWeek(getISOWeek(oldest), oldest.getFullYear());
  const weekDays = getWeekDays(weekStart);

  function getISOWeek(date: Date): number {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Map each day to its entry (if any)
  const entriesByDay = weekDays.map((date) => {
    const found = entry.find(
      (e) => e && e.createdAt && isSameLocalDay(new Date(e.createdAt), date)
    );
    return { date, entry: found };
  });

  return (
    <SidebarGroupContentShadCN>
      <div className="grid gap-1 text-center w-full min-w-0">
        {entriesByDay.map(({ date, entry }) => (
          (() => {
            const now = new Date();
            const isToday =
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth() &&
              date.getDate() === now.getDate();
            let border = "";
            if (isToday && entry) {
              if (entry.isOpen === "partial") {
                border = "border-yellow-400 border-2";
              } else if (entry.isOpen === "open" || entry.isOpen === "partial_open") {
                border = "border-green-500 border-2";
              } else if (entry.isOpen === "closed") {
                border = "border-red-500 border-2";
              }
            }
            return (
              <div key={date.toISOString()} className={`flex flex-col items-start gap-1 w-full min-w-0 mt-2 rounded-lg`}>
                <span className="text-muted-foreground text-xs">
                  {formatDayName(date)}
                </span>
                {entry ? (
                  <div className={`flex flex-row items-center gap-1 w-full rounded-lg ${border} ${isToday && entry ? 'p-0.5' : ''}`}>
                    <SelectEntryButton entry={entry} />
                    <DeleteEntryButton entryId={entry.id} deleteEntryLocally={() => {}} />
                  </div>
                ) : (
                  <span className="h-6 w-full rounded bg-muted opacity-40 border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400 p-0">
                    –
                  </span>
                )}
              </div>
            );
          })()
        ))}
      </div>
    </SidebarGroupContentShadCN>
  );
}

export default SideBarGroupContent;
