import { create } from "zustand";
import Fuse from "fuse.js";

export type Entry = {
  id: string;
  text: string;
  isOpen: "open" | "partial" | "closed";
};

type JournalStore = {
  entries: Entry[];

  setEntries: (entries: Entry[]) => void;
  deleteEntry: (id: string) => void;

  // Derived state (selectors)
  getClosedEntries: () => Entry[];
  searchEntries: (query: string) => Entry[];
};

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],

  setEntries: (entries) => set({ entries }),

  deleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
    })),

  getClosedEntries: () =>
    get().entries.filter((entry) => entry.isOpen === "closed"),

  searchEntries: (query: string) => {
    const closed = get().getClosedEntries();
    if (!query) return closed;

    const fuse = new Fuse(closed, {
      keys: ["text"],
      threshold: 0.4,
    });

    return fuse.search(query).map((r) => r.item);
  },
}));