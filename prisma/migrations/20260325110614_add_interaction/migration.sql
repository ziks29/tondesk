/*
  Warnings:

  - You are about to drop the column `openRouterKey` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `openRouterModel` on the `Bot` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "aiIntent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT,
    "ownerWallet" TEXT NOT NULL,
    "knowledgeBaseText" TEXT NOT NULL,
    "aiModel" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secretToken" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "welcomeMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bot" ("botToken", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "updatedAt") SELECT "botToken", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "updatedAt" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
CREATE UNIQUE INDEX "Bot_botToken_key" ON "Bot"("botToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
