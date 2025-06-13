/*
  Warnings:

  - Changed the type of `journalEntry` on the `Entry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "journalEntry",
ADD COLUMN     "journalEntry" JSONB NOT NULL;
