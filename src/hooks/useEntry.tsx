"use client";

import { EntryProviderContext } from "@/providers/EntryProvider";
import { useContext } from "react";

function useEntry() {
  const context = useContext(EntryProviderContext);

  if (!context)
    throw new Error("useEntry must be used within an EntryProvider");
  return context;
}

export default useEntry;
