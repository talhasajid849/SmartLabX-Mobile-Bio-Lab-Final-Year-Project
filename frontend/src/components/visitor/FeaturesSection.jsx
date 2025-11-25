'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function FeaturesSection() {
  const features = [
    {
      icon: '📱',
      title: 'QR/Barcode Scanning',
      description: 'Automatically retrieve sample information by scanning QR codes or barcodes.',
      stats: '99% Accuracy'
    },
    {
      icon: '📡',
      title: 'BLE Sensor Integration',
      description: 'Connect Bluetooth Low Energy devices to capture real-time field data like pH and temperature.',
      stats: 'Real-time Sync'
    },
    {
      icon: '🗺️',
      title: 'Geolocation Tracking',
      description: 'Record precise location data for every sample collection automatically.',
      stats: 'GPS Enabled'
    },
    {
      icon: '☁️',
      title: 'Cloud Storage',
      description: 'Secure cloud-based storage ensures your data is safe and accessible anywhere.',
      stats: 'Unlimited Storage'
    },
    {
      icon: '🔒',
      title: 'Secure Access',
      description: 'Enterprise-grade security with encrypted data transmission and storage.',
      stats: '256-bit Encryption'
    },
    {
      icon: '📈',
      title: 'Advanced Analytics',
      description: 'Powerful analytics tools to derive insights from your biological data.',
      stats: 'AI-Powered'
    }
  ];

  return (
    <section id="features" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Platform Features</h2>
        <p className={styles.sectionSubtitle}>
          Cutting-edge technology for modern biological research
        </p>
        
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIconLarge}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <div className={styles.featureStats}>{feature.stats}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}