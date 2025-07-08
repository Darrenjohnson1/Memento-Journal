"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { deleteEntryAction } from "@/actions/entry";

export default function JournalDeleteButton({ entryId }: { entryId: string }) {
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        await deleteEntryAction(entryId);
        window.location.href = '/';
      }}
    >
      Delete Entry
    </Button>
  );
} 