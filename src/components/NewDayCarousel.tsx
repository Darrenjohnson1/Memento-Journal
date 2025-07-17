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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

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
  const chatContentRef = useRef<HTMLDivElement>(null);

  const progress = ((currentIndex) / questions.length) * 100;

  useEffect(() => {
    setQuestionText(answers[currentIndex] || "");
  }, [currentIndex]);

  // Scroll to bottom only when a new answer is added or currentIndex increases
  const prevAnswersLength = useRef(answers.length);
  const prevCurrentIndex = useRef(currentIndex);
  useEffect(() => {
    if (
      answers.length > prevAnswersLength.current ||
      currentIndex > prevCurrentIndex.current
    ) {
      chatContentRef.current?.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevAnswersLength.current = answers.length;
    prevCurrentIndex.current = currentIndex;
  }, [answers.length, currentIndex]);

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
    <div className="mx-auto w-full max-w-xl">
      <div className="text-center mt-4 mb-2">
        <div className="text-2xl font-bold">Plan Your Day</div>
        <div className="text-xl text-muted-foreground">Answer a few questions to help plan your day. Your responses will guide your journal and insights.</div>
      </div>
      <div className="flex flex-col gap-2 overflow-auto pb-[195px]" style={{minHeight: 0}}>
        <div className="flex flex-col gap-2 mt-2" ref={chatContentRef} style={{overflowY: 'auto', minHeight: 0}}>
          {answers.map((ans, idx) => (
            idx < currentIndex && ans ? (
              <React.Fragment key={idx}>
                {/* Bot question bubble */}
                <div className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700">
                  {questions[idx].question}
                </div>
                {/* User answer bubble */}
                <div className="ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900">
                  {ans}
                </div>
              </React.Fragment>
            ) : null
          ))}
          {/* Current question bubble (unless finished) */}
          {currentIndex < questions.length && (
            <div className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700">
              {questions[currentIndex].question}
            </div>
          )}
          {/* Thinking bubble */}
          {thinking && (
            <div className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700 animate-pulse">
              Thinking...
            </div>
          )}
        </div>
      </div>
      {/* Input area at the bottom, sticky/fixed */}
      <div
        className="fixed bottom-0 left-0 w-full max-w-xl mx-auto flex cursor-text flex-col rounded-t-lg border-t bg-background p-4 z-50"
        style={{ right: 0 }}
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm Feeling Now..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ minHeight: "3rem", lineHeight: "normal" }}
          disabled={thinking}
        />
        <Button className="ml-auto size-8 rounded-full mt-2" onClick={handleSubmit} disabled={thinking}>
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
      {/* Progress bar at the very bottom */}
      <div className="w-full px-4 pb-2">
        <Progress value={progress} className="mt-2" />
      </div>
    </div>
  );
}

export default NewDayCarousel;
