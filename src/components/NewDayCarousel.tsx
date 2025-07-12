"use client";

import React, { useEffect, useRef, useState } from "react";
// Remove carousel imports
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUpIcon } from "lucide-react";
import useEntry from "@/hooks/useEntry";
import { AISummaryAction, updateEntryAction } from "@/actions/entry";
import { useRouter, useSearchParams } from "next/navigation";
import JournalEntry from "./JournalEntry";

export function NewDayCarousel({ entry }: any) {
  if (!entry || !entry.userResponse) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Entry not found or not generated. Refresh to try again.</p>
      </div>
    );
  }
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const entryIdParam = useSearchParams().get("entryId") || "";

  // Parse structured question data from entry
  const questions: { question: string; inputType: number }[] = JSON.parse(
    entry.userResponse,
  );

  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [questionText, setQuestionText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [thinking, setThinking] = useState(false);
  const { entryText, setEntryText } = useEntry();
  const router = useRouter();

  const progress = ((currentIndex) / questions.length) * 100;

  useEffect(() => {
    setQuestionText(answers[currentIndex] || "");
  }, [currentIndex]);

  const handleSubmit = () => {
    if (!questionText.trim() || thinking) return;

    // Create updated answers array with the current questionText
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = questionText;
    setAnswers(updatedAnswers);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        const questionsWithAnswers = Object.fromEntries(
          questions.map((q, index) => [q.question, updatedAnswers[index]])
        );
        AISummaryAction(questionsWithAnswers, entry.journalEntry).then(
          (summary) => {
            if (typeof summary === "string") {
              updateEntryAction(entryIdParam, questionsWithAnswers, summary);
            } else {
              updateEntryAction(
                entryIdParam,
                questionsWithAnswers,
                "Error summarizing entry."
              );
            }
            router.push(`journal/?entryId=${entryIdParam}`);
          }
        );
      }
      setQuestionText("");
    }, 1000); // 1s thinking delay
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      <div className="flex flex-col gap-2 mt-6">
        {/* Chat bubbles: alternate bot/user, same style but different alignment/colors */}
        {/* Show all previous Q&A pairs */}
        {answers.map((ans, idx) => (
          idx < currentIndex && ans ? (
            <React.Fragment key={idx}>
              {/* Bot question bubble */}
              <div className="self-start max-w-[80%] rounded-2xl bg-gray-100 px-5 py-3 text-gray-900 shadow mb-1">
                {questions[idx].question}
              </div>
              {/* User answer bubble */}
              <div className="self-end max-w-[80%] rounded-2xl bg-primary text-white px-5 py-3 shadow mb-2">
                {ans}
              </div>
            </React.Fragment>
          ) : null
        ))}
        {/* Current question bubble (unless finished) */}
        {currentIndex < questions.length && !thinking && (
          <div className="self-start max-w-[80%] rounded-2xl bg-gray-100 px-5 py-3 text-gray-900 shadow mb-1">
            {questions[currentIndex].question}
          </div>
        )}
        {/* Thinking bubble */}
        {thinking && (
          <div className="self-start max-w-[60%] rounded-2xl bg-gray-200 px-5 py-3 text-gray-500 italic shadow mb-1 animate-pulse">
            Thinking...
          </div>
        )}
      </div>
      {/* Chat input area */}
      <div
        className="mt-4 flex cursor-text flex-col rounded-lg border p-4 bg-white"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm Feeling Now..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground w-full resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ minHeight: "3rem", lineHeight: "normal" }}
          disabled={thinking}
        />
        <Button className="ml-auto size-8 rounded-full mt-2" onClick={handleSubmit} disabled={thinking}>
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
      <Progress value={progress} className="mt-4" />
    </div>
  );
}

export default NewDayCarousel;
