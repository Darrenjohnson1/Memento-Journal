"use client";

import React, { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SurveyDialogProps = {
  surveyId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function SurveyDialog({
  surveyId,
  open: controlledOpen,
  onOpenChange,
}: SurveyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Load survey when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        (posthog as any).renderSurvey?.(surveyId, "#survey-container");
      }, 100);
    }
  }, [open, surveyId]);

  // Close on "survey sent"
  useEffect(() => {
    const handler = () => setOpen(false);
    posthog.on?.("survey sent", handler);
    return () => posthog.off?.("survey sent", handler);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>We’d love your feedback</DialogTitle>
        </DialogHeader>

        <div id="survey-container" className="mt-4 space-y-4" />

        {/* Custom Styling */}
        <style jsx global>{`
          #survey-container .ph-survey {
            all: unset;
            display: block;
            padding: 1.25rem;
            border-radius: 0.75rem;
            background-color: #f9fafb;
            color: #111827;
            font-family: system-ui, sans-serif;
          }
          /* ... (rest of your styling remains unchanged) ... */
          #survey-container .footer-branding {
            display: none;
          }
        `}</style>

        <div className="mt-6 flex justify-end">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
