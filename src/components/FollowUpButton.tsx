"use client";

import { User } from "@supabase/supabase-js";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { createEntryAction } from "@/actions/entry";

type Props = {
  user: User | null;
};

function FollowUpButton({ user }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleClickNewEntryButton = async () => {
    if (!user) {
      router.push("/login");
    } else {
      setLoading(true);

      const uuid = uuidv4();

      router.push(`plan/?entryId=${uuid}`);
      await createEntryAction(uuid);
      toast.success("Let's Get Ready For The Day", {
        description: "You have started a new journal entry",
      });
      setLoading(false);
    }
  };
  return (
    <Button
      onClick={handleClickNewEntryButton}
      variant="secondary"
      className="w-30"
    >
      {loading ? <Loader2 className="animate-spin" /> : "Follow Up"}
    </Button>
  );
}

export default FollowUpButton;
