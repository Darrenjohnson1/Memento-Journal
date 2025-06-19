"use client";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUpIcon, Loader2 } from "lucide-react";
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
  end.setHours(17, 0, 0, 0);

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

function NewDayJournal({ user, entry }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const entryExists = hasEntryToday(entry);
  console.log("entryExists:", entryExists);
  console.log("entry.isOpen:", entry?.isOpen);

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
    await createEntryAction(uuid, questionText);
    router.push(`plan/?entryId=${uuid}`);
  };

  const handleUpdateEntry = async () => {
    if (!user) return router.push("/login");
    setLoading(true);
    toast.success("Let's wrap up the day!", {
      description: "Updating today's journal entry",
    });
    // await followUpEntryAction(uuid, questionText);
    // router.push(`plan/?entryId=${uuid}`);
  };

  if (loading) return <LoadingState />;

  if (entryExists) {
    const now = new Date();
    const isAfterFive = now.getHours() >= 17;

    switch (entry?.isOpen) {
      case "open":
        return isAfterFive ? (
          <CompleteEntry timeLeft={timeLeft} />
        ) : (
          <IncompleteEntry entryId={entry.id} />
        );
      case "partial":
        return isAfterFive ? (
          <PartialEntry
            onSubmit={handleUpdateEntry}
            questionText={questionText}
            setQuestionText={setQuestionText}
            textareaRef={textareaRef}
          />
        ) : (
          <CompleteEntry timeLeft={timeLeft} />
        );
      default:
        return isAfterFive ? (
          <></>
        ) : (
          <PartialEntry
            onSubmit={handleNewEntry}
            questionText={questionText}
            setQuestionText={setQuestionText}
            textareaRef={textareaRef}
          />
        );
    }
  }

  return (
    <PreStartEntry
      onSubmit={handleNewEntry}
      questionText={questionText}
      setQuestionText={setQuestionText}
      textareaRef={textareaRef}
    />
  );
}

function IncompleteEntry({ entryId }: { entryId: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">Finish Planning Your Day.</h2>
      <h3 className="mt-3">
        You have an incomplete entry, wrap up planning to get insights.
      </h3>
      <Button asChild className="mt-10 w-20 self-center">
        <Link href={`plan/?entryId=${entryId}`} className="hidden sm:block">
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
}: {
  onSubmit: () => void;
  questionText: string;
  setQuestionText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
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
          onClick={onSubmit}
        >
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
      <h3 className="mt-5 w-fit self-end text-sm font-medium text-gray-500">
        {getFormattedDate()}
      </h3>
    </div>
  );
}

function PreStartEntry({
  onSubmit,
  questionText,
  setQuestionText,
  textareaRef,
}: any) {
  return (
    <div className="flex h-full w-full max-w-4xl flex-col">
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
      <h3 className="mt-5 w-fit self-end text-sm font-medium text-gray-500">
        {getFormattedDate()}
      </h3>
    </div>
  );
}

function CompleteEntry({ timeLeft }: { timeLeft: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">You're going to do great!</h2>
      <h3 className="mt-3">
        Come back in the evening to finish your journal and get insights on your
        day.
      </h3>
      <h3 className="mt-3 animate-pulse">{timeLeft}</h3>
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
