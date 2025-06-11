"use client";

import { User } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { createEntryAction, followUpEntryAction } from "@/actions/entry";

type Props = {
  user: User | null;
};

function FollowUpButton({ user }: Props) {
  const router = useRouter();

  const entryIdParam = useSearchParams().get("entryId") || "";

  const [loading, setLoading] = useState(false);

  const handleClickNewEntryButton = async () => {
    if (!user) {
      router.push("/follow-up");
    } else {
      setLoading(true);

      router.push(`follow-up/?entryId=${entryIdParam}`);
      toast.success("Let's Wrap Up The Day", {
        description: "Gathering Thoughts",
      });
      await followUpEntryAction(entryIdParam);
      setLoading(false);
    }
  };
  return (
    <Button onClick={handleClickNewEntryButton} className="w-30">
      {loading ? <Loader2 className="animate-spin" /> : "Follow Up"}
    </Button>
  );
}

export default FollowUpButton;
