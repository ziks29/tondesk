"use client";

import { TonConnectButton } from "@tonconnect/ui-react";

type HomeHeroProps = {
  isDarkMode: boolean;
  telegramUsername?: string | null;
};

export function HomeHero({
  isDarkMode,
  telegramUsername,
}: HomeHeroProps) {
  return (
    <div className="mb-8 space-y-6 px-0 md:px-1 lg:mb-12">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <p
          className={`text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          TonDesk
        </p>
        <div className="scale-110">
          <TonConnectButton />
        </div>
      </div>
      <div className="space-y-6 text-center sm:text-left">
        <p
          className={`max-w-2xl text-base font-medium sm:text-lg lg:text-xl ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          Deploy RAG-powered Telegram bots from your knowledge base in minutes.
        </p>
        {telegramUsername && (
          <div className="flex flex-col gap-1 sm:items-start">
            <p className="text-sm font-semibold text-slate-500">
              Logged in as{" "}
              <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                @{telegramUsername}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
