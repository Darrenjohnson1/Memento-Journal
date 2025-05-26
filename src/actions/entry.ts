"use server";

import { getUser } from "@/auth/server";
import prisma from "@/db/prisma";
import { handleError } from "@/lib/utils";

export const createEntryAction = async (entryId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a note");

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
