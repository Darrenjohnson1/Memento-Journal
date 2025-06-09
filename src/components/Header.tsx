import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { getUser } from "@/auth/server";
import LogOutButton from "./LogOutButton";
import { SidebarTrigger } from "./ui/sidebar";

async function Header() {
  const user = await getUser();

  return (
    <header className="bg-popover relative flex h-24 w-full items-center justify-between border-b-1 px-3 sm:px-8">
      <Link href="/" className="flex items-end gap-2">
        <Image
          src="/brainstorm.png"
          height={60}
          width={60}
          alt="logo"
          className="rounded-full"
          priority
        />
        <h1 className="flex flex-col pb-1 text-2xl leading-6 font-bold">
          JIBBER JOURNAL <span className="text-sm">AI MINDFULNESS JOURNAL</span>
        </h1>
      </Link>
      <div className="flex gap-4">
        {user ? (
          <SidebarTrigger />
        ) : (
          <>
            <Button asChild>
              <Link href="/sign-up" className="hidden sm:block">
                Sign Up
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
