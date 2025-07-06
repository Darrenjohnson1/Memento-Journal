"use client";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function ConditionalSidebarTrigger() {
  const pathname = usePathname();
  // Match /2025/week/28 or any /[year]/week/[weekofyear]
  const match = /^\/\d{4}\/week\/\d+/.test(pathname);
  if (!match) return null;
  return <SidebarTrigger />;
} 