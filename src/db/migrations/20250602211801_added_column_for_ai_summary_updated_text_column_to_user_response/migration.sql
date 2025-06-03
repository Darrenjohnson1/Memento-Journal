/*
  Warnings:

  - You are about to drop the column `text` on the `Entry` table. All the data in the column will be lost.
  - Added the required column `summary` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userResponse` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "text",
ADD COLUMN     "summary" TEXT NOT NULL,
ADD COLUMN     "userResponse" JSONB NOT NULL;
