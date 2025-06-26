"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const promptQuestions = [
  "Feeling motivated today — gym and a call to mom on the list.",
  "Excited for dinner with friends after a rough week.",
  "Work stress has my mind racing since morning.",
  "Groggy start — fighting off brain fog.",
  "Deadline ahead, but feeling calm and ready to focus.",
];

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

export function JournalMock() {
  const [questionText, setQuestionText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [typingPrompt, setTypingPrompt] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const promptTypingInterval = useRef<NodeJS.Timeout | null>(null);

  // Typewriter animation for prompt
  const typePrompt = (fullText: string) => {
    let i = 0;
    clearInterval(promptTypingInterval.current!);
    promptTypingInterval.current = setInterval(() => {
      if (i > fullText.length) {
        clearInterval(promptTypingInterval.current!);
        return;
      }
      setQuestionText(fullText.slice(0, i));
      i++;
    }, 40); // Typing speed
  };

  // Cycle prompts every 7s if not typing
  useEffect(() => {
    if (isUserTyping) return;

    const interval = setInterval(() => {
      const nextIndex = (promptIndex + 1) % promptQuestions.length;
      setPromptIndex(nextIndex);
      typePrompt(promptQuestions[nextIndex]);
    }, 7000);

    return () => clearInterval(interval);
  }, [promptIndex, isUserTyping]);

  // Resume cycling after 10s of inactivity
  const handleUserTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setQuestionText(val);

    if (!isUserTyping) {
      setIsUserTyping(true);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      if (val.trim() === "") {
        setIsUserTyping(false);
        typePrompt(promptQuestions[promptIndex]);
      }
    }, 10000);
  };

  const handleSubmit = () => {
    console.log("Submitted:", questionText);
    setQuestionText("");
    setIsUserTyping(false);
    typePrompt(promptQuestions[promptIndex]);
  };

  // On mount, show first prompt
  useEffect(() => {
    typePrompt(promptQuestions[0]);
  }, []);

  return (
    <div className="flex w-full flex-col">
      {/* <h2 className="w-auto text-2xl font-bold">
        What does your day look like?
      </h2> */}

      <div
        className="mt-5 flex min-h-40 w-full cursor-text flex-col justify-between rounded-lg border p-4"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm feeling now..."
          value={questionText}
          onChange={handleUserTyping}
          className="placeholder:text-muted-foreground flex w-full resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          className="ml-auto size-8 rounded-full"
          onClick={handleSubmit}
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
