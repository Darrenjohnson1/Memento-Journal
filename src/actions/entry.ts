"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
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

    await prisma.entry.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { text: true, createdAt: true, updatedAt: true },
    });

    if (entry.lenth === 0) {
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

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};
