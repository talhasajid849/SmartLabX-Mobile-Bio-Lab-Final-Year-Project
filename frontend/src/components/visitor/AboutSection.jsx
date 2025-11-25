'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function AboutSection() {
  const aboutCards = [
    {
      icon: '🎓',
      title: 'For Students',
      description: 'Access professional lab equipment and conduct experiments without the need for a physical campus visit.',
      features: ['Virtual Lab Access', 'Remote Learning', 'Real-time Data Collection']
    },
    {
      icon: '🔬',
      title: 'For Researchers',
      description: 'Conduct field research with real-time data collection, analysis, and reporting capabilities.',
      features: ['Advanced Analytics', 'Cloud Storage', 'Collaboration Tools']
    },
    {
      icon: '⚗️',
      title: 'For Technicians',
      description: 'Manage biological samples efficiently with automated data entry and comprehensive tracking.',
      features: ['Sample Tracking', 'QR Code Scanning', 'Automated Reports']
    }
  ];

  return (
    <section id="about" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>About Our Mobile Bio Lab</h2>
        <p className={styles.sectionSubtitle}>
          Revolutionizing access to biological research and education
        </p>
        
        <div className={styles.aboutGrid}>
          {aboutCards.map((card, index) => (
            <div key={index} className={styles.aboutCard}>
              <div className={styles.aboutIcon}>{card.icon}</div>
              <h3 className={styles.aboutCardTitle}>{card.title}</h3>
              <p className={styles.aboutCardText}>{card.description}</p>
              <ul className={styles.featureList}>
                {card.features.map((feature, idx) => (
                  <li key={idx} className={styles.featureListItem}>
                    <span className={styles.checkIcon}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}