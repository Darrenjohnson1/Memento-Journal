"use client";

type Props = {
  entryId: string;
  startingEntryText: string;
};

import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { debounceTimeout } from "@/lib/constants";
import useEntry from "@/hooks/useEntry";
import { updateEntryAction } from "@/actions/entry";

let updateTimeout: NodeJS.Timeout;

function EntryTextInput({ entryId, startingEntryText }: Props) {
  const entryIdParam = useSearchParams().get("entryId") || "";
  const { entryText, setEntryText } = useEntry();

  useEffect(() => {
    if (entryId === entryId) {
      setEntryText(startingEntryText);
    }
  }, [startingEntryText, entryIdParam, entryId, setEntryText]);

  const handleUpdateEntry = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEntryText(text);

    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateEntryAction(entryId, text);
    }, debounceTimeout);
  };
  return (
    <Textarea
      value={entryText}
      onChange={handleUpdateEntry}
      placeholder="Type your entry here"
      className="custom-scrollbar placeholder:text-muted-foreground mb-4 h-full max-w-4xl resize-none border p-4 focus-visible:ring-0 focus-visible:ring-offset-0"
    />
  );
}

export default EntryTextInput;
