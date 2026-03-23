'use client';

import { FormEvent, useMemo, useState } from 'react';
import { initData, useSignal } from '@tma.js/sdk-react';
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import { FileText, Globe, Loader2, Plus, Settings, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';

import { Page } from '@/components/Page';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/core/theme/provider';



export default function Home() {
  const tgUser = useSignal(initData.user);
  const wallet = useTonWallet();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { isDarkMode } = useTheme();

  const [botToken, setBotToken] = useState('');
  const [knowledgeBaseText, setKnowledgeBaseText] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);

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

      // Filter out empty URLs
      const validUrls = urls.filter(u => u.trim().startsWith('http'));
      formData.append('urls', JSON.stringify(validUrls));

      // Append files
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/bots/deploy', {
        method: 'POST',
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
      setUrls(['']);
      setFiles([]);
      fetchMyBots(); // Refresh list after deploy
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

  const fetchMyBots = async () => {
    if (!walletAddress) return;
    setIsLoadingBots(true);
    try {
      const res = await fetch(`/api/bots/list?wallet=${walletAddress}`);
      const data = await res.json();
      if (data.ok) setMyBots(data.bots);
    } catch (e) {
      console.error('Failed to fetch bots:', e);
    } finally {
      setIsLoadingBots(false);
    }
  };

  useMemo(() => {
    fetchMyBots();
  }, [walletAddress]);

  const toggleBotStatus = async (botId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/bots/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setMyBots(myBots.map(b => b.id === botId ? { ...b, isActive: !currentStatus } : b));
      }
    } catch (e) {
      console.error('Failed to toggle bot:', e);
    }
  };

  return (
    <Page back={false}>
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-8 space-y-4 px-1">
          <div className="flex items-center justify-between">
            <p className={`text-3xl font-bold sm:text-4xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              TonDesk
            </p>
            <TonConnectButton />
          </div>
          <div className="space-y-4">
            <p className={`max-w-xl text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Deploy RAG-powered Telegram bots from your knowledge base in minutes.
            </p>
            {tgUser && (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-medium text-slate-500">
                  Logged in as @{tgUser.username ?? 'telegram-user'}
                </p>
                {walletAddress && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className={`rounded-3xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8 transition-all h-fit ${isDarkMode
            ? 'border-white/10 bg-slate-900/65 shadow-black/40'
            : 'border-white/40 bg-white/65 shadow-[0_20px_80px_-40px_rgba(0,112,180,0.8)]'
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
                  <label htmlFor="bot-token" className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Telegram Bot Token
                  </label>
                  <input
                    id="bot-token"
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
                  <label htmlFor="knowledge-base" className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
                    Manual Knowledge Base
                  </label>
                  <textarea
                    id="knowledge-base"
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
                            aria-label={`Documentation URL ${index + 1}`}
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
                            aria-label={`Remove URL ${index + 1}`}
                            title={`Remove URL ${index + 1}`}
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
                    Upload Documents (PDF, DOCX, TXT)
                  </label>
                  <div className="mt-1">
                    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-6 transition-all hover:border-[#0088cc]/50 hover:bg-[#0088cc]/5 ${isDarkMode
                      ? 'border-slate-800 bg-slate-800/20 hover:bg-[#0088cc]/10'
                      : 'border-slate-200 bg-slate-50/50'
                      }`}>
                      <Upload className="mb-2 h-6 w-6 text-slate-400" />
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Click to upload</p>
                      <p className="mt-0.5 text-xs text-slate-500">PDF, Word, or Text up to 10MB each</p>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.docx,.txt"
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
                              aria-label={`Remove file ${file.name}`}
                              title={`Remove file ${file.name}`}
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

                <div className={`rounded-xl border p-3 text-sm ${isDarkMode
                  ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400'
                  : 'border-emerald-100 bg-emerald-50/50 text-emerald-800'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Deployment fee: <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}>FREE</strong>
                  </div>
                  {walletAddress && (
                    <div className={`mt-1 text-xs font-mono ${isDarkMode ? 'text-emerald-400/50' : 'text-emerald-700/70'}`}>
                      Payable from: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                    </div>
                  )}
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

          <section className="space-y-6">
            <div className="flex items-baseline justify-between px-1">
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
                  <div key={bot.id} className={`group rounded-3xl border p-5 transition-all hover:scale-[1.01] ${isDarkMode
                    ? 'border-white/5 bg-slate-900/80 shadow-black/40 hover:bg-slate-900'
                    : 'border-slate-100 bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50/50'
                    }`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className={`text-sm font-bold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {bot.botToken.split(':')[0]}:***
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-semibold">
                          Created {new Date(bot.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${bot.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-slate-500/10 text-slate-500'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${bot.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                          {bot.isActive ? 'Active' : 'Paused'}
                        </div>
                        <button
                          onClick={() => toggleBotStatus(bot.id, bot.isActive)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${bot.isActive
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                        >
                          {bot.isActive ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Recent Interactions</p>
                      {bot.interactions && bot.interactions.length > 0 ? (
                        <div className="space-y-2">
                          {bot.interactions.map((interaction: any) => (
                            <div key={interaction.id} className={`rounded-2xl border p-3 text-[11px] ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                              <div className="flex items-baseline justify-between font-mono opacity-60 mb-1">
                                <span>User:</span>
                                <span>{new Date(interaction.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <p className={`mb-2 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{interaction.userInput}</p>
                              <div className="flex items-baseline font-mono opacity-60 mb-1">
                                <span>Bot:</span>
                              </div>
                              <p className={`${isDarkMode ? 'text-[#0088cc]' : 'text-[#0088cc]'}`}>{interaction.aiResponse}</p>
                              {interaction.aiIntent && (
                                <div className="mt-2 inline-block rounded bg-[#0088cc]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#0088cc] uppercase">
                                  Intent: {JSON.parse(interaction.aiIntent).intent}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-1 text-[11px] text-slate-500 italic">No interactions yet.</p>
                      )}
                    </div>
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
