import { getUser } from "@/auth/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import prisma from "@/db/prisma";
import { Entry, User } from "@prisma/client";
import Link from "next/link";
import SideBarGroupContent from "./SideBarGroupContent";
import AskAIButton from "./AskAIButton";
import { Button } from "./ui/button";
import LogOutButton from "./LogOutButton";
import UserAccount from "./UserAccount";
import DraftSideBarGroupContent from "./DraftSideBarGroupContent";
import PartialSideBarGroupContent from "./PartialSideBarGroupContent";
// import { Calendar } from "./ui/calendar";

async function AppSideBar() {
  const user = await getUser();

  if (!user) return null; // 👈 Add this line to hide sidebar for non-logged-in users

  let entry: Entry[] = [];
  let dbUser: User | null = null;
  let hasDraftEntry;
  let hasPartialEntry;

  try {
    entry = await prisma.entry.findMany({
      where: {
        authorId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        preference: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });

    hasDraftEntry =
      entry.find(
        (entry) => entry.isOpen === "open" || entry.isOpen === "partial_open",
      )?.isOpen || "";

    hasPartialEntry =
      entry.find((entry) => entry.isOpen === "partial")?.isOpen || "";
  } catch (error: any) {
    if (error.code === "P1001") {
      console.log("Can't reach the database to authenticate user");
      return null;
    }

    throw error;
  }

  return (
    <Sidebar side="right" variant="floating">
      <SidebarHeader>
        <div className="flex justify-between">
          <UserAccount user={dbUser} />
          <LogOutButton />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {hasDraftEntry && (
          <SidebarGroup>
            <SidebarGroupLabel>Drafts</SidebarGroupLabel>
            <DraftSideBarGroupContent entry={entry} />
          </SidebarGroup>
        )}
        {hasPartialEntry && (
          <SidebarGroup>
            <SidebarGroupLabel>Awaiting Response</SidebarGroupLabel>
            <PartialSideBarGroupContent entry={entry} />
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Recent Journal Entries</SidebarGroupLabel>
          <SideBarGroupContent entry={entry} />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}


export default AppSideBar;
