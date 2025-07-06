import Header from "@/components/Header";
import { getUser } from "@/auth/server";
import NewDayCarousel from "@/components/NewDayCarousel";
import prisma from "@/db/prisma";
import React from "react";

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

  

  return (
    <>
      <Header />
      <div className="flex h-full flex-col items-center gap-4">
        <div className="flex w-full max-w-4xl justify-center gap-2">
          <NewDayCarousel entry={entry} />
        </div>
      </div>
    </>
  );
}

export default page;
