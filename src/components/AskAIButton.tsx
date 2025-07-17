"use client";

import { User } from "@supabase/supabase-js";
import React, { Fragment, useRef, useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon } from "lucide-react";
import { AskAIAboutEntryAction } from "@/actions/entry";
import "@/styles/ai-response.css";
import { Separator } from "./ui/separator";

type Props = {
  user: User | null;
  weekEntries?: any[];
};

function AskAIButton({ user, weekEntries }: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);

  const phrases = [
    "What are you curious about?",
    "Curious about anything recently?",
    "I know about you. Ask.",
    "I'm here if you need me.",
    "What would you like to know?",
  ];
  const [randomPhrase, setRandomPhrase] = useState(phrases[0]);

  const insightfulQuestions = [
  "Which day was I most positive this week?",
  "What do my mood trends look like lately?",
  "How do my entries this week compare to last week?",
  "Which words have I been using the most in my journal?",
  "Is there a pattern to my most productive days?",
  "Did my mood improve as the week went on?",
  "What topics have I written about most this week?",
  "What was my average sentiment score for the week?",
  "Is there a connection between my sleep and my mood this week?",
];

  const [suggestedQuestion, setSuggestedQuestion] = useState(insightfulQuestions[0]);

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!user) {
      router.push("/");
    } else {
      if (isOpen) {
        setQuestionText("");
        setQuestions([]);
        setResponses([]);
        setSuggestedQuestion(insightfulQuestions[Math.floor(Math.random() * insightfulQuestions.length)]);
      }
      setOpen(isOpen);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleClickInput = () => {
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!questionText.trim()) return;
    const newQuestions = [suggestedQuestion, questionText, ...questions];
    setQuestions([questionText, ...questions]);
    setQuestionText("");
    setTimeout(scrollToBottom, 100);

    startTransition(async () => {
      const response = await AskAIAboutEntryAction(newQuestions, responses, weekEntries);
      console.log("AI response:", response);
      if (typeof response === "string") {
        setResponses((prev) => [response, ...prev]);
      } else {
        setResponses((prev) => ["Null Response", ...prev]);
      }
      console.log(response);
      setTimeout(scrollToBottom, 100);
    });
  };

  const scrollToBottom = () => {
    contentRef.current?.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleGetAnotherQuestion = () => {
    let next;
    do {
      next = insightfulQuestions[Math.floor(Math.random() * insightfulQuestions.length)];
    } while (next === suggestedQuestion && insightfulQuestions.length > 1);
    setSuggestedQuestion(next);
    setQuestionText(next); // Populate the textarea with the suggestion
  };

  // Only scroll to bottom when a new message is added
  const prevQuestionsLength = useRef(questions.length);
  const prevResponsesLength = useRef(responses.length);
  useEffect(() => {
    if (
      questions.length > prevQuestionsLength.current ||
      responses.length > prevResponsesLength.current
    ) {
      scrollToBottom();
    }
    prevQuestionsLength.current = questions.length;
    prevResponsesLength.current = responses.length;
  }, [questions.length, responses.length]);

  return (
    <Drawer open={open} onOpenChange={handleOnOpenChange}>
      <DrawerTrigger asChild>
        <Button className="w-full bg-black text-white rounded-xl py-4 text-lg font-semibold shadow hover:bg-gray-900 transition-colors">Ask ChatterBox</Button>
      </DrawerTrigger>
      <DrawerContent className="custom-scrollbar flex h-[85vh] max-w-4xl flex-col overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Chat with your AI assistant</DrawerTitle>
          <DrawerDescription>
            Talk with your journal and discover insights using AI.
          </DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 flex flex-col gap-8 pb-[195px] mx-2 md:mx-4" ref={contentRef} style={{overflowY: 'auto', flex: 1, minHeight: 0}}>
          {/* Removed suggested question bubble */}
          {/* Render messages in chronological order */}
          {questions.slice().reverse().map((question, revIndex) => {
            const index = questions.length - 1 - revIndex;
            // Only show the last (pending) question if not waiting for a response
            const isLast = index === 0;
            const isWaiting = isPending && isLast && responses.length < questions.length;
            if (isWaiting) {
              // Show user bubble and thinking bubble, but not the next question input
              return (
                <Fragment key={index}>
                  <div className="flex w-full">
                    <span className="ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900">
                      {question}
                    </span>
                  </div>
                  <div className="flex w-full">
                    <span className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700 animate-pulse">
                      Thinking...
                    </span>
                  </div>
                </Fragment>
              );
            } else {
              return (
                <Fragment key={index}>
                  <div className="flex w-full">
                    <span className="ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900">
                      {question}
                    </span>
                  </div>
                  {responses[index] && (
                    <div className="flex w-full">
                      <span
                        className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700"
                        dangerouslySetInnerHTML={{ __html: responses[index] }}
                      />
                    </div>
                  )}
                </Fragment>
              );
            }
          })}
        </div>
        
        <div
          className="fixed bottom-0 left-0 w-full max-w-lg mx-auto flex cursor-text flex-col rounded-t-lg border-t bg-background p-4 z-50"
          style={{ right: 0 }}
          onClick={handleClickInput}
        >
          <Button className="mb-4" size="sm" variant="outline" onClick={handleGetAnotherQuestion} type="button">
          Get Suggestion
          </Button>
          <Separator/>
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything about your journal"
            className="mt-8 placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              minHeight: "0",
              lineHeight: "normal",
            }}
            rows={1}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            value={questionText}
            onChange={(e) => {
              const value = e.target.value;
              setQuestionText(value);
            }}
          />
          <Button
            onClick={handleSubmit}
            className="ml-auto size-8 rounded-full"
          >
            <ArrowUpIcon className="text-background" />
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default AskAIButton;
