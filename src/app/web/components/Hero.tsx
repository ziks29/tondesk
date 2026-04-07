export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[20%] -top-[30%] h-[60%] w-[60%] rounded-full bg-[#0088cc] opacity-[0.06] blur-[120px]" />
        <div className="absolute -right-[10%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#0088cc] opacity-[0.04] blur-[100px]" />
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
          Powered by TON &amp; OpenRouter
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl">
          Build autonomous AI agents.{' '}
          <span className="text-[#0088cc]">Trained on your knowledge.</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600">
          Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.
        </p>
        <a
          href="https://t.me/tondeskbot/start"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-8 py-4 text-lg font-semibold text-white shadow-[0_8px_24px_rgba(0,136,204,0.35)] transition hover:bg-[#0077bb] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0088cc] focus-visible:ring-offset-2"
        >
          Launch for free <span aria-hidden="true">→</span>
        </a>
        <p className="mt-4">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-500 transition hover:text-[#0088cc]"
          >
            See how it works
          </a>
        </p>
      </div>
    </section>
  );
}
