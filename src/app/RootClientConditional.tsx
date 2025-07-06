"use client";
import { usePathname } from "next/navigation";
import FollowUpButton from "@/components/FollowUpButton";
 
export default function RootClientConditional() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <FollowUpButton />;
} 