const steps = [
  {
    number: '01',
    title: 'Get a bot token',
    description: 'Create a bot via @BotFather on Telegram and copy your token.',
  },
  {
    number: '02',
    title: 'Upload your knowledge base',
    description: "Add text, crawl URLs, or upload PDFs and DOCX files as your agent's knowledge.",
  },
  {
    number: '03',
    title: 'Your agent is live',
    description: 'Deploy in one click. Your bot starts answering questions instantly.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
          Live in three steps
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+28px)] top-7 hidden h-0.5 w-[calc(100%-56px)] bg-slate-200 sm:block" />
              )}
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0088cc] text-xl font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
