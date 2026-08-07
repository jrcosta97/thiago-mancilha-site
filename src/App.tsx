import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Metrics from './components/Metrics';
import About from './components/About';
import Plans from './components/Plans';
import Results from './components/Results';
import TDEECalculator from './components/TDEECalculator';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import AnamnesisForm from './components/AnamnesisForm';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);

  const openModal = (plan?: string) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary antialiased">
      <Header onCTAClick={() => openModal()} />

      <main>
        <Hero onCTAClick={() => openModal()} />

        <Metrics />

        <About />

        <Plans onCTAClick={(p?) => openModal(p)} />

        <Results />

        <TDEECalculator onCTAClick={(p?) => openModal(p)} />

        <FAQ onCTAClick={() => openModal()} />
      </main>

      <Footer />

      <WhatsAppFloat onOpenModal={() => openModal()} />

      <AnamnesisForm
        isOpen={isModalOpen}
        onClose={closeModal}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
