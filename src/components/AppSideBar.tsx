// components/AppSideBar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Entry, User, Role } from "@prisma/client";
import UserAccount from "./UserAccount";
import LogOutButton from "./LogOutButton";
import DraftSideBarGroupContent from "./DraftSideBarGroupContent";
import PartialSideBarGroupContent from "./PartialSideBarGroupContent";
import SidebarGroupContent from "./SideBarGroupContent";
import { FileText, Clock, BookOpen } from "lucide-react";

type AppSideBarProps = {
  user: {
    id: string;
    email: string;
    preference?: string;
  } | null;
  entries: Entry[];
};

function AppSideBar({ user, entries }: AppSideBarProps) {
  if (!user) return null;

  // Find entry states
  const hasDraftEntry = entries.find(e => e.isOpen === "open" || e.isOpen === "partial_open")?.isOpen || "";
  const hasPartialEntry = entries.find(e => e.isOpen === "partial")?.isOpen || "";
  // Find the most recent entry
  const mostRecentEntry = entries.length > 0 ? [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
  // Determine border color by status
  let borderColor = "border-gray-300";
  if (mostRecentEntry) {
    if (mostRecentEntry.isOpen === "open" || mostRecentEntry.isOpen === "partial_open") borderColor = "border-green-500";
    else if (mostRecentEntry.isOpen === "partial") borderColor = "border-yellow-500";
    else if (mostRecentEntry.isOpen === "closed") borderColor = "border-red-500";
  }

  return (
    <Sidebar side="right" variant="floating">
      <SidebarHeader>
        <div className="flex justify-between">
          <UserAccount user={user} />
          <LogOutButton />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="border-b border-gray-200"><BookOpen className="mr-2" />Journal Entries</SidebarGroupLabel>
          <SidebarGroupContent entry={entries} />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSideBar;
