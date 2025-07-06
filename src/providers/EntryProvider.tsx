"use client";

import { createContext, useState, ReactNode } from "react";

type EntryProviderContextType = {
  entryText: string;
  setEntryText: (entryText: string) => void;
};

export const EntryProviderContext = createContext<EntryProviderContextType>({
  entryText: "",
  setEntryText: () => {},
});

type EntryProviderProps = {
  children: ReactNode;
  year: string;
  weekofyear: string;
};

function EntryProvider({ children, year, weekofyear }: EntryProviderProps) {
  const [entryText, setEntryText] = useState("");

  return (
    <EntryProviderContext.Provider value={{ entryText, setEntryText }}>
      {children}
    </EntryProviderContext.Provider>
  );
}

export default EntryProvider;
