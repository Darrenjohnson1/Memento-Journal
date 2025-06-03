"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

async function JournalEntry(entry: ) {
  const entryIdParam = useSearchParams().get("entryId") || "";
  return <div>JournalEntry</div>;
}

export default JournalEntry;
