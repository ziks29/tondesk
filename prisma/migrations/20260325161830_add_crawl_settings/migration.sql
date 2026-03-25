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
    "webSearchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crawlMaxDepth" INTEGER NOT NULL DEFAULT 2,
    "crawlMaxPages" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bot" ("aiModel", "botToken", "botUsername", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "systemPrompt", "updatedAt", "webSearchEnabled", "welcomeMessage") SELECT "aiModel", "botToken", "botUsername", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "systemPrompt", "updatedAt", "webSearchEnabled", "welcomeMessage" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
CREATE UNIQUE INDEX "Bot_botToken_key" ON "Bot"("botToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
