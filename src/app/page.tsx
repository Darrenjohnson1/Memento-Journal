import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import EntryTextInput from "@/components/EntryTextInput";
import NewDayCarousel from "@/components/NewDayCarousel";
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

  const entry = await prisma.entry.findUnique({
    where: { id: entryId, authorId: user?.id },
  });

  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl justify-end gap-2">
        <NewEntryButton user={user} />
      </div>
      <NewDayCarousel />
      {/* <EntryTextInput entryId={entryId} startingEntryText={entry?.text || ""} /> */}
    </div>
  );
}

export default HomePage;
