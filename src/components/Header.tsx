import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import LogoutButton from "./LogoutButton";

function Header() {
  const user = 1;

  return (
    <header className="bg-popover relative flex h-24 w-full items-center justify-between px-3 sm:px-8">
      <Link href="/" className="flex items-end gap-2">
        <Image
          src="/starburst.png"
          height={60}
          width={60}
          alt="logo"
          className="rounded-full"
          priority
        />
        <h1 className="flex flex-col pb-1 text-2xl leading-6 font-bold lg:text-3xl">
          Memento Journal
        </h1>
      </Link>
      <div className="flex gap-4">
        {user ? (
          <LogoutButton />
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
