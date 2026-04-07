export function CTAFooter() {
  return (
    <section className="bg-slate-900 px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Your agent. Your knowledge. On Telegram.
        </h2>
        <p className="mb-10 text-lg text-slate-400">
          Start for free. No credit card. No code.
        </p>
        <a
          href="https://t.me/tondeskbot/start"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-[#0088cc] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-slate-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          Open in Telegram <span aria-hidden="true">→</span>
        </a>
        <p className="mt-16 text-sm text-slate-600">© 2026 TonDesk</p>
      </div>
    </section>
  );
}
