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
import SelectEntryButton from "./SelectEntryButton";
import DeleteEntryButton from "./DeleteEntryButton";

function DraftSideBarGroupContent({ entry }: Props) {
  const [searchText, setSearchText] = useState("");
  const [localEntry, setlocalEntry] = useState(entry);

  useEffect(() => {
    setlocalEntry(entry);
  }, [entry]);

  const deleteEntryLocally = (entryId: string) => {
    setlocalEntry((prevEntry) =>
      prevEntry.filter((entry) => entry.id !== entryId),
    );
  };

  const filteredEntry = useMemo(() => {
    return localEntry.filter((e) => e.isOpen === "open");
  }, [localEntry]);

  return (
    <SidebarGroupContentShadCN>
      <SidebarMenu>
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

export default DraftSideBarGroupContent;
