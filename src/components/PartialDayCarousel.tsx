"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ArrowUpIcon } from "lucide-react";
import useEntry from "@/hooks/useEntry";
import {
  AISummaryAction,
  updateEntryAction,
  updateFollowUpEntryAction,
} from "@/actions/entry";
import { useRouter, useSearchParams } from "next/navigation";
import JournalEntry from "./JournalEntry";

export function PartialDayCarousel({ entry }: any) {
  if (!entry || !entry.userResponse2) {
    console.log(entry);
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
    entry.userResponse2,
  );

  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill(""),
  );
  const [questionText, setQuestionText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const { entryText, setEntryText } = useEntry();
  const router = useRouter();

  const progress = ((currentIndex + 0) / questions.length) * 100;

  useEffect(() => {
    setQuestionText(answers[currentIndex] || "");
  }, [currentIndex]);

  const handleNext = () => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = questionText;
      return newAnswers;
    });
    carouselApi?.scrollNext();
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = questionText;
      return newAnswers;
    });
    carouselApi?.scrollPrev();
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (!questionText.trim()) return;

    // Create updated answers array with the current questionText
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = questionText;
    setAnswers(updatedAnswers); // still set state as well

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      carouselApi?.scrollNext();
    } else {
      const questionsWithAnswers = Object.fromEntries(
        questions.map((q, index) => [q.question, updatedAnswers[index]]),
      );

      AISummaryAction(questionsWithAnswers, entry.journalEntry).then(
        (summary) => {
          if (typeof summary === "string") {
            updateFollowUpEntryAction(
              entryIdParam,
              questionsWithAnswers,
              summary,
            );
          } else {
            updateFollowUpEntryAction(
              entryIdParam,
              questionsWithAnswers,
              "Error summarizing entry.",
            );
          }
          router.push(`journal/?entryId=${entryIdParam}`);
        },
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-xs sm:max-w-sm mx-auto">
      <Carousel
        opts={{ watchDrag: false }}
        setApi={setCarouselApi}
        className="w-full"
      >
        <CarouselContent style={{ userSelect: "none" }}>
          {questions.map((q, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent
                    className="flex flex-col justify-center p-4 sm:p-6 min-h-[180px] sm:aspect-square"
                  >
                    <h1 className="pb-3 text-lg sm:text-2xl font-semibold">
                      {index + 1}.
                    </h1>
                    <div className="break-words text-base sm:text-2xl font-semibold">
                      {q.question}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious onClick={handlePrevious} />
        <CarouselNext onClick={handleNext} />
      </Carousel>

      <Progress value={progress} className="mt-10" />

      <div
        className="mt-10 flex cursor-text flex-col rounded-lg border p-4"
        onClick={() => textareaRef.current?.focus()}
      >
        <Textarea
          ref={textareaRef}
          placeholder="How I'm Feeling Now..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="placeholder:text-muted-foreground w-full resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ minHeight: "3rem", lineHeight: "normal" }}
        />
        <Button className="ml-auto size-8 rounded-full" onClick={handleSubmit}>
          <ArrowUpIcon className="text-background" />
        </Button>
      </div>
    </div>
  );
}

export default PartialDayCarousel;
