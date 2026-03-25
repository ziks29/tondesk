"use client";

import { TonConnectButton } from "@tonconnect/ui-react";

type HomeHeroProps = {
  isDarkMode: boolean;
  telegramUsername?: string | null;
};

export function HomeHero({ isDarkMode, telegramUsername }: HomeHeroProps) {
  return (
    <div className="mb-6 sm:mb-8 lg:mb-12 space-y-4 sm:space-y-6 px-0 md:px-1">
      <div className="flex flex-col items-center justify-between gap-4 sm:gap-6 sm:flex-row">
        <p
          className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          TonDesk
        </p>
        <div className="scale-90 sm:scale-100">
          <TonConnectButton />
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6 text-center sm:text-left">
        <p
          className={`max-w-2xl text-base sm:text-lg lg:text-xl font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          Deploy RAG-powered Telegram bots from your knowledge base in minutes.
        </p>
      </div>
    </div>
  );
}
