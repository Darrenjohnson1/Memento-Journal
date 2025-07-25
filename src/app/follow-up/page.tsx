import { getUser } from "@/auth/server";
import NewDayCarousel from "@/components/NewDayCarousel";
import PartialDayCarousel from "@/components/PartialDayCarousel";
import prisma from "@/db/prisma";
import React from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <Header user={user} />
      <div className="flex w-full max-w-4xl mx-auto mt-2 mb-4">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
      <div className="flex h-full flex-col items-center gap-4">
        <div className="flex w-full max-w-4xl justify-center gap-2">
          <PartialDayCarousel entry={entry} />
        </div>
      </div>
    </>
  );
}

export default page;
