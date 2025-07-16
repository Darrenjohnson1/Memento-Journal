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
    <Card className="mx-auto w-full max-w-xl flex flex-col h-[600px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Plan Your Day</CardTitle>
        <CardDescription className="text-xl">Answer a few questions to help plan your day. Your responses will guide your journal and insights.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-6 overflow-auto pb-32">
        {/* Chat bubbles: alternate bot/user, same style but different alignment/colors */}
        <div className="flex flex-col gap-2 mt-2">
          {answers.map((ans, idx) => (
            idx < currentIndex && ans ? (
              <React.Fragment key={idx}>
                {/* Bot question bubble */}
                <div className="self-start max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700 mr-auto mb-1 shadow">
                  {questions[idx].question}
                </div>
                {/* User answer bubble */}
                <div className="self-end max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900 ml-auto mb-2 shadow">
                  {ans}
                </div>
              </React.Fragment>
            ) : null
          ))}
          {/* Current question bubble (unless finished) */}
          {currentIndex < questions.length && (
            <div className="self-start max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700 mr-auto mb-1 shadow">
              {questions[currentIndex].question}
            </div>
          )}
          {/* Thinking bubble */}
          {thinking && (
            <div className="self-start max-w-[60%] animate-pulse rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-600 mr-auto mb-1 shadow">
              Thinking...
            </div>
          )}
        </div>
      </CardContent>
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
      {/* Progress bar at the very bottom of the card */}
      <div className="w-full px-4 pb-2">
        <Progress value={progress} className="mt-2" />
      </div>
    </Card>
  );
}

export default NewDayCarousel;
