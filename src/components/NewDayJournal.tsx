"use client";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUpIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Entry, User } from "@prisma/client";
import { createEntryAction, followUpEntryAction } from "@/actions/entry";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "./ui/skeleton";
import prisma from "@/db/prisma";
import Link from "next/link";

type Props = {
  user: User | null;
  entry: Entry | null;
  forceCountdown?: boolean;
};

function hasEntryToday(entry: Entry | null) {
  if (!entry) return false;
  const updated = new Date(entry.updatedAt);
  const now = new Date();

  // Start of today at 7 AM
  const start = new Date(now);
  start.setHours(7, 0, 0, 0);

  // End of today at 5 PM
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);

  return updated >= start && updated <= end;
}

function getFormattedDate() {
  return new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function sentimentToColor(sentiment: number): string {
  if (sentiment >= 70) return "#16a34a"; // green
  if (sentiment >= 40) return "#eab308"; // yellow
  return "#ef4444"; // red
}

function NewDayJournal({ user, entry, forceCountdown = false, onPrev, onNext, showPrev, showNext }: Props & {
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}) {
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const entryExists = hasEntryToday(entry);

  const now = new Date();
  const isAfterFive = now.getHours() >= 17;

  console.log('NewDayJournal debug:', { entry, entryExists, isAfterFive, forceCountdown });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const fivePm = new Date();
      fivePm.setHours(17, 0, 0, 0);

      if (now >= fivePm) {
        setTimeLeft("Let's Wrap Up");
        clearInterval(interval);
      } else {
        const diff = fivePm.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNewEntry = async () => {
    if (!user) return router.push("/login");
    if (entryExists) return;
    setLoading(true);
    const uuid = uuidv4();
    toast.success("Let's get ready for the day!", {
      description: "You have started a new journal entry",
    });
    await createEntryAction(uuid, questionText, new Date());
    router.push(`/plan/?entryId=${uuid}`);
  };

  const handleUpdateEntry = async (entry?: Entry) => {
    if (!user) return router.push("/login");
    setLoading(true);
    // Always use the current day's entry id
    const journalID = entry && entry.id ? entry.id : (entryExists && entry ? entry.id : null);
    if (!journalID) {
      setLoading(false);
      toast.error("No entry found for today.");
      return;
    }
    toast.success("Let's wrap up the day!", {
      description: "Updating today's journal entry",
    });
    await followUpEntryAction(questionText, journalID, new Date());
    router.push(`/follow-up?entryId=${journalID}`);
  };

  if (loading) return <LoadingState />;

  if (forceCountdown) {
    return <CompleteEntry timeLeft={timeLeft} entryId={entry?.id ?? ""} />;
  }

  // Only show countdown if there is a partial entry for today
  if (entryExists && entry?.isOpen === "partial" && !isAfterFive) {
    return <CompleteEntry timeLeft={timeLeft} entryId={entry?.id ?? ""} />;
  }

  // Nighttime state for partial_open after 5pm
  if (entryExists && entry?.isOpen === "partial_open" && isAfterFive) {
    return (
      <div className="align-center flex flex-col text-center">
        <h2 className="text-3xl font-semibold">Unfinished Draft</h2>
        <h3 className="mt-3">You have a journal draft from earlier today. Finish it to get your insights!</h3>
        <Button asChild className="mt-10 w-32 self-center">
          <Link href={`/follow-up?entryId=${entry.id}`}>Continue Draft</Link>
        </Button>
      </div>
    );
  }

  // All other cases: show the appropriate entry UI
  if (entryExists) {
    const sentiment = entry && typeof entry.sentiment === 'number' ? entry.sentiment : null;
    switch (entry?.isOpen) {
      case "open":
      case "partial_open":
        return (
          <>
            <div className="w-full max-w-4xl mx-auto">
              <IncompleteEntry entryId={entry.id} />
            </div>
          </>
        );
      case "partial":
        return (
          <>
            <div className="w-full max-w-4xl mx-auto">
              <PartialEntry
                onSubmit={() => handleUpdateEntry(entry)}
                questionText={questionText}
                setQuestionText={setQuestionText}
                textareaRef={textareaRef}
                entry={entry}
              />
            </div>
          </>
        );
      case "closed":
        return <EndDay entryId={entry.id} />;
    }
  } else {
    return isAfterFive ? (
      <PartialEntry
        onSubmit={() => handleUpdateEntry(entry)}
        questionText={questionText}
        setQuestionText={setQuestionText}
        textareaRef={textareaRef}
        entry={entry}
      />
    ) : (
      <PreStartEntry
        onSubmit={handleNewEntry}
        questionText={questionText}
        setQuestionText={setQuestionText}
        textareaRef={textareaRef}
        entry={entry}
      />
    );
  }
}

function IncompleteEntry({ entryId }: { entryId: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">Finish Planning Your Day.</h2>
      <h3 className="mt-3">
        You have an incomplete entry, wrap up planning to get insights.
      </h3>
      <Button asChild className="mt-10 w-20 self-center">
        <Link href={`/plan/?entryId=${entryId}`} className="hidden sm:block">
          Finish
        </Link>
      </Button>
    </div>
  );
}

function PartialEntry({
  onSubmit,
  questionText,
  setQuestionText,
  textareaRef,
  entry,
}: {
  onSubmit: (entry?: Entry) => void;
  questionText: string;
  setQuestionText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  entry?: Entry | null;
}) {
  return (
    <div className="flex h-full w-full max-w-4xl flex-col">
      <h1 className="w-auto text-2xl font-bold">
        Welcome back! How was your day?
      </h1>
      <div
        className="mt-5 flex min-h-40 w-full cursor-text flex-col justify-between rounded-lg border p-4"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm feeling now..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="placeholder:text-muted-foreground flex w-full resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          className="ml-auto size-8 rounded-full"
          onClick={() => onSubmit()}
        >
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
      <div className="mt-5 w-fit self-end flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">{getFormattedDate()}</span>
      </div>
    </div>
  );
}

function PreStartEntry({
  onSubmit,
  questionText,
  setQuestionText,
  textareaRef,
  entry,
}: {
  onSubmit: () => void;
  questionText: string;
  setQuestionText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  entry?: Entry | null;
}) {
  return (
    <div className="flex w-full max-w-4xl flex-col">
      <h1 className="w-auto text-2xl font-bold">
        What does your day look like?
      </h1>
      <div
        className="mt-5 flex min-h-40 w-full cursor-text flex-col justify-between rounded-lg border p-4"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm feeling now..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="placeholder:text-muted-foreground flex w-full resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          className="ml-auto size-8 rounded-full"
          onClick={onSubmit}
        >
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
      <div className="mt-5 w-fit self-end flex items-center gap-2">
        {entry && typeof entry.sentiment === 'number' && (
          <span
            className="inline-block h-3 w-3 rounded-full mr-1"
            style={{ backgroundColor: sentimentToColor(entry.sentiment) }}
            title={`Positivity: ${entry.sentiment}`}
          />
        )}
        <span className="text-sm font-medium text-gray-500">{getFormattedDate()}</span>
      </div>
    </div>
  );
}

function CompleteEntry({ timeLeft, entryId }: { timeLeft: string, entryId: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">You're going to do great!</h2>
      <h3 className="mt-3">
        Come back in the evening to finish your journal and get insights on your
        day.
      </h3>
      <h3 className="mt-3 animate-pulse">{timeLeft}</h3>
      <Button asChild className="mt-10 w-32 self-center">
        <Link href={`/journal/?entryId=${entryId}`} className="hidden sm:block">
          Review Today
        </Link>
      </Button>
    </div>
  );
}

function EndDay({ entryId }: { entryId: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">All Done For Today!</h2>
      <h3 className="mt-3">
        Let's talk in the morning and plan for the day! Until then review today.
      </h3>
      <Button asChild className="mt-10 w-20 self-center">
        <Link href={`/journal/?entryId=${entryId}`} className="hidden sm:block">
          Review
        </Link>
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">Thanks for catching me up!</h2>
      <h3 className="mt-3 animate-pulse">
        Let me think of some good questions
      </h3>
    </div>
  );
}

export default NewDayJournal;
