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
import { Badge } from "./ui/badge";

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
        <p className="w-full truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {entryObject.title}
        </p>

        <div className="flex h-5 w-full flex-row justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {entry.updatedAt.toLocaleDateString()}
          </p>
          {entry.isOpen !== "closed" ? (
            ""
          ) : (
            <Badge
              className=""
              style={{
                backgroundColor:
                  entryObject.sentiment < 0
                    ? "yellow"
                    : entryObject.sentiment > 0
                      ? "green"
                      : "gray",
                color:
                  entryObject.sentiment < 0
                    ? "black"
                    : entryObject.sentiment > 0
                      ? "white"
                      : "white", // text color on gray
              }}
            >
              {entryObject.sentiment > 0
                ? "Positive"
                : entryObject.sentiment < 0
                  ? "Challenging"
                  : "Neutral"}
            </Badge>
          )}
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

export default SelectEntryButton;
