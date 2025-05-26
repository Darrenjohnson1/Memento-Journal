"use client";

import { createContext, useState } from "react";

type EntryProviderContextType = {
  entryText: string;
  setEntryText: (entryText: string) => void;
};

export const EntryProviderContext = createContext<EntryProviderContextType>({
  entryText: "",
  setEntryText: () => {},
});

function EntryProvider({ children }: { children: React.ReactNode }) {
  const [entryText, setEntryText] = useState("");

  return (
    <EntryProviderContext.Provider value={{ entryText, setEntryText }}>
      {children}
    </EntryProviderContext.Provider>
  );
}

export default EntryProvider;
