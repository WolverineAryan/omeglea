'use client';

import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PremiumSection } from '../components/landing/PremiumSection';
import { SafetySection } from '../components/landing/SafetySection';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <PremiumSection />
      <SafetySection />
    </div>
  );
}
