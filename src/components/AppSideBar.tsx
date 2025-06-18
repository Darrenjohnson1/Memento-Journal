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

  let entry: Entry[] = [];
  let dbUser: User | null = null;
  let hasDraftEntry;
  let hasPartialEntry;
  try {
    if (user) {
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
    }
    hasDraftEntry =
      entry.find(
        (entry) => entry.isOpen === "open" || entry.isOpen === "partial_open",
      )?.isOpen || "";

    hasPartialEntry =
      entry.find((entry) => entry.isOpen === "partial")?.isOpen || "";
  } catch (error: any) {
    if (error.code === "P1001") {
      // P1001: Can't reach the database
      return console.log("Can't reach the database to authenticate user");
    }

    // Re-throw or handle other errors
    throw error;
  }

  return (
    <Sidebar side="right" variant="floating">
      <SidebarHeader>
        {user ? (
          <div className="flex justify-between">
            <UserAccount user={dbUser} />
            <LogOutButton />
          </div>
        ) : (
          <>
            <Button asChild>
              <Link href="/sign-up" className="">
                Sign Up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </SidebarHeader>
      <SidebarContent>
        {hasDraftEntry ? (
          <SidebarGroup>
            <SidebarGroupLabel>Drafts</SidebarGroupLabel>
            {user && <DraftSideBarGroupContent entry={entry} />}
          </SidebarGroup>
        ) : (
          <></>
        )}
        {hasPartialEntry ? (
          <SidebarGroup>
            <SidebarGroupLabel>In Progress</SidebarGroupLabel>
            {user && <PartialSideBarGroupContent entry={entry} />}
          </SidebarGroup>
        ) : (
          <></>
        )}

        <SidebarGroup>
          {/* <Calendar /> */}
          <SidebarGroupLabel>
            {user ? (
              "Recent Journal Entries"
            ) : (
              <p>
                No User Data:{" "}
                <Link className="underline" href="/login">
                  Login
                </Link>
              </p>
            )}
          </SidebarGroupLabel>
          {user && <SideBarGroupContent entry={entry} />}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AskAIButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSideBar;
