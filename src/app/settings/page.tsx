'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Moon, Monitor, Sun } from 'lucide-react';
import Link from 'next/link';

import { Page } from '@/components/Page';
import { useTheme } from '@/core/theme/provider';

const MODELS = [
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', desc: 'Fast & Smart (Default)' },
  { id: 'anthropic/claude-3.5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Lightweight & Efficient' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Powerful Reasoning' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', desc: 'Free Tier' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', desc: 'Advanced Logic' },
];

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-001');
  const { theme, setTheme, isDarkMode } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem('tondesk_ai_model');
    if (saved) setSelectedModel(saved);
  }, []);

  const handleModelChange = (id: string) => {
    setSelectedModel(id);
    localStorage.setItem('tondesk_ai_model', id);
  };

  return (
    <Page back={false}>
      <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[#0088cc] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Deploy
          </Link>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Settings</h1>
        </div>

        <section className={`rounded-3xl border p-6 shadow-xl backdrop-blur-xl sm:p-8 ${isDarkMode
            ? 'border-white/10 bg-slate-900/50 shadow-black/20'
            : 'border-white/40 bg-white/90 shadow-slate-200/40'
          }`}>
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className={`text-sm font-bold uppercase tracking-widest px-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Monitor className="h-4 w-4" /> Appearance
              </h2>
              <div className={`flex gap-1 p-1 rounded-2xl ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-100/80'
                }`}>
                {[
                  { id: 'light', name: 'Light', icon: Sun },
                  { id: 'dark', name: 'Dark', icon: Moon },
                  { id: 'system', name: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${theme === t.id
                        ? isDarkMode
                          ? 'bg-slate-800 text-[#0088cc] shadow-lg ring-1 ring-white/10'
                          : 'bg-white text-[#0088cc] shadow-md ring-1 ring-slate-200'
                        : isDarkMode
                          ? 'text-slate-500 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">
                Default AI Model
              </h2>
              <p className="text-sm text-slate-500 px-1 mb-4">
                Brain for your next bot deployment.
              </p>

              <div className="grid gap-3">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`flex items-center justify-between w-full rounded-2xl border p-4 text-left transition-all ${selectedModel === model.id
                        ? 'border-[#0088cc] bg-[#0088cc]/5 ring-2 ring-[#0088cc]/10'
                        : isDarkMode
                          ? 'border-slate-800 bg-slate-800/30 hover:border-slate-700'
                          : 'border-slate-100 bg-white/50 hover:border-slate-200'
                      }`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${selectedModel === model.id ? 'text-[#0088cc]' : isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {model.name}
                      </p>
                      <p className="text-xs text-slate-500">{model.desc}</p>
                    </div>
                    {selectedModel === model.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#0088cc]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 italic text-[10px] text-slate-400 text-center">
              Settings are saved automatically to your device.
            </div>
          </div>
        </section>
      </main>
    </Page>
  );
}
