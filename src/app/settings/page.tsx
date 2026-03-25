'use client';

import { useState } from 'react';
import { ChevronLeft, Moon, Monitor, Sun } from 'lucide-react';
import Link from 'next/link';

import { Page } from '@/components/Page';
import { useTheme } from '@/core/theme/provider';

export default function SettingsPage() {
  const { theme, setTheme, isDarkMode } = useTheme();

  return (
    <Page back={false}>
      <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:py-8 md:px-8 md:py-16 lg:py-24">
        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0088cc] transition-all w-fit"
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 group-hover:bg-[#0088cc]/20' : 'bg-slate-100 group-hover:bg-[#0088cc]/10'}`}>
              <ChevronLeft className="h-4 w-4" />
            </div>
            Back to Deploy
          </Link>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Settings</h1>
        </div>

        <section className={`rounded-2xl sm:rounded-[2.5rem] border p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-2xl ${isDarkMode
            ? 'border-white/10 bg-slate-900/60 shadow-black/40'
            : 'border-white/60 bg-white/80 shadow-slate-200/40'
          }`}>
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-widest px-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Monitor className="h-4 w-4" /> Appearance
              </h2>
              <div className={`flex gap-1 p-1.5 sm:p-1 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-100/80'
                }`}>
                {[
                  { id: 'light', name: 'Light', icon: Sun },
                  { id: 'dark', name: 'Dark', icon: Moon },
                  { id: 'system', name: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-2 px-4 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${theme === t.id
                        ? isDarkMode
                          ? 'bg-slate-800 text-[#0088cc] shadow-lg ring-1 ring-white/10'
                          : 'bg-white text-[#0088cc] shadow-md ring-1 ring-slate-200'
                        : isDarkMode
                          ? 'text-slate-500 hover:text-slate-300'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <t.icon className="h-4 sm:h-4 w-4 sm:w-4" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800 italic text-xs sm:text-[10px] text-slate-400 text-center">
              Settings are saved automatically to your device.
            </div>
          </div>
        </section>
      </main>
    </Page>
  );
}
