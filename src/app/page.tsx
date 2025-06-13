import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import EntryTextInput from "@/components/EntryTextInput";
import NewDayCarousel from "@/components/NewDayCarousel";
import NewDayJournal from "@/components/NewDayJournal";
import NewEntryButton from "@/components/NewEntryButton";
import { Carousel } from "@/components/ui/carousel";
import prisma from "@/db/prisma";
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

  try {
    const entry = await prisma.entry.findUnique({
      where: { id: entryId, authorId: user?.id },
    });
  } catch (error: any) {
    if (error.code === "P1001") {
      // P1001: Can't reach the database
      return <p>Can't reach the database to authenticate user.</p>;
    }

    // Re-throw or handle other errors
    throw error;
  }

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <NewDayJournal user={user} />
      {/* <EntryTextInput entryId={entryId} startingEntryText={entry?.text || ""} /> */}
    </div>
  );
}

export default HomePage;
