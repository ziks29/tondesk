import { CTAFooter } from './components/CTAFooter';
import { Features } from './components/Features';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { UseCases } from './components/UseCases';

export default function WebPage() {
  return (
    <main id="main-content">
      <Hero />
      <HowItWorks />
      <UseCases />
      <Features />
      <CTAFooter />
    </main>
  );
}
