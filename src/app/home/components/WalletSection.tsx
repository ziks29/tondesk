"use client";

import { WalletSummary } from "../types";

type WalletSectionProps = {
  isDarkMode: boolean;
  walletAddress: string;
  walletSummary: WalletSummary | null;
  isLoadingWallet: boolean;
  topUpAmounts: readonly number[];
  isTopUpPending: number | null;
  customTopUpAmount: string;
  walletError: string;
  walletStatus: string;
  onTopUp: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
  onCustomTopUp: () => void;
};

export function WalletSection({
  isDarkMode,
  walletAddress,
  walletSummary,
  isLoadingWallet,
  topUpAmounts,
  isTopUpPending,
  customTopUpAmount,
  walletError,
  walletStatus,
  onTopUp,
  onCustomAmountChange,
  onCustomTopUp,
}: WalletSectionProps) {
  return (
    <section
      className={`mb-8 rounded-[2.25rem] border p-4 md:p-6 ${
        isDarkMode
          ? "border-white/10 bg-slate-900/70"
          : "border-white/70 bg-white/85 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.25)]"
      }`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p
            className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}
          >
            User Wallet
          </p>
          <p
            className={`max-w-2xl text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            Top up credits with TON Connect. Each bot reply currently spends
            credits from this wallet instead of using TON inside the bot chat.
          </p>
          {walletAddress ? (
            <p
              className={`inline-flex w-fit rounded-full px-3 py-1 font-mono text-xs ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
            >
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Connect a TON wallet to enable top-ups and bot usage billing.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[24rem]">
          <MetricCard
            isDarkMode={isDarkMode}
            label="Credits"
            value={
              walletSummary
                ? walletSummary.credits.toFixed(2)
                : isLoadingWallet
                  ? "..."
                  : "0.00"
            }
          />
          <MetricCard
            isDarkMode={isDarkMode}
            label="Top-ups"
            value={`${
              walletSummary
                ? walletSummary.totalTopups.toFixed(2)
                : isLoadingWallet
                  ? "..."
                  : "0.00"
            } TON`}
          />
          <MetricCard
            isDarkMode={isDarkMode}
            label="Bots"
            value={`${
              walletSummary ? walletSummary.botCount : isLoadingWallet ? "..." : 0
            }`}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {topUpAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onTopUp(amount)}
                disabled={!walletAddress || isTopUpPending !== null}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                {isTopUpPending === amount ? "Waiting..." : `Top up ${amount} TON`}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={customTopUpAmount}
              onChange={(event) => onCustomAmountChange(event.currentTarget.value)}
              placeholder="Custom TON amount"
              className={`w-full max-w-[12rem] rounded-2xl border px-4 py-2 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${
                isDarkMode
                  ? "border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-500"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            />
            <button
              type="button"
              onClick={onCustomTopUp}
              disabled={!walletAddress || isTopUpPending !== null}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "bg-[#0088cc] text-white hover:bg-[#0099e6]" : "bg-[#0088cc] text-white hover:bg-[#007ab8]"}`}
            >
              {isTopUpPending !== null && Number(customTopUpAmount) === isTopUpPending
                ? "Waiting..."
                : "Top up custom amount"}
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-xs ${isDarkMode ? "border-slate-800 bg-slate-950/60 text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-600"}`}
        >
          <p>1 TON currently adds 1 credit.</p>
          <p>Each bot reply currently costs 0.1 credit.</p>
        </div>
      </div>

      {walletError && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            isDarkMode
              ? "border-red-900/60 bg-red-950/40 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {walletError}
        </div>
      )}

      {walletStatus && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            isDarkMode
              ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {walletStatus}
        </div>
      )}

      {walletSummary && walletSummary.transactions.length > 0 && (
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {walletSummary.transactions.slice(0, 6).map((tx) => (
            <div
              key={tx.id}
              className={`rounded-2xl border p-3 text-sm ${isDarkMode ? "border-slate-800 bg-slate-950/60 text-slate-300" : "border-slate-200 bg-slate-50/80 text-slate-700"}`}
            >
              <p className="font-semibold capitalize">{tx.type}</p>
              <p className="text-xs text-slate-500">
                {new Date(tx.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 font-mono text-xs">
                {tx.type === "topup" ? "+" : ""}
                {tx.credits.toFixed(2)} credits
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type MetricCardProps = {
  isDarkMode: boolean;
  label: string;
  value: string;
};

function MetricCard({ isDarkMode, label, value }: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50/80"}`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}
