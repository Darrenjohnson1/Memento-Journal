// components/AppSideBar.tsx
import { headers } from "next/headers";
import prisma from "@/db/prisma";
import { getUser } from "@/auth/server";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Entry } from "@prisma/client";
import UserAccount from "./UserAccount";
import LogOutButton from "./LogOutButton";
import DraftSideBarGroupContent from "./DraftSideBarGroupContent";
import PartialSideBarGroupContent from "./PartialSideBarGroupContent";
import SideBarGroupContent from "./SideBarGroupContent";

export const dynamic = "force-dynamic";

function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1); // Monday
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  ISOweekStart.setHours(0, 0, 0, 0);
  return ISOweekStart;
}

async function AppSideBar() {
  const user = await getUser();
  if (!user) return null;

  // Get the pathname from headers
  const pathname =
    headers().get("x-invoke-path") || headers().get("referer") || "";
  const match = pathname.match(/\/(\d{4})\/week\/(\d{1,2})/);

  let entry: Entry[] = [];

  if (match) {
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    const weekStartDate = getDateOfISOWeek(week, year);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    entry = await prisma.entry.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  const hasDraftEntry =
    entry.find(
      (entry) => entry.isOpen === "open" || entry.isOpen === "partial_open",
    )?.isOpen || "";

  const hasPartialEntry =
    entry.find((entry) => entry.isOpen === "partial")?.isOpen || "";

  const dbUser = await prisma.user.findUnique({
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
