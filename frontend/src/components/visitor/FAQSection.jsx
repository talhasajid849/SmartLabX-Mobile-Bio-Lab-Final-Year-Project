'use client';
import React, { useState } from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is Mobile Bio Lab?',
      answer: 'Mobile Bio Lab is a mobile biological laboratory service that brings cutting-edge research facilities to your location. We provide remote access to lab equipment, sample management, and data analysis tools.'
    },
    {
      question: 'How do I book a lab session?',
      answer: 'Simply register for an account, log in to your dashboard, and navigate to the reservation system. Select your preferred date, time, and location, and submit your booking request.'
    },
    {
      question: 'What types of samples can I analyze?',
      answer: 'We support water, soil, plant, biological fluid samples, and more. Our platform includes protocols for various sample types and environmental conditions.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use enterprise-grade 256-bit encryption for all data transmission and storage. Your research data is protected and accessible only to you.'
    },
    {
      question: 'Can I collaborate with other researchers?',
      answer: 'Absolutely! You can share sample data, reports, and protocols with team members via email or direct links through the platform.'
    },
    {
      question: 'What equipment is available in the mobile lab?',
      answer: 'Our mobile labs are equipped with microscopes, centrifuges, pH meters, temperature sensors, spectrometers, and other essential biological research equipment.'
    },
    {
      question: 'Do you offer training for new users?',
      answer: 'Yes, we provide comprehensive documentation, video tutorials, and protocol libraries. Plus, our support team is available to help you get started.'
    },
    {
      question: 'What are the pricing options?',
      answer: 'We offer flexible plans for students, researchers, and institutions. Contact us for detailed pricing information tailored to your needs.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <p className={styles.sectionSubtitle}>
          Find answers to common questions about Mobile Bio Lab
        </p>
        
        <div className={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span className={styles.faqIcon}>
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className={styles.faqAnswer}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}