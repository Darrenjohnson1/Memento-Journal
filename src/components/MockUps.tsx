import React from "react";
import { JournalMock } from "./JournalMock";
import { SentimentMock } from "./SentimentMock";
import AskAiMock from "./AskAiMock";
import InsightsCarousel from "./InsightsCarousel";

function MockUps() {
  return (
    <div>
      <div className="text-center">
        <h2 className="text-4xl font-bold">Discover Insights</h2>
        <h3 className="pt-3 pb-6 text-xl font-semibold">
          Use ChatterBox to find the patterns that shape your week.
        </h3>
      </div>
      <div className="pt-6">
        <InsightsCarousel />
      </div>
    </div>
  );
}

export default MockUps;
