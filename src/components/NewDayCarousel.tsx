"use client";

import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

function NewDayCarousel() {
  const totalItems = 4;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalItems - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const progress = ((currentIndex + 1) / totalItems) * 100;
  return (
    <div>
      <Carousel className="w-full max-w-xs">
        <CarouselContent>
          <CarouselItem>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square flex-col justify-center p-6">
                  <h1 className="pb-5 text-2xl font-semibold">1.</h1>
                  <div className="text-4xl font-semibold">
                    What are you looking forward to today?
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square flex-col justify-center p-6">
                  <h1 className="pb-5 text-2xl font-semibold">2.</h1>
                  <span className="text-4xl font-semibold">
                    What challenges or stressors do you expect today?
                  </span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square flex-col justify-center p-6">
                  <h1 className="pb-5 text-2xl font-semibold">3.</h1>
                  <span className="text-4xl font-semibold">
                    How do you plan to take care of yourself today?
                  </span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square flex-col justify-center p-6">
                  <h1 className="pb-5 text-2xl font-semibold">4.</h1>
                  <span className="text-4xl font-semibold">
                    What would make today feel meaningful or successful?
                  </span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext onClick={handleNext} />
      </Carousel>
      <Progress value={progress} className="mt-10" />
    </div>
  );
}

export default NewDayCarousel;
