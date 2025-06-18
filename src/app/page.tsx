import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import EntryTextInput from "@/components/EntryTextInput";
import NewDayCarousel from "@/components/NewDayCarousel";
import NewDayJournal from "@/components/NewDayJournal";
import NewEntryButton from "@/components/NewEntryButton";
import { Carousel } from "@/components/ui/carousel";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import React from "react";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function HomePage({ searchParams }: Props) {
  const entryIdParam = (await searchParams).entryId;
  const user = await getUser();

  const entryId = Array.isArray(entryIdParam)
    ? entryIdParam![0]
    : entryIdParam || "";

  let entry: Entry | null = null;

  try {
    if (user) {
      const startOfWindow = new Date();
      startOfWindow.setHours(7, 0, 0, 0); // 7:00 AM

      const endOfWindow = new Date();
      endOfWindow.setHours(17, 0, 0, 0); // 5:00 PM

      entry = await prisma.entry.findFirst({
        where: {
          authorId: user.id,
          createdAt: {
            gte: startOfWindow,
            lte: endOfWindow,
          },
        },
      });
    }
  } catch (error: any) {
    if (error.code === "P1001") {
      console.log("Can't reach the database to authenticate user");
      return null; // or return an error UI
    }

    throw error;
  }

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <NewDayJournal user={user} entry={entry} />
      {/* <EntryTextInput entryId={entryId} startingEntryText={entry?.text || ""} /> */}
    </div>
  );
}

export default HomePage;
