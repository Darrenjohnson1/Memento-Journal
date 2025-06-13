"use client";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUpIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { createEntryAction } from "@/actions/entry";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "./ui/skeleton";

type Props = {
  user: User | null;
};

function NewDayJournal({ user }: Props) {
  const [questionText, setQuestionText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleClickNewEntryButton = async () => {
    if (!user) {
      router.push("/login");
      console.log("login");
    } else {
      setLoading(true);
      console.log("ran");
      const uuid = uuidv4();

      toast.success("Let's Get Ready For The Day", {
        description: "You have started a new journal entry",
      });
      await createEntryAction(uuid, questionText);
      router.push(`plan/?entryId=${uuid}`);
    }
  };

  const today: Date = new Date();
  const formatted = today.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <>
      {loading ? (
        <div className="align-center flex flex-col text-center">
          <h2 className="text-3xl font-semibold">Thanks for catching me up!</h2>
          <h3 className="mt-3 animate-pulse">
            Let me think of some good questions
          </h3>
        </div>
      ) : (
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
              placeholder="How I'm Feeling Now..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="placeholder:text-muted-foreground flex w-full resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ minHeight: "0", lineHeight: "normal" }}
              rows={1}
            />
            <Button
              type="button"
              className="ml-auto size-8 rounded-full"
              onClick={handleClickNewEntryButton}
            >
              <ArrowUpIcon className="text-background" />
            </Button>
          </div>
          <h3 className="mt-5 w-fit self-end text-sm font-medium text-gray-500">
            {formatted}
          </h3>
        </div>
      )}
    </>
  );
}

export default NewDayJournal;
