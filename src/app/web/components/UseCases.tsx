const cases = [
  {
    icon: '🔍',
    title: 'QA Agent',
    description: 'Answer questions from your docs, instantly. Point it at your knowledge base and let it handle the rest.',
  },
  {
    icon: '💬',
    title: 'Support Agent',
    description: 'Handle customer queries 24/7 from your knowledge base — without hiring a single support rep.',
  },
  {
    icon: '💎',
    title: 'Sales Agent',
    description: 'Qualify leads and accept TON payments autonomously. Your agent closes while you sleep.',
  },
] as const;

export function UseCases() {
  return (
    <section className="bg-white px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
          One platform. Any use case. Your knowledge base.
        </h2>
        <p className="mb-12 text-center text-slate-600">
          What will you build?
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 text-4xl" aria-hidden="true">{c.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{c.title}</h3>
              <p className="text-slate-600">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
