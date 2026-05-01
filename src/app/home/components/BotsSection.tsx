"use client";

import { ChangeEvent, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

import { DEFAULT_SYSTEM_PROMPT, MODELS } from "../constants";
import { BotRecord, EditFormState } from "../types";

type BotsSectionProps = {
  isDarkMode: boolean;
  bots: BotRecord[];
  isLoadingBots: boolean;
  editingBotId: string | null;
  editForm: EditFormState;
  isSavingEdit: boolean;
  editError: string;
  onRefresh: () => void;
  onToggleBotStatus: (botId: string, currentStatus: boolean) => void;
  onStartEditingBot: (bot: BotRecord) => void;
  onDeleteBot: (botId: string) => void;
  onCancelEditingBot: () => void;
  onSaveBotEdits: (botId: string) => void;
  onClearEditError: () => void;
  onEditAiModelChange: (value: string) => void;
  onEditSystemPromptChange: (value: string) => void;
  onEditWelcomeMessageChange: (value: string) => void;
  onEditKnowledgeBaseChange: (value: string) => void;
  onAddEditUrl: () => void;
  onUpdateEditUrl: (index: number, value: string) => void;
  onRemoveEditUrl: (index: number) => void;
  onEditFilesChange: (files: FileList | null) => void;
  onRemoveEditFile: (index: number) => void;
  onEditCrawlMaxDepthChange: (value: number) => void;
  onEditCrawlMaxPagesChange: (value: number) => void;
  onToggleEditWebSearch: () => void;
};

export function BotsSection({
  isDarkMode,
  bots,
  isLoadingBots,
  editingBotId,
  editForm,
  isSavingEdit,
  editError,
  onRefresh,
  onToggleBotStatus,
  onStartEditingBot,
  onDeleteBot,
  onCancelEditingBot,
  onSaveBotEdits,
  onClearEditError,
  onEditAiModelChange,
  onEditSystemPromptChange,
  onEditWelcomeMessageChange,
  onEditKnowledgeBaseChange,
  onAddEditUrl,
  onUpdateEditUrl,
  onRemoveEditUrl,
  onEditFilesChange,
  onRemoveEditFile,
  onEditCrawlMaxDepthChange,
  onEditCrawlMaxPagesChange,
  onToggleEditWebSearch,
}: BotsSectionProps) {
  return (
    <section className="col-span-1 space-y-4 sm:space-y-6 px-0 lg:col-span-7">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 px-0">
        <h2
          className={`text-lg sm:text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
        >
          My Bots
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs text-[#0088cc] hover:underline"
        >
          Refresh
        </button>
      </div>

      {isLoadingBots ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <BotCardSkeleton key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div
          className={`rounded-2xl sm:rounded-3xl border border-dashed p-6 sm:p-10 text-center transition-all ${
            isDarkMode
              ? "border-slate-800 bg-slate-900/40 text-slate-500"
              : "border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          <p className="text-base sm:text-sm font-medium">No bots deployed yet.</p>
          <p className="mt-2 sm:mt-1 text-sm sm:text-xs">
            Connect your wallet and deploy your first bot to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              isDarkMode={isDarkMode}
              bot={bot}
              isEditing={editingBotId === bot.id}
              editForm={editForm}
              isSavingEdit={isSavingEdit}
              editError={editError}
              onToggleBotStatus={onToggleBotStatus}
              onStartEditingBot={onStartEditingBot}
              onDeleteBot={onDeleteBot}
              onCancelEditingBot={onCancelEditingBot}
              onSaveBotEdits={onSaveBotEdits}
              onClearEditError={onClearEditError}
              onEditAiModelChange={onEditAiModelChange}
              onEditSystemPromptChange={onEditSystemPromptChange}
              onEditWelcomeMessageChange={onEditWelcomeMessageChange}
              onEditKnowledgeBaseChange={onEditKnowledgeBaseChange}
              onAddEditUrl={onAddEditUrl}
              onUpdateEditUrl={onUpdateEditUrl}
              onRemoveEditUrl={onRemoveEditUrl}
              onEditFilesChange={onEditFilesChange}
              onRemoveEditFile={onRemoveEditFile}
              onEditCrawlMaxDepthChange={onEditCrawlMaxDepthChange}
              onEditCrawlMaxPagesChange={onEditCrawlMaxPagesChange}
              onToggleEditWebSearch={onToggleEditWebSearch}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BotCardSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-2xl sm:rounded-[2.5rem] border p-4 sm:p-5 md:p-6 ${
        isDarkMode ? "border-white/5 bg-slate-900/80" : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
        <div className="space-y-2">
          <div
            className={`h-4 w-36 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}
          />
          <div
            className={`h-3 w-24 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}
          />
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <div
            className={`h-5 w-16 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}
          />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-6 w-14 rounded-xl ${isDarkMode ? "bg-slate-800" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type BotCardProps = {
  isDarkMode: boolean;
  bot: BotRecord;
  isEditing: boolean;
  editForm: EditFormState;
  isSavingEdit: boolean;
  editError: string;
  onToggleBotStatus: (botId: string, currentStatus: boolean) => void;
  onStartEditingBot: (bot: BotRecord) => void;
  onDeleteBot: (botId: string) => void;
  onCancelEditingBot: () => void;
  onSaveBotEdits: (botId: string) => void;
  onClearEditError: () => void;
  onEditAiModelChange: (value: string) => void;
  onEditSystemPromptChange: (value: string) => void;
  onEditWelcomeMessageChange: (value: string) => void;
  onEditKnowledgeBaseChange: (value: string) => void;
  onAddEditUrl: () => void;
  onUpdateEditUrl: (index: number, value: string) => void;
  onRemoveEditUrl: (index: number) => void;
  onEditFilesChange: (files: FileList | null) => void;
  onRemoveEditFile: (index: number) => void;
  onEditCrawlMaxDepthChange: (value: number) => void;
  onEditCrawlMaxPagesChange: (value: number) => void;
  onToggleEditWebSearch: () => void;
};

function BotCard({
  isDarkMode,
  bot,
  isEditing,
  editForm,
  isSavingEdit,
  editError,
  onToggleBotStatus,
  onStartEditingBot,
  onDeleteBot,
  onCancelEditingBot,
  onSaveBotEdits,
  onClearEditError,
  onEditAiModelChange,
  onEditSystemPromptChange,
  onEditWelcomeMessageChange,
  onEditKnowledgeBaseChange,
  onAddEditUrl,
  onUpdateEditUrl,
  onRemoveEditUrl,
  onEditFilesChange,
  onRemoveEditFile,
  onEditCrawlMaxDepthChange,
  onEditCrawlMaxPagesChange,
  onToggleEditWebSearch,
}: BotCardProps) {
  return (
    <div
      className={`group rounded-2xl sm:rounded-[2.5rem] border p-4 sm:p-5 md:p-6 transition-all hover:scale-[1.01] ${
        isDarkMode
          ? "border-white/5 bg-slate-900/80 shadow-black/40 hover:bg-slate-900"
          : "border-slate-100 bg-white shadow-xl shadow-slate-200/50 hover:bg-slate-50/50"
      }`}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:gap-4 lg:flex-row w-full">
        <div className="flex-1 space-y-1.5 min-w-0">
          <p
            className={`font-mono text-sm sm:text-sm font-bold truncate ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}
          >
            {bot.botUsername ? `@${bot.botUsername}` : `${bot.botToken.split(":")[0]}:***`}
          </p>
          <p className="text-xs sm:text-[10px] font-semibold uppercase tracking-tighter text-slate-500">
            Created {new Date(bot.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex w-full flex-col items-start gap-2 lg:w-auto lg:items-end">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              bot.isActive
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-slate-500/10 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${bot.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}
            />
            {bot.isActive ? "Active" : "Paused"}
          </div>
          <div className="flex gap-2 text-right font-mono text-[10px] text-slate-500">
            <span>{bot.totalInteractions || 0} msgs</span>
            <span>&bull;</span>
            <span>{bot.totalUniqueUsers || 0} users</span>
            <span>&bull;</span>
            <span className="text-[#0088cc]">
              {MODELS.find((model) => model.id === bot.aiModel)?.name || "Unknown"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onToggleBotStatus(bot.id, bot.isActive)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                bot.isActive
                  ? isDarkMode
                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : isDarkMode
                    ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {bot.isActive ? "Pause" : "Activate"}
            </button>
            <button
              onClick={() => onStartEditingBot(bot)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              Edit
            </button>
            <a
              href={`/interactions?botId=${bot.id}&ownerWallet=${encodeURIComponent(bot.ownerWallet)}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              Interactions
            </a>
            <button
              onClick={() => onDeleteBot(bot.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <EditBotPanel
          isDarkMode={isDarkMode}
          botId={bot.id}
          form={editForm}
          isSavingEdit={isSavingEdit}
          editError={editError}
          onSaveBotEdits={onSaveBotEdits}
          onCancelEditingBot={onCancelEditingBot}
          onClearEditError={onClearEditError}
          onEditAiModelChange={onEditAiModelChange}
          onEditSystemPromptChange={onEditSystemPromptChange}
          onEditWelcomeMessageChange={onEditWelcomeMessageChange}
          onEditKnowledgeBaseChange={onEditKnowledgeBaseChange}
          onAddEditUrl={onAddEditUrl}
          onUpdateEditUrl={onUpdateEditUrl}
          onRemoveEditUrl={onRemoveEditUrl}
          onEditFilesChange={onEditFilesChange}
          onRemoveEditFile={onRemoveEditFile}
          onEditCrawlMaxDepthChange={onEditCrawlMaxDepthChange}
          onEditCrawlMaxPagesChange={onEditCrawlMaxPagesChange}
          onToggleEditWebSearch={onToggleEditWebSearch}
        />
      ) : null}
    </div>
  );
}

type EditBotPanelProps = {
  isDarkMode: boolean;
  botId: string;
  form: EditFormState;
  isSavingEdit: boolean;
  editError: string;
  onSaveBotEdits: (botId: string) => void;
  onCancelEditingBot: () => void;
  onClearEditError: () => void;
  onEditAiModelChange: (value: string) => void;
  onEditSystemPromptChange: (value: string) => void;
  onEditWelcomeMessageChange: (value: string) => void;
  onEditKnowledgeBaseChange: (value: string) => void;
  onAddEditUrl: () => void;
  onUpdateEditUrl: (index: number, value: string) => void;
  onRemoveEditUrl: (index: number) => void;
  onEditFilesChange: (files: FileList | null) => void;
  onRemoveEditFile: (index: number) => void;
  onEditCrawlMaxDepthChange: (value: number) => void;
  onEditCrawlMaxPagesChange: (value: number) => void;
  onToggleEditWebSearch: () => void;
};

function EditBotPanel({
  isDarkMode,
  botId,
  form,
  isSavingEdit,
  editError,
  onSaveBotEdits,
  onCancelEditingBot,
  onClearEditError,
  onEditAiModelChange,
  onEditSystemPromptChange,
  onEditWelcomeMessageChange,
  onEditKnowledgeBaseChange,
  onAddEditUrl,
  onUpdateEditUrl,
  onRemoveEditUrl,
  onEditFilesChange,
  onRemoveEditFile,
  onEditCrawlMaxDepthChange,
  onEditCrawlMaxPagesChange,
  onToggleEditWebSearch,
}: EditBotPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        AI Model
      </label>
      <div className="grid gap-2">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => onEditAiModelChange(model.id)}
            className={`flex w-full items-center justify-between rounded-xl border p-2 text-left text-xs transition-all ${
              form.aiModel === model.id
                ? "border-[#0088cc] bg-[#0088cc]/10"
                : isDarkMode
                  ? "border-slate-800 bg-slate-800/30 hover:border-slate-700"
                  : "border-slate-100 bg-white/50 hover:border-slate-200"
            }`}
          >
            <div>
              <p
                className={`text-xs font-bold ${form.aiModel === model.id ? "text-[#0088cc]" : isDarkMode ? "text-slate-200" : "text-slate-700"}`}
              >
                {model.name}
              </p>
              <p className="text-[11px] text-slate-500">{model.desc}</p>
            </div>
            {form.aiModel === model.id && (
              <div className="h-2 w-2 rounded-full bg-[#0088cc]" />
            )}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        System Prompt
      </label>
      <textarea
        placeholder={DEFAULT_SYSTEM_PROMPT}
        rows={5}
        className={editFieldClassName(isDarkMode)}
        value={form.systemPrompt}
        onChange={(event) => onEditSystemPromptChange(event.currentTarget.value)}
      />
      <p className="mt-1 text-[10px] text-slate-500">
        Leave empty to use default system prompt
      </p>

      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Edit Welcome Message (Optional)
      </label>
      <input
        type="text"
        placeholder="Hi! How can I help you today?"
        className={editFieldClassName(isDarkMode)}
        value={form.welcomeMessage}
        onChange={(event) => onEditWelcomeMessageChange(event.currentTarget.value)}
      />

      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Edit Manual Knowledge Base
      </label>
      <textarea
        rows={6}
        className={editFieldClassName(isDarkMode)}
        value={form.knowledgeBaseText}
        onChange={(event) => onEditKnowledgeBaseChange(event.currentTarget.value)}
      />

      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Add More Documentation URLs
      </label>
      <div className="space-y-2">
        {form.urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              placeholder="https://docs.example.com"
              className={editFieldClassName(isDarkMode)}
              value={url}
              onChange={(event) => onUpdateEditUrl(index, event.currentTarget.value)}
            />
            {form.urls.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveEditUrl(index)}
                className="rounded-xl px-2 py-1 text-slate-400 transition-colors hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAddEditUrl}
          className="text-xs font-semibold text-[#0088cc] transition-colors hover:text-[#00aaee]"
        >
          + Add another URL
        </button>
      </div>

      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Add More Knowledge Base Files
      </label>
      <div>
        <input
          type="file"
          multiple
          accept=".txt,.pdf,.md"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onEditFilesChange(event.currentTarget.files)
          }
          className={`block w-full text-xs file:mr-3 file:rounded-xl file:border-0 file:bg-[#0088cc]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0088cc] hover:file:bg-[#0088cc]/20 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
        />
        {form.files.length > 0 && (
          <div className="mt-2 space-y-1">
            {form.files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] ${isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}`}
              >
                <span className="truncate pr-2">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveEditFile(index)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-xl border ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          aria-controls={`advanced-settings-panel-${botId}`}
          className={`flex w-full items-center justify-between px-4 py-3 text-xs font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
        >
          Advanced Settings
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
          />
        </button>

        {showAdvanced && (
          <div
            id={`advanced-settings-panel-${botId}`}
            className={`space-y-3 border-t px-4 py-3 ${isDarkMode ? "border-slate-800 bg-slate-800/20" : "border-slate-100 bg-slate-50/50"}`}
          >
            <div className="space-y-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Crawl Settings</p>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Max Crawl Depth (levels)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.crawlMaxDepth}
                  onChange={(event) =>
                    onEditCrawlMaxDepthChange(
                      Math.max(1, Math.min(5, Number.parseInt(event.currentTarget.value) || 2)),
                    )
                  }
                  className={editSettingsFieldClassName(isDarkMode)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Max Pages to Crawl
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.crawlMaxPages}
                  onChange={(event) =>
                    onEditCrawlMaxPagesChange(
                      Math.max(1, Math.min(50, Number.parseInt(event.currentTarget.value) || 10)),
                    )
                  }
                  className={editSettingsFieldClassName(isDarkMode)}
                />
              </div>
            </div>

            <div
              className={`flex items-center justify-between rounded-xl border p-3 ${isDarkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white/50"}`}
            >
              <div>
                <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  Web Search
                </p>
                <p className="text-[11px] text-slate-500">
                  Search the web to supplement knowledge base
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleEditWebSearch}
                role="switch"
                aria-checked={form.webSearchEnabled}
                aria-label="Toggle Web Search"
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-3 ${
                  form.webSearchEnabled
                    ? "bg-[#0088cc]"
                    : isDarkMode
                      ? "bg-slate-700"
                      : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.webSearchEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {editError && (
        <div
          className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm ${
            isDarkMode
              ? "border-red-900/60 bg-red-950/40 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{editError}</span>
          <button
            type="button"
            onClick={onClearEditError}
            className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => onSaveBotEdits(botId)}
          isLoading={isSavingEdit}
          disabled={isSavingEdit || form.knowledgeBaseText.trim().length < 10}
          className="flex-1 py-2 text-xs"
        >
          Save Changes
        </Button>
        <button
          onClick={onCancelEditingBot}
          disabled={isSavingEdit}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function editFieldClassName(isDarkMode: boolean) {
  return `w-full rounded-xl border px-3 py-2 text-xs outline-none focus:border-[#0088cc] ${
    isDarkMode
      ? "border-slate-800 bg-slate-800/50 text-white"
      : "border-slate-200 bg-white/50 text-slate-900"
  }`;
}

function editSettingsFieldClassName(isDarkMode: boolean) {
  return `mt-1 w-full rounded-lg border px-3 py-2 text-xs transition-colors ${
    isDarkMode
      ? "border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none"
      : "border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none"
  }`;
}
