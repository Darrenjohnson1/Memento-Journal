import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import ClientCalendar from "@/components/ClientCalendar";
import EntryTextInput from "@/components/EntryTextInput";
import NewDayCarousel from "@/components/NewDayCarousel";
import NewDayJournal from "@/components/NewDayJournal";
import NewEntryButton from "@/components/NewEntryButton";
import { Calendar } from "@/components/ui/calendar";
import { Carousel } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { WeeklySentiment } from "@/components/WeeklySentiment";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import React from "react";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function Home({ searchParams }: Props) {
  const entryIdParam = (await searchParams).entryId;
  const user = await getUser();

  const entryId = Array.isArray(entryIdParam)
    ? entryIdParam![0]
    : entryIdParam || "";

  let entry: Entry | null = null;
  let weekEntry: Entry[] | null = null;

  try {
    if (user) {
      const startOfWindow = new Date();
      startOfWindow.setHours(7, 0, 0, 0); // 7:00 AM

      const endOfWindow = new Date();
      endOfWindow.setHours(23, 0, 0, 0); // 5:00 PM

      entry = await prisma.entry.findFirst({
        where: {
          authorId: user.id,
          createdAt: {
            gte: startOfWindow,
            lte: endOfWindow,
          },
        },
      });
      const endOfWindowWeek = new Date(); // now
      const startOfWindowWeek = new Date();
      startOfWindowWeek.setDate(endOfWindow.getDate() - 7); // 7 days ago from now

      weekEntry = await prisma.entry.findMany({
        where: {
          authorId: user.id,
          createdAt: {
            gte: startOfWindowWeek,
            lte: endOfWindowWeek,
          },
        },
      });
      console.log(weekEntry);
    }
  } catch (error: any) {
    if (error.code === "P1001") {
      console.log("Can't reach the database to authenticate user");
      return null; // or return an error UI
    }

    throw error;
  }
  console.log(entry);
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <ClientCalendar />
      <NewDayJournal user={user} entry={entry} />
      <Separator className="mt-5" />
      <div className="w-ful mt-6 max-w-4xl">
        {Array.isArray(weekEntry) && weekEntry.length > 0 ? (
          <WeeklySentiment entry={weekEntry} />
        ) : (
          <></>
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

      {/* <EntryTextInput entryId={entryId} startingEntryText={entry?.text || ""} /> */}
    </div>
  );
}

export default Home;
