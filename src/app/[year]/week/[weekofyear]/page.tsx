import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import NewDayJournal from "@/components/NewDayJournal";
import { Separator } from "@/components/ui/separator";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { WeeklySentiment } from "@/components/WeeklySentiment";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import { getDateOfISOWeek } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: { year: string; weekofyear: string };
};

async function Week({ searchParams, params }: Props) {
  const query = await searchParams;
  const user = await getUser();

  const entryIdParam = query.entryId;
  const entryId = Array.isArray(entryIdParam)
    ? entryIdParam[0]
    : entryIdParam || "";

  const week = parseInt(params.weekofyear, 10);
  const year = parseInt(params.year, 10);

  if (isNaN(week) || isNaN(year)) {
    return <div>Invalid week or year in URL.</div>;
  }

  const weekStartDate = getDateOfISOWeek(week, year);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  let entry: Entry | null = null;
  let weekEntry: Entry[] = [];

  try {
    if (user) {
      // Entry for today (between 7am and midnight)
      const today = new Date();
      const startOfWindow = new Date(today);
      startOfWindow.setHours(7, 0, 0, 0);

      const endOfWindow = new Date(today);
      endOfWindow.setHours(23, 59, 59, 999);

      entry = await prisma.entry.findFirst({
        where: {
          authorId: user.id,
          createdAt: {
            gte: startOfWindow,
            lte: endOfWindow,
          },
        },
      });

      // Entries for the whole week
      weekEntry = await prisma.entry.findMany({
        where: {
          authorId: user.id,
          createdAt: {
            gte: weekStartDate,
            lte: weekEndDate,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }
  } catch (error: any) {
    if (error.code === "P1001") {
      console.error("Can't reach the database to authenticate user.");
      return <div>Database connection failed.</div>;
    }
    throw error;
  }

  // Convert createdAt/updatedAt to string for WeeklyCalendar
  const weekEntryStringDates = weekEntry.map(e => {
    if (!e) return e;
    let summaryObj = null;
    try { summaryObj = e.summary ? JSON.parse(e.summary) : null; } catch { summaryObj = null; }
    return {
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      summary: summaryObj,
    };
  });
  const entryStringDates = entry ? {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    summary: (() => { try { return entry.summary ? JSON.parse(entry.summary) : null; } catch { return null; } })(),
  } : entry;

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <WeeklyCalendar
        entries={weekEntryStringDates}
        initialWeek={week}
        initialYear={year}
        user={user}
        entry={entryStringDates}
      />

      <Separator className="mt-5" />

      <div className="mt-6 w-full max-w-4xl">
        {weekEntry.length > 0 ? (
          <WeeklySentiment entry={weekEntry} />
        ) : (
          <p className="text-muted-foreground text-center">
            No entries this week.
          </p>
        )}
      </div>

      <Separator className="mt-5" />

      <div className="mt-6 text-center">
        <h2 className="text-3xl font-semibold">Discover Insights</h2>
        <h3 className="pt-3 pb-6">
          Ask ChatterBox about the patterns that shape your week.
        </h3>
        <AskAIButton user={user} weekEntries={weekEntryStringDates} />
      </div>
    </div>
  );
}

export default Week;
