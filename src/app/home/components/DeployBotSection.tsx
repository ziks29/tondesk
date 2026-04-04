"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ChevronDown, FileText, Globe, Plus, Settings, Trash2, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

import { DEFAULT_SYSTEM_PROMPT, MODELS } from "../constants";
import { DeployFormState } from "../types";

type DeployBotSectionProps = {
  isDarkMode: boolean;
  form: DeployFormState;
  error: string;
  status: string;
  isFormValid: boolean;
  isDeploying: boolean;
  isWalletConnected: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBotTokenChange: (value: string) => void;
  onAiModelChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onWelcomeMessageChange: (value: string) => void;
  onKnowledgeBaseChange: (value: string) => void;
  onToggleWebSearch: () => void;
  onCrawlMaxDepthChange: (value: number) => void;
  onCrawlMaxPagesChange: (value: number) => void;
  onAddUrl: () => void;
  onUpdateUrl: (index: number, value: string) => void;
  onRemoveUrl: (index: number) => void;
  onFilesChange: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
};

export function DeployBotSection({
  isDarkMode,
  form,
  error,
  status,
  isFormValid,
  isDeploying,
  isWalletConnected,
  onSubmit,
  onBotTokenChange,
  onAiModelChange,
  onSystemPromptChange,
  onWelcomeMessageChange,
  onKnowledgeBaseChange,
  onToggleWebSearch,
  onCrawlMaxDepthChange,
  onCrawlMaxPagesChange,
  onAddUrl,
  onUpdateUrl,
  onRemoveUrl,
  onFilesChange,
  onRemoveFile,
}: DeployBotSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <section
      className={`col-span-1 h-fit rounded-2xl sm:rounded-[2.5rem] border p-4 sm:p-6 shadow-none backdrop-blur-2xl transition-all md:p-8 md:shadow-2xl lg:col-span-5 lg:p-10 ${
        isDarkMode
          ? "border-white/10 bg-slate-900/70 shadow-black/60"
          : "border-white/60 bg-white/80 shadow-[0_32px_120px_-40px_rgba(0,136,204,0.35)]"
      }`}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2
              className={`text-lg sm:text-xl font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              Deploy New Bot
            </h2>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 p-1 text-xs text-slate-400 transition-colors hover:text-[#0088cc]"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
          <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
            <InputBlock label="Telegram Bot Token">
              <input
                type="text"
                placeholder="123456:ABC-your-telegram-bot-token"
                className={fieldClassName(isDarkMode)}
                value={form.botToken}
                onChange={(event) => onBotTokenChange(event.currentTarget.value)}
              />
            </InputBlock>

            <InputBlock label="AI Model">
              <div className="grid gap-2">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onAiModelChange(model.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
                      form.aiModel === model.id
                        ? "border-[#0088cc] bg-[#0088cc]/10"
                        : isDarkMode
                          ? "border-slate-800 bg-slate-800/30 hover:border-slate-700"
                          : "border-slate-100 bg-white/50 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <p
                        className={`text-xs sm:text-sm font-bold ${form.aiModel === model.id ? "text-[#0088cc]" : isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                      >
                        {model.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">{model.desc}</p>
                    </div>
                    {form.aiModel === model.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#0088cc] shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </InputBlock>

            <InputBlock label="System Prompt">
              <textarea
                placeholder={DEFAULT_SYSTEM_PROMPT}
                rows={5}
                className={fieldClassName(isDarkMode)}
                value={form.systemPrompt}
                onChange={(event) => onSystemPromptChange(event.currentTarget.value)}
              />
              <p className="ml-1 text-xs text-slate-500">
                Leave empty to use default system prompt shown above
              </p>
            </InputBlock>

            <InputBlock label="Welcome Message (Optional)">
              <input
                type="text"
                placeholder="Hi! How can I help you today?"
                className={fieldClassName(isDarkMode)}
                value={form.welcomeMessage}
                onChange={(event) =>
                  onWelcomeMessageChange(event.currentTarget.value)
                }
              />
            </InputBlock>

            <InputBlock label="Manual Knowledge Base">
              <textarea
                placeholder="Paste FAQ, docs, product descriptions, and prices here..."
                rows={4}
                className={fieldClassName(isDarkMode)}
                value={form.knowledgeBaseText}
                onChange={(event) =>
                  onKnowledgeBaseChange(event.currentTarget.value)
                }
              />
            </InputBlock>

            <InputBlock label="Add Documentation URLs">
              <div className="space-y-2.5 sm:space-y-2">
                {form.urls.map((url, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://docs.example.com/faq"
                        value={url}
                        onChange={(event) =>
                          onUpdateUrl(index, event.currentTarget.value)
                        }
                        className={urlFieldClassName(isDarkMode)}
                      />
                    </div>
                    {form.urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveUrl(index)}
                        aria-label="Remove URL"
                        className="p-2.5 sm:p-2 text-slate-400 transition-colors hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="h-5 sm:h-4 w-5 sm:w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onAddUrl}
                  className="ml-1 flex items-center gap-1.5 text-xs font-medium text-[#0088cc] transition-colors hover:text-[#005580]"
                >
                  <Plus className="h-3 w-3" /> Add another URL
                </button>
              </div>
            </InputBlock>

            <InputBlock label="Upload Documents (PDF, DOCX, TXT, CSV)">
              <div className="mt-1">
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 border-dashed py-8 sm:py-10 transition-all hover:border-[#0088cc]/50 hover:bg-[#0088cc]/5 ${
                    isDarkMode
                      ? "border-slate-800 bg-slate-800/20 hover:bg-[#0088cc]/10"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <Upload className="mb-3 h-8 sm:h-6 w-8 sm:w-6 text-slate-400" />
                  <p
                    className={`text-sm sm:text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                  >
                    Click to upload
                  </p>
                  <p className="mt-1 text-xs sm:text-xs text-slate-500">
                    PDF, Word, Text, or CSV up to 10MB each
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={(event) => onFilesChange(event.currentTarget.files)}
                  />
                </label>

                {form.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className={`flex items-center justify-between rounded-xl border p-2.5 shadow-sm ${
                          isDarkMode
                            ? "border-slate-800 bg-slate-800/50"
                            : "border-slate-100 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-lg p-2 ${isDarkMode ? "bg-[#0088cc]/20 text-[#0088cc]" : "bg-blue-50 text-[#0088cc]"}`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div
                            className={`max-w-[200px] truncate text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                          >
                            {file.name}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFile(index)}
                          aria-label="Remove file"
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </InputBlock>

            <div className={`rounded-xl sm:rounded-2xl border ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                aria-controls="advanced-settings-panel"
                className={`flex w-full items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-sm font-semibold transition-colors ${isDarkMode ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                Advanced Settings
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`}
                />
              </button>

              {showAdvanced && (
                <div id="advanced-settings-panel" className={`space-y-4 border-t px-4 sm:px-5 py-4 ${isDarkMode ? "border-slate-800 bg-slate-800/20" : "border-slate-100 bg-slate-50/50"}`}>
                  <div className="space-y-3">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Crawl Settings</p>
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
                          onCrawlMaxDepthChange(
                            Math.max(
                              1,
                              Math.min(5, Number.parseInt(event.currentTarget.value) || 2),
                            ),
                          )
                        }
                        className={settingsFieldClassName(isDarkMode)}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        How many levels deep to crawl (1-5, default: 2)
                      </p>
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
                          onCrawlMaxPagesChange(
                            Math.max(
                              1,
                              Math.min(50, Number.parseInt(event.currentTarget.value) || 10),
                            ),
                          )
                        }
                        className={settingsFieldClassName(isDarkMode)}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Maximum pages to crawl per URL (1-50, default: 10)
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between rounded-xl border p-3 sm:p-4 ${isDarkMode ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white/50"}`}>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                        Web Search
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Let the bot search the web to supplement its knowledge base
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.webSearchEnabled}
                      aria-label="Enable Web Search"
                      onClick={onToggleWebSearch}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-4 ${
                        form.webSearchEnabled
                          ? "bg-[#0088cc]"
                          : isDarkMode
                            ? "bg-slate-700"
                            : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          form.webSearchEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ModelHint isDarkMode={isDarkMode} />

            {error && (
              <div className="rounded-lg sm:rounded-xl border border-red-200 bg-red-50 px-4 sm:px-3 py-3 sm:py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {status && (
              <div className="rounded-lg sm:rounded-xl border border-emerald-200 bg-emerald-50 px-4 sm:px-3 py-3 sm:py-2 text-sm text-emerald-700">
                {status}
              </div>
            )}

            <Button
              isLoading={isDeploying}
              disabled={!isFormValid || isDeploying || !isWalletConnected}
              type="submit"
            >
              Deploy Bot
            </Button>
          </form>
          <p className="px-1 text-xs text-slate-400">
            Provide your bot token and knowledge base. Your connected wallet will
            be registered as the bot&apos;s owner.
          </p>
        </div>
      </div>
    </section>
  );
}

function ModelHint({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        isDarkMode
          ? "border-emerald-900/50 bg-emerald-900/10 text-emerald-400"
          : "border-emerald-100 bg-emerald-50/50 text-emerald-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Deployment fee:{" "}
        <strong className={isDarkMode ? "text-emerald-300" : "text-emerald-900"}>
          FREE
        </strong>
      </div>
      <div
        className={`mt-1 text-xs ${isDarkMode ? "text-emerald-400/70" : "text-emerald-700/80"}`}
      >
        Bot replies use credits from your connected wallet balance. Select your preferred AI model above.
      </div>
    </div>
  );
}

function InputBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function fieldClassName(isDarkMode: boolean) {
  return `w-full rounded-xl sm:rounded-2xl border px-4 py-3 sm:py-3.5 text-base sm:text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${
    isDarkMode
      ? "border-slate-800 bg-slate-800/50 text-white placeholder:text-slate-600"
      : "border-slate-200 bg-white/50 text-slate-900"
  }`;
}

function urlFieldClassName(isDarkMode: boolean) {
  return `w-full rounded-lg sm:rounded-xl border py-2.5 sm:py-3 pl-9 pr-4 text-base sm:text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10 ${
    isDarkMode
      ? "border-slate-800 bg-slate-800/50 text-white"
      : "border-slate-200 bg-white/50 text-slate-900"
  }`;
}

function settingsFieldClassName(isDarkMode: boolean) {
  return `mt-2 w-full rounded-lg border px-3 py-2.5 text-base sm:text-sm transition-colors ${
    isDarkMode
      ? "border-slate-700 bg-slate-900/50 text-white focus:border-[#0088cc] focus:outline-none"
      : "border-slate-200 bg-white text-slate-900 focus:border-[#0088cc] focus:outline-none"
  }`;
}
