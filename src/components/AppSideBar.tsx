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
import { Entry } from "@prisma/client";
import Link from "next/link";
import SideBarGroupContent from "./SideBarGroupContent";
import AskAIButton from "./AskAIButton";
import { Button } from "./ui/button";
import LogOutButton from "./LogOutButton";
import UserAccount from "./UserAccount";
// import { Calendar } from "./ui/calendar";

async function AppSideBar() {
  const user = await getUser();

  let entry: Entry[] = [];
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
    }
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
            <UserAccount user={user} />
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
        <SidebarGroup>
          <SidebarGroupLabel>Incomplete Entry</SidebarGroupLabel>
          {user && <SideBarGroupContent entry={entry} />}
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Come Back Later</SidebarGroupLabel>
          {user && <SideBarGroupContent entry={entry} />}
        </SidebarGroup>
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
