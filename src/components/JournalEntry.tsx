"use client";
import React, { useEffect, useState, useRef } from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import NewDayJournal from "./NewDayJournal";
import PartialDayJournal from "./PartialDayJournal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { extractNegativePhrasesAction, updateJournalEntryAction, reframeJournalEntryAction } from "@/actions/entry";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
// Placeholder for the AI rewrite action (to be implemented in backend)
async function improveSentimentAI(journalText: string): Promise<string> {
  // This should call a backend action that uses the AI to rewrite the text
  // For now, just return the original text
  return journalText;
}

type NegativePhrase = { negative: string; suggested: string };

type Props = {
  entry: {
    title?: string;
    summary?: string;
    tags?: string[];
    sentiment?: number;
    journalEntry?: { text: string }[];
    journalEntry2?: { text: string }[];
    userResponse?: Record<string, string>;
    userResponse2?: Record<string, string>;
    id?: string;
    isOpen?: string;
    authorId?: string;
    createdAt?: Date;
    updatedAt?: Date;
    negativePhrases?: string[];
    suggestedResponses?: any;
    sentimentHistory?: Array<{
      score: number;
      timestamp: string;
      version: string;
    }>;
  } | null;
};
// Use the same sentiment color/type logic as WeeklyCalendar
function sentimentToColor(sentiment: number): string {
  if (sentiment >= 75) return "#16a34a"; // green for positive
  return "#eab308"; // yellow for challenging
}
function sentimentType(sentiment: number): string {
  console.log("sentiment", sentiment)
  return sentiment >= 75 ? "Positive" : "Challenging";
}

function JournalEntry({ entry }: Props) {
  const [parsedEntry, setParsedEntry] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [negativePhrases, setNegativePhrases] = useState<NegativePhrase[]>(
    Array.isArray(entry?.negativePhrases)
      ? entry.negativePhrases.map((item: any) =>
          typeof item === 'object' && item !== null && 'negative' in item && 'suggested' in item
            ? item
            : { negative: String(item), suggested: '' }
        )
      : []
  );
  const [loadingNegatives, setLoadingNegatives] = useState(false);
  const [showImprove, setShowImprove] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  // State for user rewrites for each negative phrase
  const [userRewrites, setUserRewrites] = useState<{ [idx: number]: string }>({});
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const totalPhrases = negativePhrases.length;
  const handlePrev = () => setCurrentPhraseIdx((idx) => Math.max(0, idx - 1));
  const handleNext = () => setCurrentPhraseIdx((idx) => Math.min(totalPhrases - 1, idx + 1));
  const [hasReframed, setHasReframed] = useState(false);

  const handleRewriteChange = (idx: number, value: string) => {
    setUserRewrites((prev) => ({ ...prev, [idx]: value }));
  };

  const handleSaveAllRewrites = async () => {
    if (!entry?.id) {
      setSaveError("Entry ID not found");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Get the original journal text
      const originalText = entry?.journalEntry?.[0]?.text || entry?.journalEntry2?.[0]?.text || "";
      
      // Apply all user rewrites to create the improved text
      let improvedText = originalText;
      
      // Sort rewrites by index to apply them in order
      const sortedRewrites = Object.entries(userRewrites)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .reverse(); // Apply from end to beginning to avoid index shifting
      
      sortedRewrites.forEach(([idxStr, newText]) => {
        const idx = parseInt(idxStr);
        if (idx >= 0 && idx < negativePhrases.length && newText.trim()) {
          const originalPhrase = negativePhrases[idx].negative;
          const safePhrase = originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          improvedText = improvedText.replace(new RegExp(safePhrase, 'gi'), newText);
        }
      });

      // Call the backend to update the entry
      const result = await reframeJournalEntryAction(entry.id, improvedText);
      
      if (result.success) {
        setSaveSuccess(true);
        setHasReframed(true); // Mark as reframed
        // Update local state with new data
        if (result.newPositivity !== undefined) {
          entry.sentiment = result.newPositivity;
        }
        if (result.sentimentHistory) {
          entry.suggestedResponses = result.sentimentHistory;
        }
        // Update the journal text
        if (entry.journalEntry && entry.journalEntry.length > 0) {
          entry.journalEntry[0].text = improvedText;
        } else if (entry.journalEntry2 && entry.journalEntry2.length > 0) {
          entry.journalEntry2[0].text = improvedText;
        }
        
        // Close the improve section
        setShowImprove(false);
        setUserRewrites({});
        setCurrentPhraseIdx(0);
        
        // Show success message briefly
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || "Failed to save changes");
      }
    } catch (error) {
      setSaveError("An unexpected error occurred");
      console.error("Error saving rewrites:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    const overlay = overlayRef.current;
    if (!textarea || !overlay) return;
    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };
    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, [showImprove]);

  const handleImproveSentiment = async () => {
    setImproving(true);
    setImproveError(null);
    const journalText = entry?.journalEntry?.[0]?.text || entry?.journalEntry2?.[0]?.text || "";
    try {
      const improved = await improveSentimentAI(journalText);
      setImprovedText(improved);
    } catch (e) {
      setImproveError("Failed to improve sentiment. Please try again.");
    }
    setImproving(false);
  };

  const handleAcceptImproved = async () => {
    // TODO: Call backend to update the entry with improvedText
    // For now, just close the modal
    setShowImprove(false);
    setImprovedText(null);
  };

  console.log("entry", entry)
  console.log('JournalEntry entry:', entry);

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
      console.log('JournalEntry parsedEntry:', parsed);
    } catch (e) {
      setError("Error loading entry summary. Try refreshing.");
      console.log('JournalEntry summary parse error:', e, entry.summary);
    }
  }, [entry, retryCount]);

  useEffect(() => {
    // Always use DB value if present
    if (Array.isArray(entry?.negativePhrases)) {
      setNegativePhrases(
        entry.negativePhrases.map((item: any) =>
          typeof item === 'object' && item !== null && 'negative' in item && 'suggested' in item
            ? item
            : { negative: String(item), suggested: '' }
        )
      );
      setLoadingNegatives(false);
      return;
    }
    // Fallback: extract if DB value is missing
    const fetchNegatives = async () => {
      if (!entry?.journalEntry?.[0]?.text && !entry?.journalEntry2?.[0]?.text) return;
      setLoadingNegatives(true);
      const text = entry.journalEntry?.[0]?.text || entry.journalEntry2?.[0]?.text || "";
      const res = await extractNegativePhrasesAction(text);
      setNegativePhrases(
        Array.isArray(res.negative)
          ? res.negative.map((item: any) =>
              typeof item === 'object' && item !== null && 'negative' in item && 'suggested' in item
                ? item
                : { negative: String(item), suggested: '' }
            )
          : []
      );
      setLoadingNegatives(false);
    };
    fetchNegatives();
  }, [entry]);

  console.log(entry);
  console.log('JournalEntry error:', error);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  // If summary is missing or broken, show 'Incomplete draft.' but still render journal text if present
  if (!entry || !parsedEntry) {
    return (
      <div>
        <div className="text-gray-500 mb-4">Incomplete draft.</div>
        {(entry?.journalEntry?.[0]?.text || entry?.journalEntry2?.[0]?.text) ? (
          <div>
            <h2 className="mt-6 text-3xl font-bold">Journal</h2>
            {entry.journalEntry?.[0]?.text && (
              <p className="mt-5 text-lg">{entry.journalEntry[0].text}</p>
            )}
            {entry.journalEntry2?.[0]?.text && (
              <p className="mt-5 text-lg">{entry.journalEntry2[0].text}</p>
            )}
          </div>
        ) : null}
        {/* Do not render responses for incomplete/broken drafts */}
      </div>
    );
  }

  const sentiment = typeof entry.sentiment === 'number'
    ? entry.sentiment
    : (typeof parsedEntry.sentiment === 'number' ? parsedEntry.sentiment : 0);
  const tags = Array.isArray(parsedEntry.tags) ? parsedEntry.tags : [];
  const entryTags = Array.isArray(entry.tags) ? entry.tags : [];

  // Helper to highlight negative phrases in the rewrite
  function getHighlightedRewrite(text: string, negativePhrases: any[]): string {
    let highlighted = text;
    negativePhrases.forEach(pair => {
      const phrase = pair && typeof pair === 'object' ? pair.negative : pair;
      if (!phrase) return;
      const safePhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(
        new RegExp(safePhrase, 'gi'),
        match => `<mark style="background: #fee2e2; color: #b91c1c; padding: 0 2px; border-radius: 3px;">${match}</mark>`
      );
    });
    return highlighted;
  }

  console.log('JournalEntry journal text:', entry?.journalEntry?.[0]?.text, entry?.journalEntry2?.[0]?.text);
  console.log('JournalEntry tags:', entry?.tags);
  console.log('JournalEntry sentiment:', entry?.sentiment);
  console.log('JournalEntry summary:', parsedEntry?.summary);

  return (
    <div>
      <div>
        <h2 className="mt-6 text-4xl font-bold">
          {parsedEntry?.title || entry?.title || "Untitled"}
        </h2>
        {/* Journal text now appears here */}
        {(entry?.journalEntry?.[0]?.text || entry?.journalEntry2?.[0]?.text) && (
          <div>
            <h2 className="mt-5 text-3xl font-bold">Journal</h2>
            {entry.journalEntry?.[0]?.text && (
              <p className="mt-5 text-lg">{entry.journalEntry[0].text}</p>
            )}
            {entry.journalEntry2?.[0]?.text && (
              <p className="mt-5 text-lg">{entry.journalEntry2[0].text}</p>
            )}
          </div>
        )}
        {typeof entry?.sentiment === 'number' && (
          <div className="mt-5 mr-1 inline-flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: sentimentToColor(entry.sentiment), opacity: 0.7 }}
              title={`Positivity: ${entry.sentiment}`}
            />
            <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold border-0 shadow-sm">
              {sentimentType(entry.sentiment)}
              <span className="ml-2 text-gray-500 font-normal">{Math.round(entry.sentiment)}</span>
            </span>
          </div>
        )}
        
        {/* Sentiment History */}
        {entry?.suggestedResponses && Array.isArray(entry.suggestedResponses) && entry.suggestedResponses.length > 1 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Positivity History:</div>
            <div className="flex gap-1">
              {entry.suggestedResponses.map((historyItem: any, index: number) => (
                <div
                  key={index}
                  className="flex flex-col items-center"
                  title={`${historyItem.version}: ${historyItem.score} (${new Date(historyItem.timestamp).toLocaleTimeString()})`}
                >
                  <div
                    className="w-2 h-8 rounded-sm"
                    style={{ backgroundColor: sentimentToColor(historyItem.score) }}
                  />
                  <span className="text-xs text-gray-400 mt-1">
                    {historyItem.version === 'original' ? 'O' : 'R'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Display only tags from entry.tags column */}
        {entryTags.length > 0 && (
          <div className="mt-4">
            {entryTags.map((tag: string, index: number) => (
              <Badge key={index} className="mr-1">
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Badge>
            ))}
          </div>
        )}
        {/* Summary now appears where journal was */}
        <Separator className="mt-5" />
        <h2 className="mt-6 text-3xl font-bold">Summary</h2>
        {error ? (
          <div className="text-gray-500">No summary available for this entry.</div>
        ) : (
          <p className="mt-5 text-lg">{parsedEntry?.summary ?? ""}</p>
        )}
      </div>
      <Separator className="mt-5" />
      {/* Negative phrasing section */}
      <Separator className="mt-5" />
      <div className="mt-6">
        <h2 className="mt-6 text-3xl font-bold mb-2">Reframing</h2>
        {loadingNegatives ? (
          <p>Analyzing...</p>
        ) : (
          <>
            {/* Highlighted journal text remains above */}
            <div
              className="mb-4 p-3 bg-gray-50 rounded border transition"
              title={negativePhrases.length > 0 ? "Click to improve sentiment" : "No negative phrases detected"}
              onClick={() => {
                if (negativePhrases.length > 0 && !hasReframed && entry?.isOpen !== 'closed') {
                  setShowImprove(true);
                  handleImproveSentiment();
                }
              }}
              style={{
                opacity: negativePhrases.length > 0 && !hasReframed && entry?.isOpen !== 'closed' ? 1 : 0.5,
                pointerEvents: negativePhrases.length > 0 && !hasReframed && entry?.isOpen !== 'closed' ? 'auto' : 'none',
              }}
            >
              <h4 className="font-semibold mb-2 text-base">Journal with Highlights:</h4>
              <div className="text-lg leading-relaxed">
                {(() => {
                  const journalText = entry.journalEntry?.[0]?.text || entry.journalEntry2?.[0]?.text || "";
                  if (!journalText || negativePhrases.length === 0) return <span>{journalText}</span>;
                  let highlighted = journalText;
                  negativePhrases.forEach((pair) => {
                    const phrase = pair && typeof pair === 'object' ? pair.negative : pair;
                    if (!phrase) return;
                    const safePhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    highlighted = highlighted.replace(
                      new RegExp(safePhrase, 'gi'),
                      (match) => `<mark style="background: #fee2e2; color: #b91c1c; padding: 0 2px; border-radius: 3px;">${match}</mark>`
                    );
                  });
                  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
                })()}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {negativePhrases.length > 0 ? "Click to improve sentiment" : "No negative phrases detected."}
              </div>
            </div>
            {/* Side-by-side negative/suggested pairs, only show after clicking highlights */}
            {showImprove && negativePhrases.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2 text-base">AI Suggestions for Negative Sentences</h4>
                <div className="space-y-4">
                  {negativePhrases.length > 0 ? (
                    <div className="mb-4">
                      {/* Progress bar and navigation */}
                      <div className="flex items-center mb-2 gap-2">
                        <button
                          className="px-2 py-1 rounded border text-xs disabled:opacity-50"
                          onClick={handlePrev}
                          disabled={currentPhraseIdx === 0}
                        >
                          Prev
                        </button>
                        <div className="flex-1">
                          <Progress value={((currentPhraseIdx + 1) / totalPhrases) * 100} />
                        </div>
                        <button
                          className="px-2 py-1 rounded border text-xs disabled:opacity-50"
                          onClick={handleNext}
                          disabled={currentPhraseIdx === totalPhrases - 1}
                        >
                          Next
                        </button>
                        <span className="ml-2 text-xs text-gray-500">
                          {currentPhraseIdx + 1} / {totalPhrases}
                        </span>
                      </div>
                      {/* Single negative phrase tabs */}
                      <Tabs defaultValue="suggestion" className="w-full">
                        <div className="flex justify-center w-full">
                          <TabsList>
                            <TabsTrigger value="suggestion">Suggestion</TabsTrigger>
                            <TabsTrigger value="rewrite">Your Rewrite</TabsTrigger>
                          </TabsList>
                        </div>
                        <TabsContent value="suggestion">
                          <div>
                            <span className="block text-xs text-gray-500 mb-1">Original</span>
                            <span className="text-red-600 break-words">{negativePhrases[currentPhraseIdx].negative}</span>
                            <div className="mt-2">
                              <span className="block text-xs text-gray-500 mb-1">AI Suggestion</span>
                              <input
                                type="text"
                                className="w-full p-2 border rounded bg-gray-100 text-green-700"
                                value={negativePhrases[currentPhraseIdx].suggested ?? ''}
                                readOnly
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="rewrite">
                          <div>
                            <span className="block text-xs text-gray-500 mb-1">Original</span>
                            <span className="text-red-600 break-words">{negativePhrases[currentPhraseIdx].negative}</span>
                            <div className="mt-2">
                              <span className="block text-xs text-gray-500 mb-1">Your Rewrite</span>
                              <input
                                type="text"
                                className="w-full p-2 border rounded"
                                value={userRewrites[currentPhraseIdx] ?? ''}
                                onChange={e => handleRewriteChange(currentPhraseIdx, e.target.value)}
                                placeholder="Edit or accept the suggestion"
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  ) : <p className="text-green-700">No negative phrasing detected!</p>}
                </div>
                {negativePhrases.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSaveAllRewrites}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save All"}
                    </button>
                    {saveError && (
                      <p className="text-red-600 text-sm">{saveError}</p>
                    )}
                    {saveSuccess && (
                      <p className="text-green-600 text-sm">✓ Changes saved successfully!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Separator className="mt-5" />
      {(() => {
        const getValidPairs = (obj: any) => {
          if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
          return Object.entries(obj).filter(
            ([k, v]) => typeof k === 'string' && typeof v === 'string' && k.trim() && v.trim()
          );
        };
        const validPairs1 = getValidPairs(entry?.userResponse);
        const validPairs2 = getValidPairs(entry?.userResponse2);
        const hasValidResponses = validPairs1.length > 0 || validPairs2.length > 0;
        if (!hasValidResponses) return null;
        return (
          <div className="my-16">
            <h2 className="mb-7 text-3xl font-bold">Mindfulness Insights</h2>
            <div className="flex flex-col gap-6 mb-6">
              {/* userResponse bubbles */}
              {validPairs1.map(([question, answer], index) => (
                <React.Fragment key={index}>
                  <p className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700">
                    {question}
                  </p>
                  <p className="ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900">
                    {answer || <em>No response</em>}
                  </p>
                </React.Fragment>
              ))}
              {/* userResponse2 bubbles */}
              {validPairs2.map(([question, answer], index) => (
                <React.Fragment key={index}>
                  <p className="mr-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-gray-100 text-gray-700">
                    {question}
                  </p>
                  <p className="ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm break-words bg-blue-100 text-blue-900">
                    {answer || <em>No response</em>}
                  </p>
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })()}
      <Separator className="mt-5" />
      {entry && (
        <div className="mt-6 mb-5">
          <PartialDayJournal entry={entry} />
        </div>
      )}
    </div>
  );
}

export default JournalEntry;
