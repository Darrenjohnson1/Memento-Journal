/*
  Warnings:

  - The values [aborted,partial_aborted] on the enum `EntryStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EntryStatus_new" AS ENUM ('open', 'partial', 'partial_open', 'closed');
ALTER TABLE "Entry" ALTER COLUMN "isOpen" TYPE "EntryStatus_new" USING ("isOpen"::text::"EntryStatus_new");
ALTER TYPE "EntryStatus" RENAME TO "EntryStatus_old";
ALTER TYPE "EntryStatus_new" RENAME TO "EntryStatus";
DROP TYPE "EntryStatus_old";
COMMIT;
