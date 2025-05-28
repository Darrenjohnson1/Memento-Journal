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
      data: { id: entryId, authorId: user.id, text: "" },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateEntryAction = async (entryId: string, text: string) => {
  try {
    const user = await getUser;
    if (!user) throw new Error("You must be logged in to update a note");

    await prisma.entry.update({
      where: { id: entryId },
      data: { text },
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
      select: { text: true, createdAt: true, updatedAt: true },
    });

    if (entry.length === 0) {
      return "You don't have any journal entries yet";
    }

    const formattedEntry = entry
      .map((entry) =>
        `
        Text: ${entry.text}
        Created at: ${entry.createdAt}
        Last updated: ${entry.updatedAt}
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

    const out = await HfInference.chatCompletion({
      model: "Qwen/Qwen3-32B",
      provider: "cerebras",
      messages,
      max_tokens: 512,
      temperature: 0.1,
    });

    return console.log(
      out.choices[0].message.content || "A problem has occured...",
    );

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};
