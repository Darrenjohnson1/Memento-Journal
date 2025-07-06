"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon } from "lucide-react";
import { createEntryAction } from "@/actions/entry";
import { Entry, User } from "@prisma/client";

type Props = {
  user: User | null;
  entry: Entry | null;
};

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isPastFivePM(date: Date) {
  const fivePm = new Date(date);
  fivePm.setHours(17, 0, 0, 0); // 5:00 PM on the date of the entry
  const now = new Date();
  return now >= fivePm;
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

function PartialDayJournal({ user, entry }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const entryDate = entry ? new Date(entry.updatedAt) : null;
  const now = new Date();

  const entryExistsToday = entryDate ? isSameDay(entryDate, now) : false;
  const pastFiveOnEntryDay = entryDate ? isPastFivePM(entryDate) : false;

  // Timer for time left until 5 PM if before 5 PM today
  useEffect(() => {
    if (!entryDate || pastFiveOnEntryDay) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const fivePm = new Date(entryDate);
      fivePm.setHours(17, 0, 0, 0);

      if (now >= fivePm) {
        setTimeLeft("It's after 5 PM now, you can update your journal!");
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
  }, [entryDate, pastFiveOnEntryDay]);

  const handleNewEntry = async () => {
    if (!user) return router.push("/login");
    if (entryExistsToday) return;
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
      const uuid = uuidv4();
      toast.success("Let's wrap up the day!", {
        description: "Updating today's journal entry",
      });
      await createEntryAction(uuid, questionText);
      router.push(`plan/?entryId=${uuid}`);
    };

  if (loading) return <LoadingState />;

  // Only show the timer if the entry is for today, it's before 5pm, and the entry is not closed
  if (entryExistsToday && !pastFiveOnEntryDay && entry?.isOpen !== "closed") {
    return <CompleteEntry timeLeft={timeLeft} />;
  }

  if (entry?.isOpen === "partial") {
    return (
      <PartialEntry
        onSubmit={handleUpdateEntry}
        questionText={questionText}
        setQuestionText={setQuestionText}
        textareaRef={textareaRef}
      />
    );
  }

  // Default fallback UI
  return <CompleteEntry timeLeft={timeLeft} />;
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
      <h1 className="w-auto text-2xl font-bold text-center">
        Wrap Up The Day
      </h1>
      <div
        className="mt-5 flex min-h-40 w-full cursor-text flex-col justify-between rounded-lg border p-4"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="What happened today..."
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
      {/* <h3 className="mt-5 w-fit self-end text-sm font-medium text-gray-500">
        {getFormattedDate()}
      </h3> */}
    </div>
  );
}

function CompleteEntry({ timeLeft }: { timeLeft: string }) {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">You're going to do great!</h2>
      <h3 className="mt-3">
        Come back in the evening to finish your journal and get insights on your day.
      </h3>
      {timeLeft && <h3 className="mt-3 animate-pulse">{timeLeft}</h3>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="align-center flex flex-col text-center">
      <h2 className="text-3xl font-semibold">Thanks for catching me up!</h2>
      <h3 className="mt-3 animate-pulse">Let me think of some good questions</h3>
    </div>
  );
}

export default PartialDayJournal;