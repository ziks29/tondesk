import { CTAFooter } from './components/CTAFooter';
import { Features } from './components/Features';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { UseCases } from './components/UseCases';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tondesk.n9xo.xyz';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TonDesk',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Telegram',
  url: `${APP_URL}/web`,
  description:
    'Deploy a RAG-powered AI support agent, QA assistant, or sales bot to Telegram in minutes — no code required. Powered by TON crypto payments and OpenRouter.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function WebPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <UseCases />
        <Features />
        <CTAFooter />
      </main>
    </>
  );
}
