"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Funnel_Display } from "next/font/google";
import SideBarTrigger from "./SideBarTrigger";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // choose the weights you want
  variable: "--font-funnel-display", // optional for Tailwind
});

type HeaderProps = { user?: any };
function Header({ user }: HeaderProps) {
  const pathname = usePathname();
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
          (pathname === "/plan" || pathname === "/follow-up" || pathname === "/journal") ? (
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          ) : (
            <SideBarTrigger />
          )
        ) : (
          <>
            <Button asChild className="hidden md:block">
              <Link href="/login">
                Sign Up <ChevronRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                Login <ChevronRight />
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
export default Header;

