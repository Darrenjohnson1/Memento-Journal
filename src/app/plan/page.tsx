"use client";

import { getUserQuestionsAction } from "@/actions/entry";
import NewDayCarousel from "@/components/NewDayCarousel";
import React from "react";

async function page() {
  const questions = await getUserQuestionsAction();
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl justify-center gap-2">
        <NewDayCarousel questions={questions} />
      </div>
    </div>
  );
}

export default page;
