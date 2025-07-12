import Header from "@/components/Header";
import React from "react";
import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import JournalEntry from "@/components/JournalEntry";
import { Separator } from "@/components/ui/separator";
import FollowUpButton from "@/components/FollowUpButton";
import { ArrowLeft } from "lucide-react";
import BackButton from "@/components/BackButton";
import JournalDeleteButton from "@/components/JournalDeleteButton";

// ISO week calculation
function getISOWeek(date: Date) {
  // removed, no longer needed
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function page({ searchParams }: Props) {
  const entryIdParam = (await searchParams).entryId;
  const user = await getUser();

  const entryId = Array.isArray(entryIdParam)
    ? entryIdParam![0]
    : entryIdParam || "";

  let entry: any;

  if (user) {
    entry = await prisma.entry.findFirst({
      where: {
        authorId: user.id,
        id: entryId,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        journalEntry: true,
        journalEntry2: true,
        userResponse: true,
        userResponse2: true,
        summary: true,
        isOpen: true,
        authorId: true,
        sentiment: true,
        tags: true,
        negativePhrases: true,
      },
    });
  }

  // Remove week/year logic

  return (
    <>
      <Header user={user} />
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-200 flex items-center justify-between px-6 py-4 rounded-b-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <BackButton />
          </div>
          <div className="text-right w-full">
            <h1 className="text-3xl font-medium">
              {entry?.createdAt.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h1>
          </div>
        </div>
      </div>
      <div className="flex h-full flex-col items-center gap-8 pt-8 pb-16 bg-background min-h-screen">
        <div className="flex w-full max-w-4xl flex-col justify-center gap-6 px-4">
          <JournalEntry entry={entry} />
        </div>
        {entry.append ? (
          <div className="bg-popover relative flex h-24 w-full max-w-4xl flex-col items-center justify-center border-b-1">
            {/* <FollowUpButton /> */}
          </div>
        ) : (
          <div className="bg-popover relative flex h-24 w-full max-w-4xl flex-col items-center justify-center gap-5 border-b-1">
            <p className="mt-5 text-lg"></p>
            {entry.append}
            {/* <FollowUpButton /> */}
          </div>
        )}
        {entry && (
          <div className="flex w-full max-w-4xl justify-center mt-12 px-4">
            <JournalDeleteButton entryId={entry.id} />
          </div>
        )}
      </div>
    </>
  );
}

export default page;
