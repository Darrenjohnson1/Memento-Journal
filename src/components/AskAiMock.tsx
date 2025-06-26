"use client";
import React, { Fragment, useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "./ui/button";

export default function ConversationMock() {
  const prompts = [
    "Ask me anything about your week!",
    "Wondering how you’ve changed?",
  ];

  const userInputs = ["How was my mood on Monday?"];

  const aiResponses = [
    "You seemed <strong>optimistic</strong> on Monday, mentioning productive work and positive social interactions.",
  ];

  const [randomPhraseIndex, setRandomPhraseIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<
    { sender: "ai" | "user"; message: string; html?: boolean }[]
  >([]);
  const [chatIndex, setChatIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [typedText, setTypedText] = useState("");
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  // Rotate the prompt on top
  useEffect(() => {
    const interval = setInterval(() => {
      setRandomPhraseIndex((prev) => (prev + 1) % prompts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Helper to simulate typing in the textarea
  const simulateTyping = (text: string, onComplete: () => void) => {
    let index = 0;
    setTypedText("");
    if (typingInterval.current) clearInterval(typingInterval.current);

    typingInterval.current = setInterval(() => {
      if (index < text.length) {
        setTypedText((prev) => prev + text[index]);
        index++;
      } else {
        if (typingInterval.current) clearInterval(typingInterval.current);
        setTimeout(onComplete, 700); // slight pause after typing
      }
    }, 120); // typing speed per char (ms)
  };

  // Main chat simulation logic
  // Main chat simulation logic
  useEffect(() => {
    // Prevent going beyond available inputs
    if (chatIndex > userInputs.length) return;

    let timeout: NodeJS.Timeout;

    if (chatIndex === 0) {
      // AI starts conversation
      timeout = setTimeout(() => {
        setChatHistory([
          { sender: "ai", message: "Hi! How can I help you today?" },
        ]);
        setChatIndex(1);
      }, 1000);
    } else if (chatIndex <= userInputs.length) {
      const userMessage = userInputs[chatIndex - 1];
      const aiMessage = aiResponses[chatIndex - 1];

      // Only proceed if both messages exist
      if (!userMessage || !aiMessage) return;

      // Simulate user typing the question in textarea
      simulateTyping(userMessage, () => {
        // When typing done, add user message to chat, clear textarea, show AI thinking
        setChatHistory((prev) => [
          ...prev,
          { sender: "user", message: userMessage },
        ]);
        setTypedText("");
        setIsThinking(true);

        // After thinking delay, show AI response
        timeout = setTimeout(() => {
          setChatHistory((prev) => [
            ...prev,
            { sender: "ai", message: aiMessage, html: true },
          ]);
          setIsThinking(false);

          // Only increment if there are more inputs left
          setChatIndex((prev) => (prev < userInputs.length ? prev + 1 : prev));
        }, 3000);
      });
    }

    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
      clearTimeout(timeout);
    };
  }, [chatIndex]);

  return (
    <Card
      className="mx-auto w-full max-w-xl"
      style={{ height: "500px" }} // roughly 2/3 height
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Chat with your AI assistant</CardTitle>
        <CardDescription className="text-xl">
          Talk with your journal and discover insights using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-6 overflow-auto">
        {/* Chat messages */}
        {chatHistory.map((entry, index) => (
          <Fragment key={index}>
            <p
              className={`max-w-[60%] rounded-lg px-4 py-2 text-sm break-words ${
                entry.sender === "user"
                  ? "ml-auto bg-blue-100 text-blue-900"
                  : "mr-auto bg-gray-100 text-gray-700"
              }`}
              {...(entry.html
                ? { dangerouslySetInnerHTML: { __html: entry.message } }
                : { children: entry.message })}
            />
          </Fragment>
        ))}

        {/* Thinking indicator for AI */}
        {isThinking && (
          <p className="mr-auto max-w-[60%] animate-pulse rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-600">
            Thinking...
          </p>
        )}

        {/* Input area with simulated typing */}
        <div className="mt-auto flex cursor-text flex-col rounded-lg border p-4">
          <Textarea
            placeholder="Ask me anything about your journal"
            className="placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              minHeight: "40px", // fixed height to prevent jump
              lineHeight: "normal",
            }}
            rows={1}
            readOnly
          />
          <Button className="ml-auto size-8 rounded-full">
            <ArrowUpIcon className="text-background" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
