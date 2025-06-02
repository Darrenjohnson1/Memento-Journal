import NewDayCarousel from "@/components/NewDayCarousel";
import React from "react";

function page() {
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl justify-center gap-2">
        <NewDayCarousel />
      </div>
    </div>
  );
}

export default page;
