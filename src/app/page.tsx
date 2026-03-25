"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { initData, useRawInitData, useSignal } from "@tma.js/sdk-react";
import {
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";

import { Page } from "@/components/Page";
import { useTheme } from "@/core/theme/provider";

import { BotsSection } from "./home/components/BotsSection";
import { DeployBotSection } from "./home/components/DeployBotSection";
import { HomeHero } from "./home/components/HomeHero";
import { WalletSection } from "./home/components/WalletSection";
import {
  DEFAULT_MODEL_ID,
  DEFAULT_SYSTEM_PROMPT,
  TOP_UP_AMOUNTS,
} from "./home/constants";
import {
  BotRecord,
  DeployFormState,
  EditFormState,
  WalletSummary,
} from "./home/types";

const initialDeployForm: DeployFormState = {
  botToken: "",
  systemPrompt: "",
  welcomeMessage: "",
  knowledgeBaseText: "",
  webSearchEnabled: false,
  crawlMaxDepth: 2,
  crawlMaxPages: 10,
  urls: [""],
  files: [],
};

const initialEditForm: EditFormState = {
  botId: null,
  knowledgeBaseText: "",
  aiModel: DEFAULT_MODEL_ID,
  systemPrompt: "",
  welcomeMessage: "",
  webSearchEnabled: false,
  crawlMaxDepth: 2,
  crawlMaxPages: 10,
  urls: [""],
  files: [],
};

export default function Home() {
  const tgUser = useSignal(initData.user);
  const initDataRaw = useRawInitData();
  const wallet = useTonWallet();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { isDarkMode } = useTheme();
  const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS;

  const [deployForm, setDeployForm] = useState<DeployFormState>(initialDeployForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isTopUpPending, setIsTopUpPending] = useState<number | null>(null);
  const [customTopUpAmount, setCustomTopUpAmount] = useState("3");
  const [walletStatus, setWalletStatus] = useState("");
  const [walletError, setWalletError] = useState("");

  const [myBots, setMyBots] = useState<BotRecord[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const createAuthHeaders = (contentType?: string) => {
    const headers = new Headers();
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    if (initDataRaw) {
      headers.set("Authorization", `tma ${initDataRaw}`);
    }
    return headers;
  };

  const getSelectedModel = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tondesk_ai_model") || DEFAULT_MODEL_ID;
    }
    return DEFAULT_MODEL_ID;
  };

  const isFormValid = useMemo(() => {
    const hasText = deployForm.knowledgeBaseText.trim().length >= 10;
    const hasUrls = deployForm.urls.some((url) => url.trim().startsWith("http"));
    const hasFiles = deployForm.files.length > 0;

    return deployForm.botToken.trim().length > 10 && (hasText || hasUrls || hasFiles);
  }, [deployForm]);

  const fetchWalletSummary = async () => {
    if (!walletAddress) {
      setWalletSummary(null);
      return;
    }

    setIsLoadingWallet(true);
    try {
      const res = await fetch(
        `/api/user/wallet?wallet=${encodeURIComponent(walletAddress)}`,
        { headers: createAuthHeaders() },
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        setWalletSummary(data.wallet);
      }
    } catch (fetchError) {
      console.error("Failed to fetch wallet:", fetchError);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const fetchMyBots = async () => {
    if (!walletAddress) {
      setMyBots([]);
      return;
    }

    setIsLoadingBots(true);
    try {
      const res = await fetch(`/api/bots/list?wallet=${walletAddress}`, {
        headers: createAuthHeaders(),
      });
      const data = await res.json();
      if (data.ok) {
        setMyBots(data.bots);
      }
    } catch (fetchError) {
      console.error("Failed to fetch bots:", fetchError);
    } finally {
      setIsLoadingBots(false);
    }
  };

  useEffect(() => {
    fetchMyBots();
    fetchWalletSummary();
  }, [walletAddress, initDataRaw]);

  async function handleDeploy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!wallet || !walletAddress) {
      setError("Connect your TON wallet before deploying.");
      return;
    }

    setIsDeploying(true);

    try {
      setStatus("Step 1/1: Extracting content and deploying...");

      const formData = new FormData();
      formData.append("botToken", deployForm.botToken.trim());
      formData.append("ownerWallet", walletAddress);
      formData.append("knowledgeBaseText", deployForm.knowledgeBaseText.trim());
      formData.append("aiModel", getSelectedModel());

      if (
        deployForm.systemPrompt.trim() &&
        deployForm.systemPrompt.trim() !== DEFAULT_SYSTEM_PROMPT
      ) {
        formData.append("systemPrompt", deployForm.systemPrompt.trim());
      }
      if (deployForm.welcomeMessage.trim()) {
        formData.append("welcomeMessage", deployForm.welcomeMessage.trim());
      }

      formData.append("webSearchEnabled", String(deployForm.webSearchEnabled));
      formData.append("crawlMaxDepth", String(deployForm.crawlMaxDepth));
      formData.append("crawlMaxPages", String(deployForm.crawlMaxPages));
      formData.append(
        "urls",
        JSON.stringify(
          deployForm.urls.filter((url) => url.trim().startsWith("http")),
        ),
      );
      deployForm.files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/bots/deploy", {
        method: "POST",
        headers: createAuthHeaders(),
        body: formData,
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed.");
      }

      setStatus(data.message || "Bot deployed successfully.");
      setDeployForm(initialDeployForm);
      fetchMyBots();
      fetchWalletSummary();
    } catch (deployError) {
      setError(
        deployError instanceof Error
          ? deployError.message
          : "Unexpected deployment error.",
      );
    } finally {
      setIsDeploying(false);
    }
  }

  const toggleBotStatus = async (botId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/bots/toggle", {
        method: "POST",
        headers: createAuthHeaders("application/json"),
        body: JSON.stringify({ botId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setMyBots((currentBots) =>
          currentBots.map((bot) =>
            bot.id === botId ? { ...bot, isActive: !currentStatus } : bot,
          ),
        );
      }
    } catch (toggleError) {
      console.error("Failed to toggle bot:", toggleError);
    }
  };

  const startEditingBot = (bot: BotRecord) => {
    setEditForm({
      botId: bot.id,
      knowledgeBaseText: bot.knowledgeBaseText || "",
      aiModel: bot.aiModel || DEFAULT_MODEL_ID,
      systemPrompt: bot.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      welcomeMessage: bot.welcomeMessage || "",
      webSearchEnabled: bot.webSearchEnabled ?? false,
      crawlMaxDepth: bot.crawlMaxDepth ?? 2,
      crawlMaxPages: bot.crawlMaxPages ?? 10,
      urls: [""],
      files: [],
    });
  };

  const cancelEditingBot = () => {
    setEditForm(initialEditForm);
  };

  const saveBotEdits = async (botId: string) => {
    if (!walletAddress) {
      return;
    }

    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("botId", botId);
      formData.append("ownerWallet", walletAddress);
      formData.append("knowledgeBaseText", editForm.knowledgeBaseText.trim());
      formData.append("aiModel", editForm.aiModel);

      if (editForm.systemPrompt && editForm.systemPrompt !== DEFAULT_SYSTEM_PROMPT) {
        formData.append("systemPrompt", editForm.systemPrompt);
      }
      if (editForm.welcomeMessage) {
        formData.append("welcomeMessage", editForm.welcomeMessage);
      }

      formData.append("webSearchEnabled", String(editForm.webSearchEnabled));
      formData.append("crawlMaxDepth", String(editForm.crawlMaxDepth));
      formData.append("crawlMaxPages", String(editForm.crawlMaxPages));

      const validUrls = editForm.urls.filter((url) => url.trim());
      if (validUrls.length > 0) {
        formData.append("urls", JSON.stringify(validUrls));
      }

      editForm.files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/bots/edit", {
        method: "POST",
        headers: createAuthHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMyBots((currentBots) =>
          currentBots.map((bot) =>
            bot.id === botId
              ? {
                  ...bot,
                  knowledgeBaseText: data.bot.knowledgeBaseText,
                  aiModel: data.bot.aiModel,
                  systemPrompt: data.bot.systemPrompt,
                  welcomeMessage: data.bot.welcomeMessage,
                  webSearchEnabled: data.bot.webSearchEnabled,
                  crawlMaxDepth: data.bot.crawlMaxDepth,
                  crawlMaxPages: data.bot.crawlMaxPages,
                }
              : bot,
          ),
        );
        setEditForm(initialEditForm);
      } else {
        alert(data.error || "Failed to edit bot");
      }
    } catch (editError) {
      console.error("Failed to edit bot:", editError);
      alert("Failed to save changes.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!walletAddress) {
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this bot? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/bots/delete", {
        method: "POST",
        headers: createAuthHeaders("application/json"),
        body: JSON.stringify({ botId, ownerWallet: walletAddress }),
      });

      if (res.ok) {
        setMyBots((currentBots) => currentBots.filter((bot) => bot.id !== botId));
        fetchWalletSummary();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete bot");
      }
    } catch (deleteError) {
      console.error("Failed to delete bot:", deleteError);
    }
  };

  const handleTopUp = async (amountTon: number) => {
    const normalizedAmount = Number(amountTon.toFixed(4));

    if (!walletAddress) {
      setWalletError("Connect your TON wallet before topping up.");
      return;
    }
    if (!masterWalletAddress) {
      setWalletError("NEXT_PUBLIC_MASTER_WALLET_ADDRESS is not configured.");
      return;
    }
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setWalletError("Enter a valid TON amount greater than 0.");
      return;
    }

    setWalletError("");
    setWalletStatus(`Preparing ${normalizedAmount} TON top-up...`);
    setIsTopUpPending(normalizedAmount);

    try {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: masterWalletAddress,
            amount: String(Math.round(normalizedAmount * 1_000_000_000)),
          },
        ],
      });

      setWalletStatus("Transaction sent. Creating pending top-up...");

      const initRes = await fetch("/api/user/wallet/topup", {
        method: "POST",
        headers: createAuthHeaders("application/json"),
        body: JSON.stringify({
          walletAddress,
          amountTon: normalizedAmount,
          tonConnectTxHash: "boc" in result ? result.boc : null,
        }),
      });
      const initData = await initRes.json();

      if (!initRes.ok || !initData.transaction?.id) {
        throw new Error(
          initData.error || "Failed to initialize top-up verification.",
        );
      }

      const pendingTransactionId = initData.transaction.id as string;
      setWalletStatus("Transaction sent. Waiting for blockchain confirmation...");

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const confirmRes = await fetch("/api/user/wallet/topup/confirm", {
          method: "POST",
          headers: createAuthHeaders("application/json"),
          body: JSON.stringify({ transactionId: pendingTransactionId }),
        });
        const confirmData = await confirmRes.json();

        if (!confirmRes.ok) {
          throw new Error(confirmData.error || "Top-up verification failed.");
        }

        if (confirmData.status === "completed") {
          setWalletSummary((current) =>
            current
              ? {
                  ...current,
                  credits: confirmData.wallet.credits,
                  totalTopups: confirmData.wallet.totalTopups,
                  transactions: [confirmData.transaction, ...current.transactions].slice(0, 10),
                }
              : current,
          );
          setWalletStatus(
            `Wallet topped up with ${normalizedAmount} TON after on-chain verification.`,
          );
          return;
        }

        if (confirmData.status === "failed") {
          throw new Error(confirmData.error || "Top-up verification failed.");
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      setWalletStatus(
        "Transaction sent. Verification is still pending on-chain. Please check again in a moment.",
      );
      fetchWalletSummary();
    } catch (topUpError) {
      setWalletError(
        topUpError instanceof Error ? topUpError.message : "Top-up was cancelled.",
      );
      setWalletStatus("");
    } finally {
      setIsTopUpPending(null);
    }
  };

  return (
    <Page back={false}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={`absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? "bg-[#0088cc]" : "bg-[#0088cc]/30"}`}
        />
        <div
          className={`absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? "bg-purple-600" : "bg-purple-600/20"}`}
        />
      </div>

      <main className="relative mx-auto min-h-screen w-full max-w-none px-4 py-4 sm:px-6 sm:py-6 md:max-w-7xl md:px-8 md:py-12 lg:px-12 lg:py-16">
        <HomeHero
          isDarkMode={isDarkMode}
          telegramUsername={tgUser?.username ?? "telegram-user"}
        />

        <WalletSection
          isDarkMode={isDarkMode}
          walletAddress={walletAddress}
          walletSummary={walletSummary}
          isLoadingWallet={isLoadingWallet}
          topUpAmounts={TOP_UP_AMOUNTS}
          isTopUpPending={isTopUpPending}
          customTopUpAmount={customTopUpAmount}
          walletError={walletError}
          walletStatus={walletStatus}
          onTopUp={handleTopUp}
          onCustomAmountChange={setCustomTopUpAmount}
          onCustomTopUp={() => handleTopUp(Number(customTopUpAmount))}
        />

        <div className="grid grid-cols-1 gap-4 px-0 sm:gap-5 md:gap-6 lg:grid-cols-12 lg:gap-8">
          <DeployBotSection
            isDarkMode={isDarkMode}
            form={deployForm}
            error={error}
            status={status}
            isFormValid={isFormValid}
            isDeploying={isDeploying}
            isWalletConnected={Boolean(wallet)}
            onSubmit={handleDeploy}
            onBotTokenChange={(value) =>
              setDeployForm((current) => ({ ...current, botToken: value }))
            }
            onSystemPromptChange={(value) =>
              setDeployForm((current) => ({ ...current, systemPrompt: value }))
            }
            onWelcomeMessageChange={(value) =>
              setDeployForm((current) => ({ ...current, welcomeMessage: value }))
            }
            onKnowledgeBaseChange={(value) =>
              setDeployForm((current) => ({ ...current, knowledgeBaseText: value }))
            }
            onToggleWebSearch={() =>
              setDeployForm((current) => ({
                ...current,
                webSearchEnabled: !current.webSearchEnabled,
              }))
            }
            onCrawlMaxDepthChange={(value) =>
              setDeployForm((current) => ({ ...current, crawlMaxDepth: value }))
            }
            onCrawlMaxPagesChange={(value) =>
              setDeployForm((current) => ({ ...current, crawlMaxPages: value }))
            }
            onAddUrl={() =>
              setDeployForm((current) => ({ ...current, urls: [...current.urls, ""] }))
            }
            onUpdateUrl={(index, value) =>
              setDeployForm((current) => ({
                ...current,
                urls: current.urls.map((url, currentIndex) =>
                  currentIndex === index ? value : url,
                ),
              }))
            }
            onRemoveUrl={(index) =>
              setDeployForm((current) => ({
                ...current,
                urls: current.urls.filter((_, currentIndex) => currentIndex !== index),
              }))
            }
            onFilesChange={(files) =>
              setDeployForm((current) => ({
                ...current,
                files: files ? Array.from(files) : [],
              }))
            }
            onRemoveFile={(index) =>
              setDeployForm((current) => ({
                ...current,
                files: current.files.filter((_, currentIndex) => currentIndex !== index),
              }))
            }
          />

          <BotsSection
            isDarkMode={isDarkMode}
            bots={myBots}
            isLoadingBots={isLoadingBots}
            editingBotId={editForm.botId}
            editForm={editForm}
            isSavingEdit={isSavingEdit}
            onRefresh={fetchMyBots}
            onToggleBotStatus={toggleBotStatus}
            onStartEditingBot={startEditingBot}
            onDeleteBot={deleteBot}
            onCancelEditingBot={cancelEditingBot}
            onSaveBotEdits={saveBotEdits}
            onEditAiModelChange={(value) =>
              setEditForm((current) => ({ ...current, aiModel: value }))
            }
            onEditSystemPromptChange={(value) =>
              setEditForm((current) => ({ ...current, systemPrompt: value }))
            }
            onEditWelcomeMessageChange={(value) =>
              setEditForm((current) => ({ ...current, welcomeMessage: value }))
            }
            onEditKnowledgeBaseChange={(value) =>
              setEditForm((current) => ({ ...current, knowledgeBaseText: value }))
            }
            onAddEditUrl={() =>
              setEditForm((current) => ({ ...current, urls: [...current.urls, ""] }))
            }
            onUpdateEditUrl={(index, value) =>
              setEditForm((current) => ({
                ...current,
                urls: current.urls.map((url, currentIndex) =>
                  currentIndex === index ? value : url,
                ),
              }))
            }
            onRemoveEditUrl={(index) =>
              setEditForm((current) => ({
                ...current,
                urls: current.urls.filter((_, currentIndex) => currentIndex !== index),
              }))
            }
            onEditFilesChange={(files) =>
              setEditForm((current) => ({
                ...current,
                files: files ? Array.from(files) : [],
              }))
            }
            onRemoveEditFile={(index) =>
              setEditForm((current) => ({
                ...current,
                files: current.files.filter((_, currentIndex) => currentIndex !== index),
              }))
            }
            onEditCrawlMaxDepthChange={(value) =>
              setEditForm((current) => ({ ...current, crawlMaxDepth: value }))
            }
            onEditCrawlMaxPagesChange={(value) =>
              setEditForm((current) => ({ ...current, crawlMaxPages: value }))
            }
            onToggleEditWebSearch={() =>
              setEditForm((current) => ({
                ...current,
                webSearchEnabled: !current.webSearchEnabled,
              }))
            }
          />
        </div>
      </main>
    </Page>
  );
}
