"use client";

type Props = {
  entry: Entry;
};

import useEntry from "@/hooks/useEntry";
import { Entry } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { SidebarMenuButton } from "./ui/sidebar";
import Link from "next/link";
// import { Badge } from "./ui/badge";

function sentimentToColor(sentiment: number): string {
  if (sentiment >= 75) return "#16a34a"; // green for positive
  return "#eab308"; // yellow for challenging
}
function sentimentType(sentiment: number): string {
  return sentiment >= 75 ? "Positive" : "Challenging";
}

function AnimatedHourglass() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // 4s total, flip at 2s
    const interval = setInterval(() => {
      setFlipped((f) => !f);
    }, 2000); // 2000ms = half of 4s
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      role="img"
      aria-label="hourglass"
      className={`hourglass-tip${flipped ? " hourglass-flip" : ""}`}
    >
      ⏳
    </span>
  );
}

function SelectEntryButton({ entry }: Props) {
  const entryId = useSearchParams().get("entryId") || "";
  const { entryText: selectedEntryText } = useEntry();
  const [shouldUseGlobalEntryText, setShouldUseGlobalEntryText] =
    useState(false);
  const [localEntryText, setLocalEntryText] = useState(entry.summary);

  // useEffect(() => {
  //   if (entryId === entry.id) {
  //     setShouldUseGlobalEntryText(true);
  //   } else {
  //     setShouldUseGlobalEntryText(false);
  //   }
  // }, [entryId, entry.id]);

  // useEffect(() => {
  //   if (shouldUseGlobalEntryText) {
  //     setLocalEntryText(selectedEntryText);
  //   }
  // }, [selectedEntryText, shouldUseGlobalEntryText]);

  // const blankEntryText = "TODAY'S JOURNAL PENDING";
  // let entryText = localEntryText || blankEntryText;
  // if (shouldUseGlobalEntryText) {
  //   entryText = selectedEntryText;
  // }

  let entryObject;
  let error = null;

  try {
    entryObject = JSON.parse(entry.summary);
  } catch (e) {
    error = "Invalid JSON in summary field.";
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Determine if entry is partial and before/after 5pm
  let showPartialClock = false;
  let showPartialReady = false;
  if (entry.isOpen === "partial") {
    const now = new Date();
    const entryDate = new Date(entry.updatedAt);
    const isSameDay =
      now.getFullYear() === entryDate.getFullYear() &&
      now.getMonth() === entryDate.getMonth() &&
      now.getDate() === entryDate.getDate();
    const fivePmEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate(), 17, 0, 0, 0);

    if (isSameDay && now.getTime() < fivePmEntryDate.getTime()) {
      showPartialClock = true;
    } else if ((isSameDay && now.getTime() >= fivePmEntryDate.getTime()) || now > fivePmEntryDate) {
      showPartialReady = true;
    }
  }

  return (
    <SidebarMenuButton
      asChild
      className={`items-start gap-0 pr-12 ${entry.isOpen === "open" || entry.isOpen === "partial_open" || entry.isOpen === "partial" ? "bg-sidebar-accent/100" : ""} `}
    >
      <Link
        href={
          entry.isOpen === "open"
            ? `/plan/?entryId=${entry.id}`
            : `/journal/?entryId=${entry.id}`
        }
        className="flex h-fit flex-col"
      >
        <p className="w-full overflow-hidden break-words line-clamp-2">
          {entryObject.title}
        </p>

        <div className="flex h-5 w-full flex-row justify-between gap-2">
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            {showPartialClock ? (
              <span title="Awaiting response window">
                <AnimatedHourglass />
              </span>
            ) : showPartialReady ? (
              <span title="Ready for response">
                <span role="img" aria-label="ready" className="bell-ring">🔔</span>
              </span>
            ) : null}
            <span>{entry.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            {entry.isOpen === "closed" && entry.sentiment !== undefined && (
              <span className="flex items-center gap-1 ml-2 opacity-60">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: sentimentToColor(entry.sentiment), opacity: 0.7 }}
                  title={`Positivity: ${entry.sentiment}`}
                />
                <span className="text-xs font-medium" style={{ color: sentimentToColor(entry.sentiment) }}>
                  {sentimentType(entry.sentiment)}
                </span>
              </span>
            )}
          </span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

export default SelectEntryButton;
