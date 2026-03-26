'use client';

import { useEffect, useState } from 'react';
import { useRawInitData } from '@tma.js/sdk-react';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

import { Page } from '@/components/Page';
import { useTheme } from '@/core/theme/provider';

interface Interaction {
  id: string;
  chatId: string;
  userInput: string;
  aiResponse: string;
  aiIntent?: string;
  createdAt: string;
}

interface ChatGroup {
  chatId: string;
  interactions: Interaction[];
  lastInteractionAt: string;
  messageCount: number;
}

export default function InteractionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const botId = searchParams.get('botId');
  const ownerWallet = searchParams.get('ownerWallet');
  const initDataRaw = useRawInitData();
  const { isDarkMode } = useTheme();

  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!botId || !ownerWallet) {
      setError('Bot ID or owner wallet not provided');
      setIsLoading(false);
      return;
    }

    fetchInteractions();
  }, [botId, ownerWallet]);

  const fetchInteractions = async () => {
    try {
      setIsLoading(true);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (initDataRaw) {
        headers.set('Authorization', `tma ${initDataRaw}`);
      }

      const res = await fetch(
        `/api/interactions?botId=${botId}&ownerWallet=${encodeURIComponent(ownerWallet ?? '')}`,
        { headers },
      );
      if (res.ok) {
        const data = await res.json();
        setChatGroups(data.chatGroups || []);
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch interactions');
      }
    } catch (e) {
      console.error('Error fetching interactions:', e);
      setError('Network error while fetching interactions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page back={false}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-[#0088cc]' : 'bg-[#0088cc]/30'}`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-600/20'}`} />
      </div>

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8 md:py-12 lg:px-12 lg:py-16 relative">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#0088cc] hover:text-[#0088cc]/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Bot Interactions Debug
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-2`}>
            {isLoading ? 'Loading...' : `${chatGroups.length} chat conversations`}
          </p>
        </div>

        {error && (
          <div className={`rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6`}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chat list */}
          <div
            className={`rounded-2xl border p-4 h-fit ${isDarkMode
              ? 'border-slate-800 bg-slate-900/50'
              : 'border-slate-200 bg-slate-50'
              }`}
          >
            <h2 className={`font-semibold text-sm mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Conversations ({chatGroups.length})
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#0088cc]" />
              </div>
            ) : chatGroups.length === 0 ? (
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>No interactions yet</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {chatGroups.map((group) => (
                  <button
                    key={group.chatId}
                    onClick={() => setSelectedChatId(group.chatId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors text-xs ${selectedChatId === group.chatId
                      ? isDarkMode
                        ? 'bg-[#0088cc]/20 border border-[#0088cc]/50'
                        : 'bg-[#0088cc]/10 border border-[#0088cc]/30'
                      : isDarkMode
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-slate-100'
                      }`}
                  >
                    <div className={`font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {group.chatId}
                    </div>
                    <div className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {group.messageCount} message{group.messageCount !== 1 ? 's' : ''}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {new Date(group.lastInteractionAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages view */}
          <div className="lg:col-span-2">
            {selectedChatId ? (
              <div
                className={`rounded-2xl border p-6 ${isDarkMode
                  ? 'border-slate-800 bg-slate-900/50'
                  : 'border-slate-200 bg-slate-50'
                  }`}
              >
                <h2 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Chat {selectedChatId}
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {chatGroups
                    .find((g) => g.chatId === selectedChatId)
                    ?.interactions.map((interaction) => (
                      <div key={interaction.id} className="space-y-3">
                        {/* User message */}
                        <div
                          className={`rounded-lg p-3 text-xs ${isDarkMode
                            ? 'bg-[#0088cc]/20 text-slate-100 border border-[#0088cc]/30'
                            : 'bg-[#0088cc]/10 text-slate-900 border border-[#0088cc]/20'
                            }`}
                        >
                          <div className="font-semibold text-[#0088cc] mb-1">User</div>
                          <p className="break-words">{interaction.userInput}</p>
                          <div className={`text-[10px] mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {new Date(interaction.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* AI response */}
                        <div
                          className={`rounded-lg p-3 text-xs ${isDarkMode
                            ? 'bg-slate-800/50 text-slate-200 border border-slate-700/50'
                            : 'bg-white border border-slate-200'
                            }`}
                        >
                          <div className="font-semibold text-slate-400 mb-1">Bot Response</div>
                          <p className="break-words">{interaction.aiResponse}</p>
                          {interaction.aiIntent && (
                            <div className={`mt-2 p-2 rounded text-[10px] ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                              <span className="text-slate-500">Intent: </span>
                              <code className="text-slate-300">{interaction.aiIntent}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div
                className={`rounded-2xl border p-12 flex flex-col items-center justify-center text-center ${isDarkMode
                  ? 'border-slate-800 bg-slate-900/50'
                  : 'border-slate-200 bg-slate-50'
                  }`}
              >
                <MessageCircle className={`w-12 h-12 mb-4 opacity-50 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select a conversation to view messages
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </Page>
  );
}
