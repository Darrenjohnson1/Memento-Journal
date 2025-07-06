"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Back</span>
    </button>
  );
} 