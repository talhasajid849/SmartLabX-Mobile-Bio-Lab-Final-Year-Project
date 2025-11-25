import AboutSection from '@/components/visitor/AboutSection';
import Footer from '@/components/visitor/Footer';
import Navbar from '@/components/visitor/Navbar';
import ServicesSection from '@/components/visitor/ServicesSection';
import React from 'react';

export default function About() {
  return (
    <>
      <Navbar />
      <AboutSection />
      <ServicesSection />
      <Footer/>
    </>
  );
}