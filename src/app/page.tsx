'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { initData, useRawInitData, useSignal } from '@tma.js/sdk-react';
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import { FileText, Globe, Loader2, Plus, Settings, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';

import { Page } from '@/components/Page';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/core/theme/provider';

const MODELS = [
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', desc: 'Fast & Smart (Default) • Web Search ✓' },
  { id: 'anthropic/claude-3.5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Lightweight & Efficient • Web Search ✓' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Powerful Reasoning' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', desc: 'Free Tier' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', desc: 'Advanced Logic' },
];

const TOP_UP_AMOUNTS = [0.5, 1, 2];

type WalletTransaction = {
  id: string;
  amount: number;
  credits: number;
  type: string;
  status: string;
  createdAt: string;
};

type WalletSummary = {
  walletAddress: string;
  credits: number;
  totalTopups: number;
  botCount: number;
  transactions: WalletTransaction[];
};

export default function Home() {
  const tgUser = useSignal(initData.user);
  const initDataRaw = useRawInitData();
  const wallet = useTonWallet();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { isDarkMode } = useTheme();
  const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS;

  const DEFAULT_SYSTEM_PROMPT = `You are a strict Telegram support agent.
Use ONLY the provided knowledge base to answer.
If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."
Return STRICT JSON only with this shape:
{"reply":"string"}
Never include markdown or extra text outside JSON.`;

  const [botToken, setBotToken] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [crawlMaxDepth, setCrawlMaxDepth] = useState(2);
  const [crawlMaxPages, setCrawlMaxPages] = useState(10);
  const [urls, setUrls] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isTopUpPending, setIsTopUpPending] = useState<number | null>(null);
  const [customTopUpAmount, setCustomTopUpAmount] = useState('3');
  const [walletStatus, setWalletStatus] = useState('');
  const [walletError, setWalletError] = useState('');
  const createAuthHeaders = (contentType?: string) => {
    const headers = new Headers();
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    if (initDataRaw) {
      headers.set('Authorization', `tma ${initDataRaw}`);
    }
    return headers;
  };

  // Hook into client-side settings
  const getSelectedModel = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tondesk_ai_model') || 'google/gemini-2.0-flash-001';
    }
    return 'google/gemini-2.0-flash-001';
  };

  const isFormValid = useMemo(() => {
    const hasText = knowledgeBaseText.trim().length >= 10;
    const hasUrls = urls.some(u => u.trim().startsWith('http'));
    const hasFiles = files.length > 0;
    return botToken.trim().length > 10 && (hasText || hasUrls || hasFiles);
  }, [botToken, knowledgeBaseText, urls, files]);

  const addUrl = () => setUrls([...urls, '']);
  const updateUrl = (index: number, val: string) => {
    const next = [...urls];
    next[index] = val;
    setUrls(next);
  };
  const removeUrl = (index: number) => setUrls(urls.filter((_, i) => i !== index));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  async function handleDeploy(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!wallet || !walletAddress) {
      setError('Connect your TON wallet before deploying.');
      return;
    }

    setIsDeploying(true);

    try {
      setStatus('Step 1/1: Extracting content and deploying...');

      const formData = new FormData();
      formData.append('botToken', botToken.trim());
      formData.append('ownerWallet', walletAddress);
      formData.append('knowledgeBaseText', knowledgeBaseText.trim());
      formData.append('aiModel', getSelectedModel());
      if (systemPrompt.trim() && systemPrompt.trim() !== DEFAULT_SYSTEM_PROMPT) formData.append('systemPrompt', systemPrompt.trim());
      if (welcomeMessage.trim()) formData.append('welcomeMessage', welcomeMessage.trim());
      formData.append('webSearchEnabled', String(webSearchEnabled));
      formData.append('crawlMaxDepth', String(crawlMaxDepth));
      formData.append('crawlMaxPages', String(crawlMaxPages));

      // Filter out empty URLs
      const validUrls = urls.filter(u => u.trim().startsWith('http'));
      formData.append('urls', JSON.stringify(validUrls));

      // Append files
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/bots/deploy', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: formData,
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed.');
      }

      setStatus(data.message || 'Bot deployed successfully.');
      setBotToken('');
      setKnowledgeBaseText('');
      setSystemPrompt('');
      setWelcomeMessage('');
      setWebSearchEnabled(false);
      setCrawlMaxDepth(2);
      setCrawlMaxPages(10);
      setUrls(['']);
      setFiles([]);
      fetchMyBots(); // Refresh list after deploy
      fetchWalletSummary();
    } catch (deployError) {
      const message =
        deployError instanceof Error
          ? deployError.message
          : 'Unexpected deployment error.';
      setError(message);
    } finally {
      setIsDeploying(false);
    }
  }

  const [myBots, setMyBots] = useState<any[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(false);

  // Edit Bot State
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [editKbText, setEditKbText] = useState('');
  const [editAiModel, setEditAiModel] = useState('google/gemini-2.0-flash-001');
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editWelcomeMessage, setEditWelcomeMessage] = useState('');
  const [editWebSearchEnabled, setEditWebSearchEnabled] = useState(false);
  const [editCrawlMaxDepth, setEditCrawlMaxDepth] = useState(2);
  const [editCrawlMaxPages, setEditCrawlMaxPages] = useState(10);
  const [editUrls, setEditUrls] = useState<string[]>(['']);
  const [editFiles, setEditFiles] = useState<File[]>([]);

  const addEditUrl = () => setEditUrls([...editUrls, '']);
  const updateEditUrl = (index: number, value: string) => {
    const next = [...editUrls];
    next[index] = value;
    setEditUrls(next);
  };
  const removeEditUrl = (index: number) => setEditUrls(editUrls.filter((_, i) => i !== index));

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFiles(Array.from(e.target.files));
    }
  };
  const removeEditFile = (index: number) => setEditFiles(editFiles.filter((_, i) => i !== index));
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchWalletSummary = async () => {
    if (!walletAddress) {
      setWalletSummary(null);
      return;
    }

    setIsLoadingWallet(true);
    try {
      const res = await fetch(`/api/user/wallet?wallet=${encodeURIComponent(walletAddress)}`, {
        headers: createAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setWalletSummary(data.wallet);
      }
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
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
      if (data.ok) setMyBots(data.bots);
    } catch (e) {
      console.error('Failed to fetch bots:', e);
    } finally {
      setIsLoadingBots(false);
    }
  };

  useEffect(() => {
    fetchMyBots();
    fetchWalletSummary();
  }, [walletAddress, initDataRaw]);

  const toggleBotStatus = async (botId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/bots/toggle', {
        method: 'POST',
        headers: createAuthHeaders('application/json'),
        body: JSON.stringify({ botId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setMyBots(myBots.map(b => b.id === botId ? { ...b, isActive: !currentStatus } : b));
      }
    } catch (e) {
      console.error('Failed to toggle bot:', e);
    }
  };

  const startEditingBot = (bot: any) => {
    setEditingBotId(bot.id);
    setEditKbText(bot.knowledgeBaseText || '');
    setEditAiModel(bot.aiModel || 'google/gemini-2.0-flash-001');
    setEditSystemPrompt(bot.systemPrompt || DEFAULT_SYSTEM_PROMPT);
    setEditWelcomeMessage(bot.welcomeMessage || '');
    setEditWebSearchEnabled(bot.webSearchEnabled ?? false);
    setEditCrawlMaxDepth(bot.crawlMaxDepth ?? 2);
    setEditCrawlMaxPages(bot.crawlMaxPages ?? 10);
    setEditUrls(['']);
    setEditFiles([]);
  };

  const cancelEditingBot = () => {
    setEditingBotId(null);
    setEditKbText('');
    setEditAiModel('google/gemini-2.0-flash-001');
    setEditSystemPrompt('');
    setEditWelcomeMessage('');
    setEditWebSearchEnabled(false);
    setEditCrawlMaxDepth(2);
    setEditCrawlMaxPages(10);
    setEditUrls(['']);
    setEditFiles([]);
  };

  const saveBotEdits = async (botId: string) => {
    if (!walletAddress) return;
    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('botId', botId);
      formData.append('ownerWallet', walletAddress);
      formData.append('knowledgeBaseText', editKbText.trim());
      formData.append('aiModel', editAiModel);
      if (editSystemPrompt && editSystemPrompt !== DEFAULT_SYSTEM_PROMPT) formData.append('systemPrompt', editSystemPrompt);
      if (editWelcomeMessage) formData.append('welcomeMessage', editWelcomeMessage);
      formData.append('webSearchEnabled', String(editWebSearchEnabled));
      formData.append('crawlMaxDepth', String(editCrawlMaxDepth));
      formData.append('crawlMaxPages', String(editCrawlMaxPages));

      const validUrls = editUrls.filter(u => u.trim());
      if (validUrls.length > 0) {
        formData.append('urls', JSON.stringify(validUrls));
      }

      for (const file of editFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/bots/edit', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMyBots(myBots.map(b => (b.id === botId ? { ...b, knowledgeBaseText: data.bot.knowledgeBaseText, aiModel: data.bot.aiModel, systemPrompt: data.bot.systemPrompt, welcomeMessage: data.bot.welcomeMessage, webSearchEnabled: data.bot.webSearchEnabled, crawlMaxDepth: data.bot.crawlMaxDepth, crawlMaxPages: data.bot.crawlMaxPages } : b)));
        setEditingBotId(null);
        setEditKbText('');
      } else {
        alert(data.error || 'Failed to edit bot');
      }
    } catch (e) {
      console.error('Failed to edit bot:', e);
      alert('Failed to save changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const deleteBot = async (botId: string) => {
    if (!walletAddress) return;
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) return;

    try {
      const res = await fetch('/api/bots/delete', {
        method: 'POST',
        headers: createAuthHeaders('application/json'),
        body: JSON.stringify({ botId, ownerWallet: walletAddress }),
      });
      if (res.ok) {
        setMyBots(myBots.filter(b => b.id !== botId));
        fetchWalletSummary();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to delete bot');
      }
    } catch (e) {
      console.error('Failed to delete bot:', e);
    }
  };

  const handleTopUp = async (amountTon: number) => {
    const normalizedAmount = Number(amountTon.toFixed(4));

    if (!walletAddress) {
      setWalletError('Connect your TON wallet before topping up.');
      return;
    }
    if (!masterWalletAddress) {
      setWalletError('NEXT_PUBLIC_MASTER_WALLET_ADDRESS is not configured.');
      return;
    }
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setWalletError('Enter a valid TON amount greater than 0.');
      return;
    }

    setWalletError('');
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

      setWalletStatus('Transaction sent. Creating pending top-up...');

      const initRes = await fetch('/api/user/wallet/topup', {
        method: 'POST',
        headers: createAuthHeaders('application/json'),
        body: JSON.stringify({
          walletAddress,
          amountTon: normalizedAmount,
          tonConnectTxHash: 'boc' in result ? result.boc : null,
        }),
      });
      const initData = await initRes.json();

      if (!initRes.ok || !initData.transaction?.id) {
        throw new Error(initData.error || 'Failed to initialize top-up verification.');
      }

      const pendingTransactionId = initData.transaction.id as string;
      setWalletStatus('Transaction sent. Waiting for blockchain confirmation...');

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const confirmRes = await fetch('/api/user/wallet/topup/confirm', {
          method: 'POST',
          headers: createAuthHeaders('application/json'),
          body: JSON.stringify({ transactionId: pendingTransactionId }),
        });
        const confirmData = await confirmRes.json();

        if (!confirmRes.ok) {
          throw new Error(confirmData.error || 'Top-up verification failed.');
        }

        if (confirmData.status === 'completed') {
          setWalletSummary((current) => current ? {
            ...current,
            credits: confirmData.wallet.credits,
            totalTopups: confirmData.wallet.totalTopups,
            transactions: [confirmData.transaction, ...current.transactions].slice(0, 10),
          } : current);
          setWalletStatus(`Wallet topped up with ${normalizedAmount} TON after on-chain verification.`);
          return;
        }

        if (confirmData.status === 'failed') {
          throw new Error(confirmData.error || 'Top-up verification failed.');
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      setWalletStatus('Transaction sent. Verification is still pending on-chain. Please check again in a moment.');
      fetchWalletSummary();
    } catch (topUpError) {
      const message = topUpError instanceof Error ? topUpError.message : 'Top-up was cancelled.';
      setWalletError(message);
      setWalletStatus('');
    } finally {
      setIsTopUpPending(null);
    }
  };
  const handleCustomTopUp = () => {
    const amount = Number(customTopUpAmount);
    handleTopUp(amount);
  };

  return (
    <Page back={false}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-[#0088cc]' : 'bg-[#0088cc]/30'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-600/20'}`} />
      </div>
      <main className="mx-auto min-h-screen w-full max-w-none md:max-w-7xl px-0 py-6 md:px-8 md:py-12 lg:px-12 lg:py-16 relative">
        <div className="mb-8 space-y-6 px-0 md:px-1 lg:mb-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className={`text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              TonDesk
            </p>
            <div className="scale-110">
              <TonConnectButton />
            </div>
          </div>
          <div className="space-y-6 text-center sm:text-left">
            <p className={`max-w-2xl text-base font-medium sm:text-lg lg:text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Deploy RAG-powered Telegram bots from your knowledge base in minutes.
            </p>
            {tgUser && (
              <div className="flex flex-col gap-1 sm:items-start">
                <p className="text-sm font-semibold text-slate-500">
                  Logged in as <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>@{tgUser.username ?? 'telegram-user'}</span>
                </p>
                {walletAddress && (
                  <p className="text-xs text-slate-400 font-mono bg-slate-500/5 px-2 py-1 rounded-md inline-block w-fit">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <section className={`mb-8 rounded-[2.25rem] border p-4 md:p-6 ${isDarkMode
          ? 'border-white/10 bg-slate-900/70'
          : 'border-white/70 bg-white/85 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.25)]'
          }`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Wallet</p>
              <p className={`max-w-2xl text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Top up credits with TON Connect. Each bot reply currently spends credits from this wallet instead of using TON inside the bot chat.
              </p>
              {walletAddress ? (
                <p className={`inline-flex w-fit rounded-full px-3 py-1 font-mono text-xs ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Connect a TON wallet to enable top-ups and bot usage billing.</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className="text-xs uppercase tracking-wider text-slate-500">Credits</p>
                <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {walletSummary ? walletSummary.credits.toFixed(2) : isLoadingWallet ? '...' : '0.00'}
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className="text-xs uppercase tracking-wider text-slate-500">Top-ups</p>
                <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {walletSummary ? walletSummary.totalTopups.toFixed(2) : isLoadingWallet ? '...' : '0.00'} TON
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80'}`}>
                <p className="text-xs uppercase tracking-wider text-slate-500">Bots</p>
                <p className={`mt-2 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {walletSummary ? walletSummary.botCount : isLoadingWallet ? '...' : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
              {TOP_UP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleTopUp(amount)}
                  disabled={!walletAddress || isTopUpPending !== null}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {isTopUpPending === amount ? 'Waiting...' : `Top up ${amount} TON`}
                </button>
              ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={customTopUpAmount}
                  onChange={(event) => setCustomTopUpAmount(event.currentTarget.value)}
                  placeholder="Custom TON amount"
                  className={`w-full max-w-[12rem] rounded-2xl border px-4 py-2 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                    ? 'border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-500'
                    : 'border-slate-200 bg-white text-slate-900'
                    }`}
                />
                <button
                  type="button"
                  onClick={handleCustomTopUp}
                  disabled={!walletAddress || isTopUpPending !== null}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? 'bg-[#0088cc] text-white hover:bg-[#0099e6]' : 'bg-[#0088cc] text-white hover:bg-[#007ab8]'}`}
                >
                  {isTopUpPending !== null && Number(customTopUpAmount) === isTopUpPending ? 'Waiting...' : 'Top up custom amount'}
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-xs ${isDarkMode ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50/80 text-slate-600'}`}>
              <p>1 TON currently adds 1 credit.</p>
              <p>Each bot reply currently costs 0.1 credit.</p>
            </div>
          </div>

          {walletError && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDarkMode
              ? 'border-red-900/60 bg-red-950/40 text-red-300'
              : 'border-red-200 bg-red-50 text-red-700'
              }`}>
              {walletError}
            </div>
          )}

          {walletStatus && (
            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isDarkMode
              ? 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
              {walletStatus}
            </div>
          )}

          {walletSummary && walletSummary.transactions.length > 0 && (
            <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {walletSummary.transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className={`rounded-2xl border p-3 text-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/60 text-slate-300' : 'border-slate-200 bg-slate-50/80 text-slate-700'}`}
                >
                  <p className="font-semibold capitalize">{tx.type}</p>
                  <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  <p className="mt-2 font-mono text-xs">
                    {tx.type === 'topup' ? '+' : ''}{tx.credits.toFixed(2)} credits
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-0 md:gap-6 px-0 lg:grid-cols-12 lg:gap-8">
          <section className={`col-span-1 lg:col-span-5 rounded-[2.5rem] border p-4 md:p-8 lg:p-10 shadow-none md:shadow-2xl backdrop-blur-2xl transition-all h-fit ${isDarkMode
            ? 'border-white/10 bg-slate-900/70 shadow-black/60'
            : 'border-white/60 bg-white/80 shadow-[0_32px_120px_-40px_rgba(0,136,204,0.35)]'
            }`}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <h2 className={`text-lg font-semibold px-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Deploy New Bot</h2>
                <Link href="/settings" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0088cc] transition-colors p-1">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
              </div>
              <form className="space-y-5" onSubmit={handleDeploy}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    placeholder="123456:ABC-your-telegram-bot-token"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/50 text-white placeholder:text-slate-600'
                      : 'border-slate-200 bg-white/50 text-slate-900'
                      }`}
                    value={botToken}
                    onChange={(event) => setBotToken(event.currentTarget.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    System Prompt
                  </label>
                  <textarea
                    placeholder={DEFAULT_SYSTEM_PROMPT}
                    rows={5}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/50 text-white placeholder:text-slate-600'
                      : 'border-slate-200 bg-white/50 text-slate-900'
                      }`}
                    value={systemPrompt}
                    onChange={(event) => setSystemPrompt(event.currentTarget.value)}
                  />
                  <p className="text-xs text-slate-500 ml-1">
                    Leave empty to use default system prompt shown above
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Welcome Message (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Hi! How can I help you today?"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/50 text-white placeholder:text-slate-600'
                      : 'border-slate-200 bg-white/50 text-slate-900'
                      }`}
                    value={welcomeMessage}
                    onChange={(event) => setWelcomeMessage(event.currentTarget.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Manual Knowledge Base
                  </label>
                  <textarea
                    placeholder="Paste FAQ, docs, product descriptions, and prices here..."
                    rows={4}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/50 text-white placeholder:text-slate-600'
                      : 'border-slate-200 bg-white/50 text-slate-900'
                      }`}
                    value={knowledgeBaseText}
                    onChange={(event) => setKnowledgeBaseText(event.currentTarget.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Add Documentation URLs
                  </label>
                  <div className="space-y-2">
                    {urls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="url"
                            placeholder="https://docs.example.com/faq"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            className={`w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${isDarkMode
                              ? 'border-slate-800 bg-slate-800/50 text-white'
                              : 'border-slate-200 bg-white/50 text-slate-900'
                              }`}
                          />
                        </div>
                        {urls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrl(index)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addUrl}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#0088cc] hover:text-[#005580] transition-colors ml-1"
                    >
                      <Plus className="h-3 w-3" /> Add another URL
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Upload Documents (PDF, DOCX, TXT, CSV)
                  </label>
                  <div className="mt-1">
                    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-6 transition-all hover:border-[#0088cc]/50 hover:bg-[#0088cc]/5 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/20 hover:bg-[#0088cc]/10'
                      : 'border-slate-200 bg-slate-50/50'
                      }`}>
                      <Upload className="mb-2 h-6 w-6 text-slate-400" />
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Click to upload</p>
                      <p className="mt-0.5 text-xs text-slate-500">PDF, Word, Text, or CSV up to 10MB each</p>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.docx,.txt,.csv"
                        onChange={handleFileChange}
                      />
                    </label>

                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between rounded-xl border p-2.5 shadow-sm ${isDarkMode
                              ? 'border-slate-800 bg-slate-800/50'
                              : 'border-slate-100 bg-white'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`rounded-lg p-2 ${isDarkMode ? 'bg-[#0088cc]/20 text-[#0088cc]' : 'bg-blue-50 text-[#0088cc]'}`}>
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className={`truncate text-sm font-medium max-w-[200px] ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {file.name}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-1.5 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`rounded-2xl border p-4 ${isDarkMode
                    ? 'border-slate-800 bg-slate-800/30'
                    : 'border-slate-200 bg-white/50'
                    }`}>
                    <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Crawl Settings</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500">Max Crawl Depth (levels)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={crawlMaxDepth}
                          onChange={(e) => setCrawlMaxDepth(Math.max(1, Math.min(5, parseInt(e.target.value) || 2)))}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors ${isDarkMode
                            ? 'border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none'
                            }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">How many levels deep to crawl (1-5, default: 2)</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500">Max Pages to Crawl</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={crawlMaxPages}
                          onChange={(e) => setCrawlMaxPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm transition-colors ${isDarkMode
                            ? 'border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none'
                            }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">Maximum pages to crawl per URL (1-50, default: 10)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between rounded-2xl border p-4 ${isDarkMode
                  ? 'border-slate-800 bg-slate-800/30'
                  : 'border-slate-200 bg-white/50'
                  }`}>
                  <div>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Web Search</p>
                    <p className="text-xs text-slate-500">Let the bot search the web to supplement its knowledge base</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${webSearchEnabled ? 'bg-[#0088cc]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${webSearchEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className={`rounded-xl border p-3 text-sm ${isDarkMode
                  ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400'
                  : 'border-emerald-100 bg-emerald-50/50 text-emerald-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Deployment fee: <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}>FREE</strong>
                  </div>
                  <div className={`mt-1 text-xs ${isDarkMode ? 'text-emerald-400/70' : 'text-emerald-700/80'}`}>
                    Bot replies use credits from your connected wallet balance.
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {status && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {status}
                  </div>
                )}


                <Button
                  isLoading={isDeploying}
                  disabled={!isFormValid || isDeploying || !wallet}
                  type="submit"
                >
                  Deploy Bot
                </Button>
              </form>
              <p className="px-1 text-xs text-slate-400">
                Provide your bot token and knowledge base. Your connected wallet will be registered as the bot's owner.
              </p>
            </div>
          </div>
          </section>

          <section className="col-span-1 lg:col-span-7 space-y-6 px-0">
            <div className="flex items-baseline justify-between px-0">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>My Bots</h2>
              <button onClick={fetchMyBots} className="text-xs text-[#0088cc] hover:underline">Refresh</button>
            </div>

            {isLoadingBots ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : myBots.length === 0 ? (
              <div className={`rounded-3xl border border-dashed p-10 text-center transition-all ${isDarkMode
                ? 'border-slate-800 bg-slate-900/40 text-slate-500'
                : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}>
                <p className="text-sm font-medium">No bots deployed yet.</p>
                <p className="mt-1 text-xs">Connect your wallet and deploy your first bot to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBots.map((bot) => (
                  <div key={bot.id} className={`group rounded-[2.5rem] border p-4 md:p-6 transition-all hover:scale-[1.01] ${isDarkMode
                    ? 'border-white/5 bg-slate-900/80 shadow-black/40 hover:bg-slate-900'
                    : 'border-slate-100 bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50/50'
                    }`}>
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <p className={`text-sm font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {bot.botUsername ? `@${bot.botUsername}` : `${bot.botToken.split(':')[0]}:***`}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-semibold">
                          Created {new Date(bot.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${bot.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-slate-500/10 text-slate-500'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${bot.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                          {bot.isActive ? 'Active' : 'Paused'}
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-500 font-mono text-right">
                          <span>{bot.totalInteractions || 0} msgs</span>
                          <span>&bull;</span>
                          <span>{bot.totalUniqueUsers || 0} users</span>
                          <span>&bull;</span>
                          <span className="text-[#0088cc]">{MODELS.find(m => m.id === bot.aiModel)?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleBotStatus(bot.id, bot.isActive)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${bot.isActive
                            ? isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : isDarkMode ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                        >
                          {bot.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => startEditingBot(bot)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          Edit
                        </button>
                        <Link
                          href={`/interactions?botId=${bot.id}`}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          Interactions
                        </Link>
                        <button
                          onClick={() => deleteBot(bot.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                          Delete
                        </button>
                        </div>
                      </div>
                    </div>

                    {editingBotId === bot.id ? (
                      <div className="mt-4 space-y-3">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          AI Model
                        </label>
                        <div className="grid gap-2">
                          {MODELS.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => setEditAiModel(model.id)}
                              className={`flex items-center justify-between w-full rounded-xl border p-2 text-left text-xs transition-all ${editAiModel === model.id
                                ? 'border-[#0088cc] bg-[#0088cc]/10'
                                : isDarkMode
                                  ? 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                                  : 'border-slate-100 bg-white/50 hover:border-slate-200'
                              }`}
                            >
                              <div>
                                <p className={`text-xs font-bold ${editAiModel === model.id ? 'text-[#0088cc]' : isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                  {model.name}
                                </p>
                                <p className="text-[11px] text-slate-500">{model.desc}</p>
                              </div>
                              {editAiModel === model.id && (
                                <div className="h-2 w-2 rounded-full bg-[#0088cc]" />
                              )}
                            </button>
                          ))}
                        </div>

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3">
                          System Prompt
                        </label>
                        <textarea
                          placeholder={DEFAULT_SYSTEM_PROMPT}
                          rows={5}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] ${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}`}
                          value={editSystemPrompt}
                          onChange={e => setEditSystemPrompt(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Leave empty to use default system prompt
                        </p>

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit Welcome Message (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Hi! How can I help you today?"
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] ${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}`}
                          value={editWelcomeMessage}
                          onChange={e => setEditWelcomeMessage(e.target.value)}
                        />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Edit Manual Knowledge Base
                        </label>
                        <textarea
                          rows={6}
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] ${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}`}
                          value={editKbText}
                          onChange={e => setEditKbText(e.target.value)}
                        />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Add More Documentation URLs
                        </label>
                        <div className="space-y-2">
                          {editUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="url"
                                placeholder="https://docs.example.com"
                                className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] ${isDarkMode ? 'border-slate-800 bg-slate-800/50 text-white' : 'border-slate-200 bg-white/50 text-slate-900'}`}
                                value={url}
                                onChange={(e) => updateEditUrl(index, e.target.value)}
                              />
                              {editUrls.length > 1 && (
                                <button type="button" onClick={() => removeEditUrl(index)} className="rounded-xl px-2 py-1 text-slate-400 hover:text-red-500 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={addEditUrl} className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-[#0088cc] hover:text-[#00aaee]' : 'text-[#0088cc] hover:text-[#00aaee]'}`}>
                            + Add another URL
                          </button>
                        </div>

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Add More Knowledge Base Files
                        </label>
                        <div>
                          <input
                            type="file"
                            multiple
                            accept=".txt,.pdf,.md"
                            onChange={handleEditFileChange}
                            className={`block w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-[#0088cc]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0088cc] hover:file:bg-[#0088cc]/20 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                          />
                          {editFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {editFiles.map((file, i) => (
                                <div key={i} className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                  <span className="truncate pr-2">{file.name}</span>
                                  <button type="button" onClick={() => removeEditFile(i)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Crawl Settings
                        </label>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-slate-500">Max Crawl Depth (levels)</label>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              value={editCrawlMaxDepth}
                              onChange={(e) => setEditCrawlMaxDepth(Math.max(1, Math.min(5, parseInt(e.target.value) || 2)))}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${isDarkMode
                                ? 'border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none'
                                }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500">Max Pages to Crawl</label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={editCrawlMaxPages}
                              onChange={(e) => setEditCrawlMaxPages(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                              className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${isDarkMode
                                ? 'border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none'
                                }`}
                            />
                          </div>
                        </div>

                        <div className={`flex items-center justify-between rounded-xl border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-white/50'}`}>
                          <div>
                            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Web Search</p>
                            <p className="text-[11px] text-slate-500">Search the web to supplement knowledge base</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditWebSearchEnabled(!editWebSearchEnabled)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editWebSearchEnabled ? 'bg-[#0088cc]' : isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editWebSearchEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => saveBotEdits(bot.id)}
                            isLoading={isSavingEdit}
                            disabled={isSavingEdit || editKbText.trim().length < 10}
                            className="flex-1 py-2 text-xs"
                          >
                            Save Changes
                          </Button>
                          <button
                            onClick={cancelEditingBot}
                            disabled={isSavingEdit}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </Page>
  );
}


