/*
  Warnings:

  - Added the required column `isOpen` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preference` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('aborted', 'partial', 'partial_aborted', 'closed');

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "isOpen" "EntryStatus" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preference" TEXT NOT NULL;
