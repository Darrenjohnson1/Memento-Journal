"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function JournalDeleteButton({ entryId }: { entryId: string }) {
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        await fetch(`/api/entry/${entryId}`, { method: 'DELETE' });
        window.location.href = '/';
      }}
    >
      Delete Entry
    </Button>
  );
} 