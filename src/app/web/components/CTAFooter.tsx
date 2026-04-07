export function CTAFooter() {
  return (
    <section className="bg-white px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-3xl font-bold text-slate-900">
          Your agent. Your knowledge. On Telegram.
        </h2>
        <p className="mb-10 text-lg text-slate-500">
          Start for free. No credit card. No code.
        </p>
        <a
          href="https://t.me/tondeskbot/start"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#0077bb] active:scale-95"
        >
          Launch for free →
        </a>
        <p className="mt-16 text-sm text-slate-400">© 2026 TonDesk</p>
      </div>
    </section>
  );
}
