'use client';
import React, { useState } from 'react';
import Navbar from '@/components/visitor/Navbar';
import HeroSection from '@/components/visitor/HeroSection';
import AboutSection from '@/components/visitor/AboutSection';
import ServicesSection from '@/components/visitor/ServicesSection';
import FeaturesSection from '@/components/visitor/FeaturesSection';
import HowItWorksSection from '@/components/visitor/HowItWorksSection';
import TestimonialsSection from '@/components/visitor/TestimonialsSection';
import ContactSection from '@/components/visitor/ContactSection';
import Footer from '@/components/visitor/Footer';
import RegisterModal from '@/components/visitor/RegisterModal';

export default function LandingPage() {
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  return (
    <div>
      <Navbar 
        openRegisterModal={() => setRegisterModalOpen(true)}
      />
      <HeroSection openRegisterModal={() => setRegisterModalOpen(true)} />
      <AboutSection />
      <ServicesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <RegisterModal 
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </div>
  );
}