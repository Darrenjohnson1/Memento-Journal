"use client";
import React, { Fragment, useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import NewDayJournal from "./NewDayJournal";
import PartialDayJournal from "./PartialDayJournal";

type Props = {
  entry: {
    title: string;
    summary: string;
    tags: string[];
    sentiment: number;
    journalEntry?: { text: string }[];
    journalEntry2?: { text: string }[];
    userResponse?: Record<string, string>;
    userResponse2?: Record<string, string>;
  } | null;
};

function JournalEntry({ entry }: Props) {
  const [parsedEntry, setParsedEntry] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!entry?.summary) {
      if (retryCount < 3) {
        const timeout = setTimeout(() => setRetryCount(retryCount + 1), 1000);
        return () => clearTimeout(timeout);
      } else {
        setError("Entry data unavailable. Try refreshing later.");
      }
      return;
    }

    try {
      const parsed = JSON.parse(entry.summary);
      setParsedEntry(parsed);
      setError(null);
    } catch (e) {
      setError("Error loading entry summary. Try refreshing.");
    }
  }, [entry, retryCount]);

  console.log(entry);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!entry || !parsedEntry) {
    return <div className="text-gray-500">Loading entry...</div>;
  }

  const sentiment = parsedEntry.sentiment ?? 0;
  const tags = Array.isArray(parsedEntry.tags) ? parsedEntry.tags : [];

  return (
    <div>
      <div>
        <h2 className="mt-6 text-4xl font-bold">
          {parsedEntry.title ?? "Untitled"}
        </h2>
        <p className="mt-5 text-lg">{parsedEntry.summary ?? ""}</p>
        {entry.journalEntry2 ? (
          <Badge
            className="mt-5 mr-1"
            style={{
              backgroundColor:
                sentiment < 0 ? "yellow" : sentiment > 0 ? "green" : "gray",
              color: sentiment < 0 ? "black" : "white",
            }}
          >
            {sentiment > 0
              ? "Positive"
              : sentiment < 0
                ? "Challenging"
                : "Neutral"}
          </Badge>
        ) : (
          <></>
        )}

        {tags.map((tag: string, index: number) => (
          <Badge key={index} className="mt-5 mr-1">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Badge>
        ))}
      </div>

      <Separator className="mt-5" />

      <div>
        <h2 className="mt-6 text-3xl font-bold">Journal</h2>
        <p className="mt-5 text-lg">
          {entry.journalEntry?.[0]?.text ?? <em>No Journal Entry</em>}
        </p>
        <p className="mt-5 text-lg">
          {entry.journalEntry2?.[0]?.text ?? <em>No Journal Entry</em>}
        </p>
      </div>

      <Separator className="mt-5" />
      <h2 className="mt-6 mb-5 text-3xl font-bold">Insights</h2>
      {entry.userResponse && Object.keys(entry.userResponse).length > 0 ? (
        Object.entries(entry.userResponse).map(([question, answer], index) => (
          <div key={index} className="mb-4 flex flex-col">
            <p className="question font-semibold">{question}</p>
            <p className="response text-gray-700">
              {answer || <em>No response</em>}
            </p>
          </div>
        ))
      ) : (
        <p>
          <em>No insights available.</em>
        </p>
      )}
      {entry.userResponse2 && Object.keys(entry.userResponse2).length > 0 ? (
        Object.entries(entry.userResponse2).map(([question, answer], index) => (
          <div key={index} className="mb-4 flex flex-col">
            <p className="question font-semibold">{question}</p>
            <p className="response text-gray-700">
              {answer || <em>No response</em>}
            </p>
          </div>
        ))
      ) : (
        <p>
          <em>No insights available.</em>
        </p>
      )}
      <Separator className="mt-5" />
      <div className="mt-6 mb-5">
        <PartialDayJournal entry={entry} />
      </div>
    </div>
  );
}

export default JournalEntry;
