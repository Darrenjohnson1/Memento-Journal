/*
  Warnings:

  - Added the required column `journalEntry` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "journalEntry" TEXT NOT NULL;
