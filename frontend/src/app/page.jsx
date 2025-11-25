'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/visitor/Navbar';
import HeroSection from '@/components/visitor/HeroSection';
import FeaturesSection from '@/components/visitor/FeaturesSection';
import HowItWorksSection from '@/components/visitor/HowItWorksSection';
import TestimonialsSection from '@/components/visitor/TestimonialsSection';
import Footer from '@/components/visitor/Footer';
import RegisterModal from '@/components/visitor/RegisterModal';
import { loadUser } from '@/store/actions/auth.action';
import { useDispatch } from 'react-redux';

export default function LandingPage() {
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const diapatch = useDispatch();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    diapatch(loadUser());
  }, [diapatch])

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar 
        scrollToSection={scrollToSection}
        openRegisterModal={() => setRegisterModalOpen(true)}
      />
      <HeroSection openRegisterModal={() => setRegisterModalOpen(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <Footer />
      <RegisterModal 
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
    </div>
  );
}