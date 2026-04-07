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
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
          What will you build?
        </h2>
        <p className="mb-12 text-center text-slate-500">
          One platform. Any use case. Your knowledge base.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 text-4xl">{c.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{c.title}</h3>
              <p className="text-slate-500">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
