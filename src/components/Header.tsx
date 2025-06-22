import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { getUser } from "@/auth/server";
import LogOutButton from "./LogOutButton";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Funnel_Display } from "next/font/google";
import SideBarTrigger from "./SideBarTrigger";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // choose the weights you want
  variable: "--font-funnel-display", // optional for Tailwind
});

async function Header() {
  const user = await getUser();
  return (
    <header className="bg-popover relative flex h-24 w-full items-center justify-between border-b-1 px-3 sm:px-8">
      <Link
        href="/"
        className="flex items-center justify-center gap-2 align-middle"
      >
        <Image
          src="/box.png"
          height={50}
          width={50}
          alt="logo"
          className="w-10 rounded-full sm:w-12 md:w-14"
          priority
        />
        <div className="flex flex-col content-center justify-center">
          <h1
            style={{
              fontFamily: '"Funnel Display", sans-serif',
              fontWeight: 700,
            }}
            className="flex flex-col text-2xl leading-none"
          >
            ChatterBox{" "}
          </h1>
          <h2
            style={{
              fontFamily: '"Funnel Display", sans-serif',
              fontWeight: 700,
            }}
            className="text-sm max-[400px]:text-[0.6rem]"
          >
            AI MINDFULNESS JOURNAL
          </h2>
        </div>
      </Link>
      <div className="flex gap-4">
        {user ? (
          <SideBarTrigger />
        ) : (
          <>
            {/* <Button asChild>
              <Link href="/sign-up" className="hidden sm:block">
                Sign Up
              </Link>
            </Button> */}
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
