/*
  Warnings:

  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Bot" ADD COLUMN "openRouterKey" TEXT;
ALTER TABLE "Bot" ADD COLUMN "openRouterModel" TEXT DEFAULT 'google/gemini-flash-1.5';

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Settings";
PRAGMA foreign_keys=on;
