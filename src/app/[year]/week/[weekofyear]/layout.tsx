import EntryProvider from "@/providers/EntryProvider";
import AppSideBar from "@/components/AppSideBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import ConditionalSidebarTrigger from "@/components/ConditionalSidebarTrigger";
import prisma from "@/db/prisma";
import { getUser } from "@/auth/server";
import { Entry } from "@prisma/client";

interface WeekLayoutProps {
  children: ReactNode;
  params: { year: string; weekofyear: string };
}

export default async function WeekLayout({ children, params }: WeekLayoutProps) {
  const { year, weekofyear } = params;
  const user = await getUser();
  let entries: Entry[] = [];
  let dbUser = null;
  let weekStartDate: Date | null = null;
  let weekEndDate: Date | null = null;
  if (user) {
    const yearNum = parseInt(year, 10);
    const weekNum = parseInt(weekofyear, 10);
    if (!isNaN(yearNum) && !isNaN(weekNum)) {
      const getDateOfISOWeek = (week: number, year: number) => {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        return ISOweekStart;
      };
      weekStartDate = getDateOfISOWeek(weekNum, yearNum);
      weekStartDate.setUTCHours(0, 0, 0, 0);
      weekEndDate = new Date(weekStartDate.getTime());
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
      weekEndDate.setUTCHours(23, 59, 59, 999);
      entries = await prisma.entry.findMany({
        where: {
          authorId: user.id,
          createdAt: {
            gte: weekStartDate!,
            lte: weekEndDate!,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        preference: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });
  }
  // Auto-close logic: close entries past allowed time
  if (user && weekStartDate && weekEndDate && entries.length > 0) {
    const now = new Date();
    const entriesToClose = entries.filter(entry => {
      if (entry.isOpen === "partial" || entry.isOpen === "open" || entry.isOpen === "partial_open") {
        const entryDate = new Date(entry.updatedAt);
        // Only close if more than 24 hours have passed since last update
        const twentyFourHoursLater = new Date(entryDate.getTime() + 24 * 60 * 60 * 1000);
        return now > twentyFourHoursLater;
      }
      return false;
    });
    if (entriesToClose.length > 0) {
      await Promise.all(entriesToClose.map(entry =>
        prisma.entry.update({ where: { id: entry.id }, data: { isOpen: "closed" } })
      ));
      // Re-fetch entries after closing
      entries = await prisma.entry.findMany({
        where: {
          authorId: user.id,
          createdAt: {
            gte: weekStartDate!,
            lte: weekEndDate!,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }
  }
  // Delete empty closed entries (isOpen === 'closed' and no data)
  if (user && entries.length > 0) {
    const emptyClosedEntries = entries.filter(entry => {
      if (entry.isOpen === "closed") {
        // Check if journalEntry is empty or only contains empty strings
        const journalEmpty = Array.isArray(entry.journalEntry)
          ? entry.journalEntry.length === 0 || entry.journalEntry.every(j => j && typeof j === "object" && "text" in j && (typeof j.text !== "string" || j.text.trim() === ""))
          : !entry.journalEntry || JSON.stringify(entry.journalEntry).trim() === "";
        // Check if summary is default or empty
        let summaryEmpty = false;
        try {
          const summaryObj = JSON.parse(entry.summary);
          summaryEmpty = !summaryObj.title || summaryObj.title === "Started Draft";
        } catch {
          summaryEmpty = !entry.summary || entry.summary.trim() === "";
        }
        return journalEmpty && summaryEmpty;
      }
      return false;
    });
    if (emptyClosedEntries.length > 0) {
      await Promise.all(emptyClosedEntries.map(entry =>
        prisma.entry.delete({ where: { id: entry.id } })
      ));
      // Re-fetch entries after deleting
      entries = await prisma.entry.findMany({
        where: {
          authorId: user.id,
          createdAt: {
            gte: weekStartDate!,
            lte: weekEndDate!,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }
  }
  return (
    <EntryProvider year={year} weekofyear={weekofyear}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <main className="flex flex-1 flex-col px-4 pt-10 xl:px-8">
            {children}
          </main>
        </div>
        <AppSideBar user={dbUser ? {
          id: dbUser.id,
          email: dbUser.email,
          preference: dbUser.preference ?? undefined,
        } : null} entries={entries} />
        <Toaster />
      </SidebarProvider>
    </EntryProvider>
  );
} 