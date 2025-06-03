
import React from "react";
import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import JournalEntry from "@/components/JournalEntry";

async function page() {
  
  const user = await getUser();

  let entry: Entry | null = null;

  if (user) {
    entry = await prisma.entry.findFirst({
      where: {
        authorId: user.id,
        id: entryIdParam,
      },
    });
  }
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl justify-center gap-2">
        <JournalEntry entry={entry}/> 
      </div>
    </div>
  );
}

export default page;
