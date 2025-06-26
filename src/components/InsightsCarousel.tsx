"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

import { SentimentMock } from "./SentimentMock";
import ConversationMock from "./AskAiMock";

export default function InsightsCarousel() {
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <Carousel
      opts={{
        loop: true, // allows infinite looping
      }}
      // 👇 Hook into the Carousel API
      setApi={setApi}
    >
      <CarouselContent>
        <CarouselItem className="p-4">
          <ConversationMock />
        </CarouselItem>
        <CarouselItem className="p-4">
          <SentimentMock />
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  );
}
