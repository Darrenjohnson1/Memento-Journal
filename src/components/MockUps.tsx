import React from "react";
import { JournalMock } from "./JournalMock";
import { SentimentMock } from "./SentimentMock";

function MockUps() {
  return (
    <div className="mt-24 w-full max-w-4xl">
      <JournalMock />
      <div className="mt-6 text-center">
        <h2 className="text-3xl font-semibold">Discover Insights</h2>
        <h3 className="pt-3 pb-6">
          Ask ChatterBox about the patterns that shape your week.
        </h3>
        <SentimentMock />
      </div>
    </div>
  );
}

export default MockUps;
