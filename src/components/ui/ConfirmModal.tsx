"use client";

type ConfirmModalProps = {
  isDarkMode: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  isDarkMode,
  title,
  message,
  confirmLabel = "Confirm",
  isDestructive = false,
  isLoading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div
        className={`relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${
          isDarkMode
            ? "border-white/10 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <h3
          className={`text-base font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
        >
          {message}
        </p>

        {error && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
              isDarkMode
                ? "border-red-900/60 bg-red-950/40 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
              isDestructive
                ? isDarkMode
                  ? "bg-red-900/40 text-red-300 hover:bg-red-900/60"
                  : "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#0088cc] text-white hover:bg-[#007ab8]"
            }`}
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
