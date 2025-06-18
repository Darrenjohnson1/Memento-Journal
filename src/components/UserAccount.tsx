"use client";

import { Icon, Settings, Settings2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import EntryTextInput from "./EntryTextInput";
import { updatePreferenceAction } from "@/actions/entry";
import prisma from "@/db/prisma";

import { useEffect, useState } from "react";

type Props = {
  user: {
    id: string;
    email: string;
    preference?: string;
  };
};

function UserAccount({ user }: Props) {
  const [prefText, setPrefText] = useState("");
  const [loading, setLoading] = useState(false);

  // Load initial preference from user prop
  useEffect(() => {
    if (user?.preference) {
      setPrefText(user.preference);
    }
  }, [user]);

  const handleUpdatePref = async () => {
    if (!user?.id || !prefText) return;

    try {
      setLoading(true);
      await updatePreferenceAction(user.id, prefText);
    } catch (error) {
      console.error("Error updating preference:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-10 rounded-full">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="flex gap-4">
            <Button variant="outline" className="h-10 w-10 rounded-full">
              {user?.email?.charAt(0).toUpperCase()}
            </Button>
            <div className="space-y-2">
              <h4 className="leading-none font-medium">{user?.email}</h4>
              <p className="text-muted-foreground text-sm">
                Set your conversation preference.
              </p>
            </div>
          </div>
          <div className="flex w-full max-w-sm items-center gap-2">
            <Input
              type="text"
              placeholder="Conversation Style"
              value={prefText}
              onChange={(e) => setPrefText(e.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              onClick={handleUpdatePref}
              disabled={loading}
            >
              {loading ? "Saving..." : "Set"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default UserAccount;
