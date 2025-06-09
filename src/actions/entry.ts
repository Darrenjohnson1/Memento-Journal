"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import HfInference from "@/huggingface";
import { handleError } from "@/lib/utils";

export const createEntryAction = async (entryId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to add a note");

    await prisma.entry.create({
      data: { id: entryId, authorId: user.id, userResponse: "", summary: "" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
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
      data: { userResponse, summary },
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

export const AISummaryAction = async (entry: EntryObject) => {
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
              "tags": ["tag1", "tag2", "tag3"],
              "sentiment": 0.0
            }

            If the responses don't make sense return something about trying to set yourself up for success instead of just entering random answers.
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
