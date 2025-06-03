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

function SelectEntryButton({ entry }: Props) {
  const entryId = useSearchParams().get("entryId") || "";
  const { entryText: selectedEntryText } = useEntry();
  const [shouldUseGlobalEntryText, setShouldUseGlobalEntryText] =
    useState(false);
  const [localEntryText, setLocalEntryText] = useState(entry.summary);

  useEffect(() => {
    if (entryId === entry.id) {
      setShouldUseGlobalEntryText(true);
    } else {
      setShouldUseGlobalEntryText(false);
    }
  }, [entryId, entry.id]);

  useEffect(() => {
    if (shouldUseGlobalEntryText) {
      setLocalEntryText(selectedEntryText);
    }
  }, [selectedEntryText, shouldUseGlobalEntryText]);

  const blankEntryText = "TODAY'S JOURNAL PENDING";
  let entryText = localEntryText || blankEntryText;
  if (shouldUseGlobalEntryText) {
    entryText = selectedEntryText || blankEntryText;
  }

  return (
    <SidebarMenuButton
      asChild
      className={`items-start gap-0 pr-12 ${entry.id === entryId ? "bg-sidebar-accent/50" : ""}`}
    >
      <Link
        href={`journal/?entryId=${entry.id}`}
        className="flex h-fit flex-col"
      >
        <p className="w-full truncate overflow-hidden text-ellipsis whitespace-nowrap">
          {entryText}
        </p>
        <p className="text-muted-foreground text-xs">
          {entry.updatedAt.toLocaleDateString()}
        </p>
      </Link>
    </SidebarMenuButton>
  );
}

export default SelectEntryButton;
