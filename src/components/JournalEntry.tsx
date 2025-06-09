"use client";
import React from "react";
import { Badge } from "./ui/badge";

type Props = {
  entry: {
    title: string;
    summary: string;
    tags: string[];
    sentiment: number;
  };
};

function JournalEntry({ entry }: any) {
  let entryObject;
  let error = null;

  try {
    entryObject = JSON.parse(entry.summary);
  } catch (e) {
    error = "Invalid JSON in summary field.";
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <div>
        <h2 className="mt-6 text-3xl font-bold">{entryObject.title}</h2>
        <p className="mt-5 text-lg">{entryObject.summary}</p>
        <h1 className="mt-10 text-lg font-medium">
          {entry?.createdAt.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h1>
        <Badge
          className="mt-5 mr-1"
          style={{
            backgroundColor:
              entryObject.sentiment < 0
                ? "yellow"
                : entryObject.sentiment > 0
                  ? "green"
                  : "gray",
            color:
              entryObject.sentiment < 0
                ? "black"
                : entryObject.sentiment > 0
                  ? "white"
                  : "white", // text color on gray
          }}
        >
          {entryObject.sentiment > 0
            ? "Positive"
            : entryObject.sentiment < 0
              ? "Challenging"
              : "Neutral"}
        </Badge>
        {entryObject.tags.map((tag: any, index: any) => (
          <Badge key={index} className="mr-1">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default JournalEntry;
