import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Plans from '@/components/Plans';
import Results from '@/components/Results';
import TDEECalculator from '@/components/TDEECalculator';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import AnamnesisForm from '@/components/AnamnesisForm';

export default function Landing() {
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);

  return (
    <div id="top" className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <Header onCTAClick={() => setAnamnesisOpen(true)} />
      <main>
        <Hero onCTAClick={() => setAnamnesisOpen(true)} />
        <About />
        <Plans onCTAClick={() => setAnamnesisOpen(true)} />
        <Results />
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
