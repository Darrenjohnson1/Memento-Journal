"use client";

import { User } from "@supabase/supabase-js";
import React from "react";

type Props = {
  user: User | null;
};

function AskAIButton({ user }: Props) {
  return <div>AskAIButton</div>;
}

export default AskAIButton;
