const features = [
  {
    icon: '📚',
    title: 'Any knowledge source',
    description: 'Upload text, crawl URLs, or parse PDFs and DOCX files. Your agent learns from all of it.',
  },
  {
    icon: '🤖',
    title: 'Any AI model',
    description: 'Gemini, GPT-4o, Claude, and more via OpenRouter. Pick the model that fits your budget.',
  },
  {
    icon: '💎',
    title: 'TON crypto payments',
    description: 'Built-in payment links sent automatically when your agent detects purchase intent.',
  },
  {
    icon: '🌐',
    title: 'Web search',
    description: 'Optional real-time lookup alongside your knowledge base for up-to-date answers.',
  },
] as const;

export function Features() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6"
            >
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
