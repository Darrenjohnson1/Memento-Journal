import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import EntryTextInput from "@/components/EntryTextInput";
import { JournalMock } from "@/components/JournalMock";
import MockUps from "@/components/MockUps";
import NewDayCarousel from "@/components/NewDayCarousel";
import NewDayJournal from "@/components/NewDayJournal";
import NewEntryButton from "@/components/NewEntryButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { WeeklySentiment } from "@/components/WeeklySentiment";
import prisma from "@/db/prisma";
import { Entry } from "@prisma/client";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Funnel_Display } from "next/font/google";
import Link from "next/link";
import React from "react";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // choose the weights you want
  variable: "--font-funnel-display", // optional for Tailwind
});

async function HomePage({ searchParams }: Props) {
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
      <div className="mt-6 text-center">
        <Badge
          variant="secondary"
          className="mb-5 rounded-full border-1 border-gray-200 bg-white px-4 py-1.5 text-base font-medium"
        >
          🧠 AI Mindfulness Journal
        </Badge>
        <h1
          className="text-5xl font-semibold"
          style={{
            fontFamily: '"Funnel Display", sans-serif',
            fontWeight: 700,
          }}
        >
          Turn Down the Chatter,<br></br> Tune Into What Matters.
        </h1>
        <h2 className="pt-3 pb-6 text-xl font-semibold">
          The best insights come from within — we help you listen.
        </h2>

        <div className="mt-6 w-full max-w-4xl">
          <JournalMock />
        </div>
        <Button className="mt-12">
          <Link href="/sign-up">Try Now</Link>
          <ChevronRight />
        </Button>
      </div>
      <div className="mt-24 w-full max-w-4xl text-center">
        <MockUps />
        <Button className="mt-6">
          <Link href="/sign-up">View Demo</Link>
          <ChevronRight />
        </Button>
      </div>
      <footer className="mt-12 h-12 bg-transparent dark:bg-transparent">
        <div className="px-4 xl:px-6">
          <div className="flex h-[--footer-height] items-center justify-center">
            <div className="text-muted-foreground w-full text-center text-xs leading-loose sm:text-sm">
              Built by{" "}
              <a
                href="https://darrendigital.com/"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                DarrenDigital
              </a>
              .
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
