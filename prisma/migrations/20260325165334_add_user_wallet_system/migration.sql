-- CreateTable
CREATE TABLE "User" (
    "walletAddress" TEXT NOT NULL PRIMARY KEY,
    "credits" REAL NOT NULL DEFAULT 0,
    "totalTopups" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "credits" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "tonConnectTxHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "User" ("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT,
    "ownerWallet" TEXT NOT NULL,
    "userWalletAddress" TEXT,
    "knowledgeBaseText" TEXT NOT NULL,
    "crawledUrls" TEXT NOT NULL DEFAULT '[]',
    "aiModel" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-001',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secretToken" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "welcomeMessage" TEXT,
    "webSearchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crawlMaxDepth" INTEGER NOT NULL DEFAULT 2,
    "crawlMaxPages" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bot_userWalletAddress_fkey" FOREIGN KEY ("userWalletAddress") REFERENCES "User" ("walletAddress") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bot" ("aiModel", "botToken", "botUsername", "crawlMaxDepth", "crawlMaxPages", "crawledUrls", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "systemPrompt", "updatedAt", "webSearchEnabled", "welcomeMessage", "userWalletAddress") SELECT "aiModel", "botToken", "botUsername", "crawlMaxDepth", "crawlMaxPages", "crawledUrls", "createdAt", "id", "isActive", "knowledgeBaseText", "ownerWallet", "secretToken", "systemPrompt", "updatedAt", "webSearchEnabled", "welcomeMessage", "ownerWallet" FROM "Bot";
DROP TABLE "Bot";
ALTER TABLE "new_Bot" RENAME TO "Bot";
CREATE UNIQUE INDEX "Bot_botToken_key" ON "Bot"("botToken");
CREATE TABLE "new_Interaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "aiResponse" TEXT NOT NULL,
    "aiIntent" TEXT,
    "creditsUsed" REAL NOT NULL DEFAULT 0.1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaction_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interaction" ("aiIntent", "aiResponse", "botId", "chatId", "createdAt", "id", "userInput") SELECT "aiIntent", "aiResponse", "botId", "chatId", "createdAt", "id", "userInput" FROM "Interaction";
DROP TABLE "Interaction";
ALTER TABLE "new_Interaction" RENAME TO "Interaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
