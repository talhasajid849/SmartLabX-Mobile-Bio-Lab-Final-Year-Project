'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      icon: '📝',
      title: 'Register Account',
      description: 'Create your free account in minutes. Choose your role: Student, Researcher, or Technician.'
    },
    {
      number: '2',
      icon: '📅',
      title: 'Book Lab Session',
      description: 'Reserve a time slot for the mobile lab to visit your location or access remotely.'
    },
    {
      number: '3',
      icon: '🧪',
      title: 'Collect Samples',
      description: 'Use our equipment to collect and analyze biological samples with real-time data capture.'
    },
    {
      number: '4',
      icon: '📊',
      title: 'Analyze & Report',
      description: 'Visualize your data with interactive charts and generate professional PDF reports.'
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>
          Get started with Mobile Bio Lab in four simple steps
        </p>
        
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.ctaContainer}>
          <button className={styles.btnHeroPrimary} onClick={() => window.location.href = '/'}>
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
}