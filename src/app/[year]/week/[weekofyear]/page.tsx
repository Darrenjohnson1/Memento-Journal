import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import NewDayJournal from "@/components/NewDayJournal";
import { Separator } from "@/components/ui/separator";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import { WeeklySentiment } from "@/components/WeeklySentiment";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  params: { year: string; weekofyear: string };
};

function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1); // Monday
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  ISOweekStart.setHours(0, 0, 0, 0);
  return ISOweekStart;
}

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
      console.log(weekEntry);
    }
  } catch (error: any) {
    if (error.code === "P1001") {
      console.error("Can't reach the database to authenticate user.");
      return <div>Database connection failed.</div>;
    }
    throw error;
  }

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <WeeklyCalendar
        entries={weekEntry}
        initialWeek={week}
        initialYear={year}
      />
      <NewDayJournal user={user} entry={entry} />

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
        <AskAIButton user={user} />
      </div>
    </div>
  );
}

export default Week;
