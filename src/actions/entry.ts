"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import HfInference from "@/huggingface";
import { handleError } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

// Helper to strip <think>...</think> from model output
function extractJsonObjectFromModelResponse(response: string): string {
  return response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export const createEntryAction = async (
  entryId: string,
  journalText: string,
  clientLocalDate?: Date,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to add a note");

    // Use clientLocalDate for local time boundaries if provided
    const now = clientLocalDate ? new Date(clientLocalDate) : new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        preference: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });

    let userPreference = dbUser?.preference;

    const entry = await prisma.entry.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        journalEntry: true,
        userResponse: true,
        createdAt: true,
        updatedAt: true,
        summary: true,
      },
    });

    let formattedEntry = "";
    if (entry.length > 0) {
      formattedEntry = entry
        .map((entry) =>
          `
        Text: ${JSON.stringify(entry.journalEntry)}
        QuestionResponses: ${JSON.stringify(entry.userResponse)}
        Created at: ${entry.createdAt}
        Last updated: ${entry.updatedAt}
        Previous AI Summary: ${entry.summary}
            `.trim(),
        )
        .join("\n\n"); // Added an extra newline for readability
    }

    // Unified AI call for all fields
    const unifiedPrompt = [
      {
        role: "system",
        content: `You are a journaling assistant. Given a user's journal entry, return a single JSON object with the following fields:
 - title: a creative, engaging, and relevant title for the entry (do NOT use generic titles like 'Journal Entry' or 'My Day'). The title should be story-driven and lean toward a positive, growth-oriented framing, even if the entry discusses challenges.
 - summary: a concise summary of the entry, written in second person and looking toward the future (e.g., "You will...", "You are going to...").
 - tags: an array of 1-5 concise tags (single words or short phrases) that best summarize the main topics, emotions, or activities
 - negativePhrases: an array of objects, each with 'negative' (the negative or self-critical sentence) and 'suggested' (a positive or reframed alternative for that sentence)
 - positivity: a number from 0-100 representing the overall positivity of the entry
 - questions: an array of 2-3 reflective questions (each an object with 'question' and 'inputType'). The questions should be insightful, thought-provoking, and encourage deeper self-reflection and growth. Use the user's entries from the past week to make the questions more relevant and connected to their recent experiences. Avoid generic or surface-level questions; make them specific to the user's entry and helpful for personal development.
Respond ONLY with a valid JSON object, no commentary or extra text. Example:
{"title": "A Day of Growth", "summary": "...", "tags": ["productivity", "fatigue"], "negativePhrases": [{"negative": "I felt tired.", "suggested": "I did my best despite being tired."}], "positivity": 42, "questions": [{"question": "...", "inputType": 1}]}`
      },
      {
        role: "user",
        content: journalText
      }
    ];
    const aiOut = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages: unifiedPrompt,
      max_tokens: 1024,
      temperature: 0.1,
    });
    const aiContent = aiOut.choices?.[0]?.message?.content || "{}";
    console.log("[createEntryAction] unified AI model response:", aiContent);
    const cleanAIContent = extractJsonObjectFromModelResponse(aiContent);
    let aiObj: any = {};
    try {
      aiObj = JSON.parse(cleanAIContent);
    } catch {
      aiObj = {};
    }
    // Fallbacks for missing fields
    const title = typeof aiObj.title === 'string' ? aiObj.title : '';
    const summary = typeof aiObj.summary === 'string' ? aiObj.summary : '';
    const tags = Array.isArray(aiObj.tags) ? aiObj.tags : [];
    // negativePhrases is now an array of { negative, suggested }
    const negativePhrases = Array.isArray(aiObj.negativePhrases) ? aiObj.negativePhrases : [];
    // 75 is now the baseline for positivity; below 75 is considered not positive
    const positivity = typeof aiObj.positivity === 'number' && !isNaN(aiObj.positivity)
      ? Math.max(0, Math.min(100, aiObj.positivity))
      : 0;
    const questions = Array.isArray(aiObj.questions) ? aiObj.questions : [];
    // Save all fields to their respective columns
    try {
      const createdAt = clientLocalDate ? new Date(clientLocalDate) : new Date();
      const createdEntry = await prisma.entry.create({
        data: {
          id: entryId,
          authorId: user.id,
          userResponse: JSON.stringify(questions),
          summary: JSON.stringify({ title, summary }),
          sentiment: positivity,
          isOpen: "open",
          createdAt,
          updatedAt: createdAt,
          journalEntry: [
            {
              timestamp: createdAt.toISOString(),
              text: journalText,
            },
          ],
          negativePhrases: negativePhrases,
          tags: tags,
        },
      });
      return { success: true, data: createdEntry };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("🛑 Known Prisma Error:");
        console.error("Code:", err.code);
        console.error("Message:", err.message);
        console.error("Meta:", err.meta);
      } else if (err instanceof Prisma.PrismaClientValidationError) {
        console.error("🛠️ Validation Error:", err.message);
      } else {
        console.error("❓ Unknown Error:", err);
      }
      return {
        success: false,
        message: "Failed to create entry. Check server logs for more details.",
      };
    }

    return { errorMessage: null };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateEntryAction = async (
  entryId: string,
  userResponse: Record<string, string>,
  summary: string,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a note");

    // Extract positivity score from summary
    let positivity = 0;
    let summaryString = summary;
    try {
      const parsedSummary = JSON.parse(summary);
      if (typeof parsedSummary.positivity === 'number' && !isNaN(parsedSummary.positivity)) {
        positivity = Math.max(0, Math.min(100, parsedSummary.positivity));
      }
      delete parsedSummary.positivity;
      summaryString = JSON.stringify(parsedSummary);
    } catch {}

    await prisma.entry.update({
      where: { id: entryId },
      data: { userResponse, summary: summaryString, sentiment: positivity, isOpen: "partial" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const followUpEntryAction = async (
  journalText: string,
  entryId: string,
  clientLocalDate?: Date,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to add a note");

    // Use clientLocalDate for local time boundaries if provided
    const now = clientLocalDate ? new Date(clientLocalDate) : new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preference: true },
    });
    const userPreference = dbUser?.preference;

    let existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    let todaysFormattedEntry = existingEntry
      ? `
        Previous Journal Entry: ${JSON.stringify(existingEntry.journalEntry)}
        QuestionResponses: ${JSON.stringify(existingEntry.userResponse)}
        Created at: ${existingEntry.createdAt}
        Last updated: ${existingEntry.updatedAt}
        Previous AI Summary: ${existingEntry.summary}
      `.trim()
      : "";

    const pastEntries = await prisma.entry.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        journalEntry: true,
        userResponse: true,
        createdAt: true,
        updatedAt: true,
        summary: true,
      },
    });

    const formattedEntry = pastEntries
      .map((entry) =>
        `
        Created at: ${entry.createdAt}
        Journal: ${JSON.stringify(entry.journalEntry)}
        AI Summary: ${entry.summary}
        `.trim(),
      )
      .join("\n\n");

    // Extract tags at follow-up time
    const tagMessages = [
      {
        role: "system",
        content: `You are an assistant that extracts relevant tags or keywords from a user's journal entry. Always return a JSON array of 1-5 concise tags (single words or short phrases) that best summarize the main topics, emotions, or activities in the entry. Do not include explanations, extra text, or objects—just the array. Only return an empty array if the entry is truly empty or meaningless. Example: ["productivity", "fatigue", "video games", "errands", "connection"]`
      },
      {
        role: "user",
        content: journalText
      }
    ];
    const tagOut = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages: tagMessages,
      max_tokens: 128,
      temperature: 0.1,
    });
    const tagContent = tagOut.choices?.[0]?.message?.content || "[]";
    console.log("[followUpEntryAction] tag extraction model response:", tagContent);
    let tags: string[] = [];
    try {
      tags = JSON.parse(tagContent);
    } catch {
      tags = [];
    }

    const messages = [
      {
        role: "system",
        content: `
          You are a warm and thoughtful journaling assistant.
          Based on the user's journal entry, generate 2–3 follow-up reflection questions to encourage gentle self-awareness and insight.
          The tone should be light, observant, and curious — not overly therapeutic or intense unless the content calls for it.
          Vary the question formats (open-ended paragraph, close-ended sentence, and Likert scale) to keep engagement fresh.
          Keep the questions relevant to what the user wrote, helping them reflect on patterns, values, or small joys.

          The tone should match the user's preferred style: "${userPreference}".

          Assume:
          - All entries provided are written by the user.
          - You have access to 7 days of journal context.
          - Your questions should vary in structure and format to stay engaging.

          Use the following input types for variety:
          1. Open-Ended Paragraph
          2. Close-Ended Sentence
          3. Likert Rating Scale

          Respond with valid JSON:
          [
            {
              "question": "Your question here",
              "inputType": 1
            },
            ...
          ]

          —

          **Today's Earlier Planning Journal:**
          ${todaysFormattedEntry}

          **Today's Journal Follow Up:**
          ${journalText}

          **Entries from the Past 7 Days:**
          ${formattedEntry}
        `,
      },
    ];

    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages,
      max_tokens: 1024,
      temperature: 0.1,
    });

    const rawSummary = out.choices?.[0]?.message?.content || "[]";
    console.log(messages);
    console.log(rawSummary);
    const cleanSummary = rawSummary
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();

    // Extract positivity score from summary
    let positivity = 0;
    let summaryString = cleanSummary;
    try {
      const parsedSummary = JSON.parse(cleanSummary);
      if (typeof parsedSummary.positivity === 'number' && !isNaN(parsedSummary.positivity)) {
        positivity = Math.max(0, Math.min(100, parsedSummary.positivity));
      }
      delete parsedSummary.positivity;
      summaryString = JSON.stringify(parsedSummary);
    } catch {}

    // Update or create the entry with follow-up journal, tags, and sentiment
    if (!existingEntry) {
      // Use clientLocalDate for createdAt/updatedAt if provided
      const createdAt = clientLocalDate ? new Date(clientLocalDate) : new Date();
      await prisma.entry.create({
        data: {
          id: entryId,
          authorId: user.id,
          userResponse: "{}", // required, empty object
          userResponse2: cleanSummary,
          summary: summaryString,
          sentiment: positivity,
          isOpen: "partial",
          createdAt,
          updatedAt: createdAt,
          journalEntry: [], // required, empty array
          journalEntry2: [
            {
              timestamp: createdAt.toISOString(),
              text: journalText,
            },
          ],
          tags: tags,
        },
      });
    } else {
      await prisma.entry.update({
        where: { id: entryId },
        data: {
          userResponse2: cleanSummary,
          summary: summaryString,
          sentiment: positivity,
          isOpen: "partial",
          tags: tags,
        },
      });
    }
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateFollowUpEntryAction = async (
  entryId: string,
  userResponse2: Record<string, string>,
  summary: string,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a note");

    // Extract positivity score from summary
    let positivity = 0;
    let summaryString = summary;
    try {
      const parsedSummary = JSON.parse(summary);
      if (typeof parsedSummary.positivity === 'number' && !isNaN(parsedSummary.positivity)) {
        positivity = Math.max(0, Math.min(100, parsedSummary.positivity));
      }
      delete parsedSummary.positivity;
      summaryString = JSON.stringify(parsedSummary);
    } catch {}

    await prisma.entry.update({
      where: { id: entryId },
      data: { userResponse2, summary: summaryString, sentiment: positivity, isOpen: "closed" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updatePreferenceAction = async (
  entryId: string,
  preference: string,
) => {
  try {
    const user = await getUser();
    if (!user)
      throw new Error("You must be logged in to update user preference");

    await prisma.user.update({
      where: { id: entryId },
      data: { preference },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const deleteEntryAction = async (entryId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to delete a note");

    await prisma.entry.delete({
      where: { id: entryId, authorId: user.id },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const AskAIAboutEntryAction = async (
  newQuestion: string[],
  responses: string[],
  weekEntries?: any[],
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to get AI responses");

    let formattedEntry = "";
    if (weekEntries && weekEntries.length > 0) {
      formattedEntry = weekEntries
        .map((entry) =>
          `
          Text: ${JSON.stringify(entry.userResponse)}
          Created at: ${entry.createdAt}
          Last updated: ${entry.updatedAt}
          Previous AI Summary: ${JSON.stringify(entry.summary)}
        `.trim(),
        )
        .join("\n");
    } else {
      const entry = await prisma.entry.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          userResponse: true,
          createdAt: true,
          updatedAt: true,
          summary: true,
        },
      });
      if (entry.length === 0) {
        return "You don't have any journal entries yet";
      }
      formattedEntry = entry
        .map((entry) =>
          `
          Text: ${JSON.stringify(entry.userResponse)}
          Created at: ${entry.createdAt}
          Last updated: ${entry.updatedAt}
          Previous AI Summary: ${entry.summary}
        `.trim(),
        )
        .join("\n");
    }

    const messages = [
      {
        role: "system",
        content: `
          You are a helpful assistant that answers questions about a user's notes. 
          Assume all questions are related to the user's notes. 
          Keep answers succinct and return clean HTML. Use proper HTML tags: 
          <p>, <strong>, <em>, <ul>, <ol>, <li>, <h1>-<h6>, <br>, etc.
          
          Rendered like this in JSX:
          <p dangerouslySetInnerHTML={{ __html: YOUR_RESPONSE }} />
    
          Here are the user's notes:
          ${formattedEntry}
        `,
      },
    ];

    for (let i = 0; i < newQuestion.length; i++) {
      messages.push({ role: "user", content: newQuestion[i] });
      if (responses[i]) {
        messages.push({ role: "assistant", content: responses[i] });
      }
    }
    console.log(messages);
    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages,
      max_tokens: 512,
      temperature: 0.1,
    });
    console.log(out.choices[0].message.content);
    return out.choices[0].message.content || "A problem has occured...";

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const extractNegativePhrasesAction = async (journalText: string) => {
  try {
    // Use the same model and provider as other entry actions
    const messages = [
      {
        role: "system",
        content: `You are an assistant that helps users identify negative or self-critical sentences in their journal entries. Extract and return only the sentences that are negative, self-critical, or express negative emotions. Respond with a JSON array of the negative sentences. If there are none, return an empty array.`
      },
      {
        role: "user",
        content: journalText
      }
    ];
    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages,
      max_tokens: 512,
      temperature: 0.1,
    });
    const content = out.choices?.[0]?.message?.content || "[]";
    // Log the full model response for debugging
    console.log("[extractNegativePhrasesAction] model response:", content);
    let negative: string[] = [];
    try {
      negative = JSON.parse(content);
    } catch {
      negative = [];
    }
    return { negative };
  } catch (error) {
    return { negative: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
};

type EntryObject = {
  [key: string]: string | undefined;
};

export const AISummaryAction = async (entry: EntryObject, journal: string) => {
  try {
    const messages = [];

    const keys = Object.keys(entry);
    for (let i = 0; i < keys.length; i++) {
      const question = keys[i];
      const answer = entry[question];
      if (answer) {
        messages.push({ role: "user", content: question });
        messages.push({ role: "assistant", content: answer });
      }
    }

    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages: [
        {
          role: "system",
          content: `
            You are a helpful assistant that summarizes a user's journal entry. 
            Assume all responses to questions are related to the user's experiences. 
            Keep answers succinct and return a paragraph summary in second person, present tense looking to the future.

            Return all information in the format of valid JSON. All summaries should have a title, a summarization, 3 relevant tags, and a positivity score out of 100. It should be in the format below:
            {
              "title": "Enter a Passage Title Here",
              "summary": "Enter your Summary Here",
              "tags": ["Tag1", "Tag2", "Tag3"],
              "positivity": 87 // a positivity score out of 100, where 100 is extremely positive and 0 is extremely negative
            }

            If the responses don't make sense return something about trying to set yourself up for success instead of just entering random answers.

            **Here is the journal entry from today**
            ${journal}
          `,
        },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.1,
    });
    const rawSummary =
      out.choices?.[0]?.message?.content || "Error summarizing entry.";

    // Remove any <think>...</think> block (including multi-line content)
    const cleanSummary = rawSummary
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();
    console.log(cleanSummary);
    return cleanSummary;
  } catch (error) {
    return handleError(error);
  }
};

export const updateJournalEntryAction = async (
  entryId: string,
  newJournalText: string,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a journal entry");

    // Get the existing entry to preserve other data
    const existingEntry = await prisma.entry.findUnique({
      where: { id: entryId, authorId: user.id },
    });

    if (!existingEntry) {
      throw new Error("Entry not found");
    }

    // Recalculate positivity score using the same AI logic as createEntryAction
    const unifiedPrompt = [
      {
        role: "system",
        content: `You are a journaling assistant. Given a user's journal entry, return a single JSON object with the following fields:
 - title: a creative, engaging, and relevant title for the entry (do NOT use generic titles like 'Journal Entry' or 'My Day'). The title should be story-driven and lean toward a positive, growth-oriented framing, even if the entry discusses challenges.
 - summary: a concise summary of the entry, written in second person and looking toward the future (e.g., "You will...", "You are going to...").
 - tags: an array of 1-5 concise tags (single words or short phrases) that best summarize the main topics, emotions, or activities
 - negativePhrases: an array of objects, each with 'negative' (the negative or self-critical sentence) and 'suggested' (a positive or reframed alternative for that sentence)
 - positivity: a number from 0-100 representing the overall positivity of the entry
 - questions: an array of 2-3 reflective questions (each an object with 'question' and 'inputType'). The questions should be insightful, thought-provoking, and encourage deeper self-reflection and growth. Use the user's entries from the past week to make the questions more relevant and connected to their recent experiences. Avoid generic or surface-level questions; make them specific to the user's entry and helpful for personal development.
Respond ONLY with a valid JSON object, no commentary or extra text. Example:
{"title": "A Day of Growth", "summary": "...", "tags": ["productivity", "fatigue"], "negativePhrases": [{"negative": "I felt tired.", "suggested": "I did my best despite being tired."}], "positivity": 42, "questions": [{"question": "...", "inputType": 1}]}`
      },
      {
        role: "user",
        content: newJournalText
      }
    ];

    const aiOut = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages: unifiedPrompt,
      max_tokens: 1024,
      temperature: 0.1,
    });

    const aiContent = aiOut.choices?.[0]?.message?.content || "{}";
    console.log("[updateJournalEntryAction] AI model response:", aiContent);
    const cleanAIContent = extractJsonObjectFromModelResponse(aiContent);
    let aiObj: any = {};
    try {
      aiObj = JSON.parse(cleanAIContent);
    } catch {
      aiObj = {};
    }

    // Extract fields with fallbacks
    const title = typeof aiObj.title === 'string' ? aiObj.title : '';
    const summary = typeof aiObj.summary === 'string' ? aiObj.summary : '';
    const tags = Array.isArray(aiObj.tags) ? aiObj.tags : [];
    const negativePhrases = Array.isArray(aiObj.negativePhrases) ? aiObj.negativePhrases : [];
    const positivity = typeof aiObj.positivity === 'number' && !isNaN(aiObj.positivity)
      ? Math.max(0, Math.min(100, aiObj.positivity))
      : 0;
    const questions = Array.isArray(aiObj.questions) ? aiObj.questions : [];

    // Get existing sentiment history from sentimentHistory field
    let sentimentHistory = [];
    try {
      if (existingEntry.sentimentHistory) {
        sentimentHistory = Array.isArray(existingEntry.sentimentHistory) 
          ? existingEntry.sentimentHistory 
          : JSON.parse(existingEntry.sentimentHistory as string);
      } else if (typeof existingEntry.sentiment === 'number') {
        // Convert single number to history format
        sentimentHistory = [{
          score: existingEntry.sentiment,
          timestamp: existingEntry.createdAt.toISOString(),
          version: 'original'
        }];
      }
    } catch (e) {
      // If parsing fails, start with empty array
      sentimentHistory = [];
    }

    // Add new positivity score to history
    const newSentimentEntry = {
      score: positivity,
      timestamp: new Date().toISOString(),
      version: 'reframed'
    };
    sentimentHistory.push(newSentimentEntry);

    // Update the entry with new journal text and sentiment history
    const updatedEntry = await prisma.entry.update({
      where: { id: entryId, authorId: user.id },
      data: {
        journalEntry: [
          {
            timestamp: new Date().toISOString(),
            text: newJournalText,
          },
        ],
        summary: JSON.stringify({ title, summary }),
        sentiment: positivity, // Keep current score as latest
        sentimentHistory: sentimentHistory, // Store full history
        negativePhrases: negativePhrases,
        tags: tags,
        userResponse: JSON.stringify(questions),
        updatedAt: new Date(),
      },
    });

    return { 
      success: true, 
      data: updatedEntry,
      newPositivity: positivity,
      newSummary: { title, summary },
      newTags: tags,
      newNegativePhrases: negativePhrases,
      sentimentHistory: sentimentHistory,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
