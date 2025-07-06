"use client";

import { User } from "@supabase/supabase-js";
import React, { Fragment, useRef, useState, useTransition } from "react";
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
    "Do you want to know which day you were most positive this week?",
    "Would you like to see a summary of your mood trends?",
    "Are you curious about how your entries this week compare to last week?",
    "Want to know which words you used most often in your journal?",
    "Would you like to see if there's a pattern to your most productive days?",
    "Do you want to know if your mood improved as the week went on?",
    "Interested in which topics you wrote about most this week?",
    "Would you like to see your average sentiment score for the week?",
    "Curious if there's a link between your sleep and your mood this week?",
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
  };

  return (
    <Drawer open={open} onOpenChange={handleOnOpenChange}>
      <DrawerTrigger asChild>
        <Button>Ask ChatterBox</Button>
      </DrawerTrigger>
      <DrawerContent className="custom-scrollbar flex h-[85vh] max-w-4xl flex-col overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Chat with your AI assistant</DrawerTitle>
          <DrawerDescription>
            Talk with your journal and discover insights using AI.
          </DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 flex flex-col gap-8 pb-32 mx-2 md:mx-4">
          <div className="flex flex-col items-center gap-2">
            <p className="bot-response question text-muted-foreground text-sm">
              {suggestedQuestion}
            </p>
            <div className="w-full flex justify-center">
              <Button size="sm" variant="outline" onClick={handleGetAnotherQuestion} type="button">
                Get Another Question
              </Button>
            </div>
          </div>
          {questions.map((question, index) => (
            <Fragment key={index}>
              <p className="response ml-auto max-w-[60%] rounded-md px-2 py-1 text-sm">
                {question}
              </p>
              {responses[index] && (
                <p
                  className="bot-reponse question text-muted-foreground text-sm"
                  dangerouslySetInnerHTML={{ __html: responses[index] }}
                />
              )}
            </Fragment>
          ))}
          {isPending && <p className="animate-pulse text-sm">Thinking...</p>}
        </div>
        <div
          className="fixed bottom-0 left-0 w-full max-w-lg mx-auto flex cursor-text flex-col rounded-t-lg border-t bg-background p-4 z-50"
          style={{ right: 0 }}
          onClick={handleClickInput}
        >
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything about your journal"
            className="placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
