"use client";

type Props = {
  entry: Entry[];
};

import { Entry } from "@prisma/client";
import React, { useEffect, useMemo, useState } from "react";
import {
  SidebarGroupContent as SidebarGroupContentShadCN,
  SidebarMenu,
  SidebarMenuItem,
} from "./ui/sidebar";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import Fuse from "fuse.js";
import SelectEntryButton from "./SelectEntryButton";
import DeleteEntryButton from "./DeleteEntryButton";

function SideBarGroupContent({ entry }: Props) {
  const [searchText, setSearchText] = useState("");
  const [localEntry, setLocalEntry] = useState(entry);

  useEffect(() => {
    setLocalEntry(entry);
  }, [entry]);

  // Filter out entries that are open or partially open
  const filteredOutInProgress = useMemo(() => {
    return localEntry.filter((entry) => entry.isOpen === "closed");
  }, [localEntry]);

  // Fuse is created only from filtered entries
  const fuse = useMemo(() => {
    return new Fuse(filteredOutInProgress, {
      keys: ["text"],
      threshold: 0.4,
    });
  }, [filteredOutInProgress]);

  const filteredEntry = searchText
    ? fuse.search(searchText).map((result) => result.item)
    : filteredOutInProgress;

  const deleteEntryLocally = (entryId: string) => {
    setLocalEntry((prevEntry) =>
      prevEntry.filter((entry) => entry.id !== entryId),
    );
  };

  return (
    <SidebarGroupContentShadCN>
      {/* <div className="item-center relative flex">
        <SearchIcon className="absolute top-3 left-3 size-3" />
        <Input
          className="bg-muted pl-8"
          placeholder="Search your journal..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div> */}
      <SidebarMenu className="mt-4">
        {filteredEntry.map((entry) => (
          <SidebarMenuItem key={entry.id} className="group/item">
            <SelectEntryButton entry={entry} />
            <DeleteEntryButton
              entryId={entry.id}
              deleteEntryLocally={deleteEntryLocally}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContentShadCN>
  );
}

export default SideBarGroupContent;
