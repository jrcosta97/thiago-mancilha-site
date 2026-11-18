import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Plans from '@/components/Plans';
import TDEECalculator from '@/components/TDEECalculator';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import AnamnesisForm from '@/components/AnamnesisForm';
import { useBrandTheme } from '@/lib/useBrandTheme';

export default function Landing() {
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);
  useBrandTheme();

  return (
    <div id="top" className="min-h-screen bg-brand-bg text-brand-ink font-barlow relative overflow-x-hidden">
      <Header onCTAClick={() => setAnamnesisOpen(true)} />
      <main>
        <Hero onCTAClick={() => setAnamnesisOpen(true)} />
        <About />
        <Plans onCTAClick={() => setAnamnesisOpen(true)} />
        <TDEECalculator />
        <FAQ onCTAClick={() => setAnamnesisOpen(true)} />
      </main>
      <Footer />
      <AnamnesisForm
        isOpen={anamnesisOpen}
        onClose={() => setAnamnesisOpen(false)}
      />
    </div>
  );
}
