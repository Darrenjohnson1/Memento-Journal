"use client";

type Props = {
  entryId: string;
  deleteEntryLocally: (entryId: string) => void;
};

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2, Trash2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function DeleteEntryButton({ entryId, deleteEntryLocally }: Props) {
  const [isPending, startTransition] = useTransition();

  const entryIdParam = useSearchParams().get("entryId") || "";

  const router = useRouter();

  const handleDeleteEntry = () => {
    startTransition(async () => {
      const [errorMessage] = await deleteEntryAction(entryId);

      if (!errorMessage) {
        toast.success("Page Deleted", {
          description: "You have successfully deleted the page.",
        });
      }
      deleteEntryLocally(entryId);

      if (entryId === entryIdParam) {
        router.replace("/");
      }
    });
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="absolute top-1/2 right-2 size-7 -translate-y-1/2 p-0 opacity-0 group-hover/item:opacity-100 [&_svg]:size-3"
          variant={"ghost"}
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone, it will permanently delete your
            journal entry from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-24"
            onClick={handleDeleteEntry}
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteEntryButton;
