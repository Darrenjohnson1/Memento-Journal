"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import HfInference from "@/huggingface";
import { handleError } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export const createEntryAction = async (
  entryId: string,
  journalText: string,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to add a note");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

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

    const messages = [
      {
        role: "system",
        content: `
          You are a thoughtful and concise journaling assistant.

          Your task is to generate 2–3 insightful, reflective questions to help them plan for the day before it happens, in present tense. Your questions should help the user deepen their self-awareness, reflect on their patterns. The tone should match the user's preferred style: "${userPreference}".

          Assume:
          - All entries provided are written by the user.
          - You have access to 7 days of journal context.
          - Your questions should vary in structure and format to stay engaging.

          Use the following input types for variety:
          1. Open-Ended Paragraph (e.g., "What’s one thing you’re proud of from today?")
          2. Close-Ended Sentence (e.g., "Did you feel in control of your time today?")
          3. Likert Rating Scale (e.g., "On a scale of 1–5, how well did you manage stress today?")

          **Always respond with valid JSON** in this format:

          [
            {
              "question": "Your question here",
              "inputType": 1
            },
            ...
          ]


          If there are no journal entries yet, ask thoughtful, open-ended questions to learn more about the user and their daily life.

          —

          **Today’s Journal Entry:**
          ${journalText}

          **Entries from the Past 7 Days:**
          ${formattedEntry}
        `,
      },
    ];
    console.log(messages);
    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages,
      max_tokens: 1024,
      temperature: 0.1,
    });

    const rawSummary =
      out.choices?.[0]?.message?.content || "Error summarizing entry.";

    const cleanSummary = rawSummary
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .trim();

    console.log(cleanSummary);
    let parsedSummary = JSON.parse(cleanSummary);
    try {
      const createdEntry = await prisma.entry.create({
        data: {
          id: entryId,
          authorId: user.id,
          userResponse: cleanSummary,
          summary: '{"title": "Started Draft"}',
          isOpen: "open",
          journalEntry: [
            {
              timestamp: new Date().toISOString(),
              text: journalText,
            },
          ],
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

    await prisma.entry.update({
      where: { id: entryId },
      data: { userResponse, summary, isOpen: "partial" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const followUpEntryAction = async (
  journalText: string,
  entryId: string,
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to add a note");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        preference: true,
      },
    });

    const userPreference = dbUser?.preference;

    const now = new Date();
    const startOfLogicalDay = new Date(now);
    startOfLogicalDay.setHours(5, 0, 0, 0);
    if (now < startOfLogicalDay) {
      startOfLogicalDay.setDate(startOfLogicalDay.getDate() - 1);
    }

    let existingEntry = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    // const todayEntry = await prisma.entry.findFirst({
    //   where: {
    //     authorId: user.id,
    //     createdAt: {
    //       gte: startOfLogicalDay,
    //     },
    //   },
    //   orderBy: {
    //     createdAt: "desc",
    //   },
    //   select: {
    //     journalEntry: true,
    //     userResponse: true,
    //     createdAt: true,
    //     updatedAt: true,
    //     summary: true,
    //   },
    // });

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
      // .map((entry) =>
      //   `
      //   Text: ${JSON.stringify(entry.journalEntry)}
      //   QuestionResponses: ${JSON.stringify(entry.userResponse)}
      //   Created at: ${entry.createdAt}
      //   Last updated: ${entry.updatedAt}
      //   Previous AI Summary: ${entry.summary}
      //   `.trim(),
      // )
      // .join("\n\n");
      .map((entry) =>
        `
        Created at: ${entry.createdAt}
        Journal: ${JSON.stringify(entry.journalEntry)}
        AI Summary: ${entry.summary}
        `.trim(),
      )
      .join("\n\n");

    const messages = [
      {
        role: "system",
        content: `
          You are a thoughtful and concise journaling assistant.

          Your task is to generate 2–3 insightful, reflective questions to follow up on the day, in past tense. Your questions should help the user deepen their self-awareness, reflect on their patterns. The tone should match the user's preferred style: "${userPreference}".

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

          **Today’s Journal Follow Up:**
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

    // const parsedFollowUpQuestions: Record<string, string>[] =
    //   JSON.parse(cleanSummary);

    // Merge new questions with existing userResponse
    // const existingUserResponse = existingEntry.userResponse || {};
    // const combinedUserResponse = {
    //   ...existingUserResponse,
    //   [`followUp_${new Date().toISOString()}`]: parsedFollowUpQuestions,
    // };

    // const updatedJournalEntry = [
    //   ...(existingEntry.journalEntry || []),
    //   {
    //     timestamp: new Date().toISOString(),
    //     text: journalText,
    //   },
    // ];
    if (!existingEntry) {
      const updated = await prisma.entry.create({
        data: {
          id: entryId,
          authorId: user.id,
          userResponse: "",
          userResponse2: cleanSummary,
          summary: '{"title": "Started End of Day Draft"}',
          isOpen: "partial_open",
          journalEntry: [{}],
          journalEntry2: [
            {
              timestamp: new Date().toISOString(),
              text: journalText,
            },
          ],
        },
      });
      return { success: true, data: updated };
    } else {
      const updated = await prisma.entry.update({
        where: { id: entryId },
        data: {
          journalEntry2: [
            {
              timestamp: new Date().toISOString(),
              text: journalText,
            },
          ],
          userResponse2: cleanSummary,
          isOpen: "partial_open",
        },
      });
      return { success: true, data: updated };
    }
  } catch (error) {
    console.error("Follow-up error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
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

    await prisma.entry.update({
      where: { id: entryId },
      data: { userResponse2, summary, isOpen: "closed" },
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
) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to get AI responses");

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

    const formattedEntry = entry
      .map((entry) =>
        `
        Text: ${JSON.stringify(entry.userResponse)}
        Created at: ${entry.createdAt}
        Last updated: ${entry.updatedAt}
        Previous AI Summary: ${entry.summary}
      `.trim(),
      )
      .join("\n");

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

            Return all information in the format of valid JSON. All summaries should have a title a summarization, and 3 relevant tags. It should in the format below:
            
            {
              "title": "Enter a Passage Title Here",
              "summary": "Enter your Summary Here",
              "tags": ["Tag1", "Tag2", "Tag3"],
              "sentiment": 0.0
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
