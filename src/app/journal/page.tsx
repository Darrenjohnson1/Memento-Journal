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
    });
  }

  // Remove week/year logic

  return (
    <>
      <Header />
      <div className="flex h-full flex-col items-center gap-4">
        <div className="bg-popover relative flex w-full max-w-4xl items-center justify-between border-b-1 pb-6">
          <div className="flex items-center gap-2">
            {/* Simple back button using router.back() */}
            <BackButton />
            <h1 className="text-3xl font-medium">
              {entry?.createdAt.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h1>
          </div>
          {entry && <JournalDeleteButton entryId={entry.id} />}
          {/* <FollowUpButton /> */}
        </div>
        <div className="flex w-full max-w-4xl flex-col justify-center gap-2">
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
      </div>
    </>
  );
}

export default page;
