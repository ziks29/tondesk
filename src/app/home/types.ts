export type WalletTransaction = {
  id: string;
  amount: number;
  credits: number;
  type: string;
  status: string;
  createdAt: string;
};

export type WalletSummary = {
  walletAddress: string;
  credits: number;
  totalTopups: number;
  botCount: number;
  transactions: WalletTransaction[];
};

export type BotRecord = {
  id: string;
  botUsername?: string | null;
  botToken: string;
  createdAt: string;
  isActive: boolean;
  totalInteractions?: number | null;
  totalUniqueUsers?: number | null;
  aiModel?: string | null;
  knowledgeBaseText?: string | null;
  systemPrompt?: string | null;
  welcomeMessage?: string | null;
  webSearchEnabled?: boolean | null;
  crawlMaxDepth?: number | null;
  crawlMaxPages?: number | null;
};

export type DeployFormState = {
  botToken: string;
  systemPrompt: string;
  welcomeMessage: string;
  knowledgeBaseText: string;
  webSearchEnabled: boolean;
  crawlMaxDepth: number;
  crawlMaxPages: number;
  urls: string[];
  files: File[];
};

export type EditFormState = {
  botId: string | null;
  knowledgeBaseText: string;
  aiModel: string;
  systemPrompt: string;
  welcomeMessage: string;
  webSearchEnabled: boolean;
  crawlMaxDepth: number;
  crawlMaxPages: number;
  urls: string[];
  files: File[];
};
