"use client";
import React, { Fragment } from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

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
    error = "Error Loading Entry - Refresh";
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }
  console.log(entry.journalEntry);

  return (
    <div>
      <div>
        <h2 className="mt-6 text-4xl font-bold">{entryObject.title}</h2>
        <p className="mt-5 text-lg">{entryObject.summary}</p>

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
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Badge>
        ))}
      </div>
      <Separator className="mt-5" />
      <div>
        <h2 className="mt-6 text-3xl font-bold">Journal</h2>
        <p className="mt-5 text-lg">
          {entryObject.journalEntry || <em>No Journal Entry</em>}
        </p>
      </div>
      <Separator className="mt-5" />
      <h2 className="mt-6 mb-5 text-3xl font-bold">Insights</h2>
      {Object.entries(entry.userResponse).map(([question, answer], index) => (
        <div className="flex flex-col">
          <p key={index} className="question">
            <strong>{question}</strong>:
          </p>
          <p className="response">{answer || <em>No response</em>}</p>
        </div>
      ))}
    </div>
  );
}

export default JournalEntry;
