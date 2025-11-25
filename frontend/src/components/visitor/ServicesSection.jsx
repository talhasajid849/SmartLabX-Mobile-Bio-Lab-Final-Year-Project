'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function ServicesSection() {
  const services = [
    {
      icon: '📅',
      title: 'Lab Reservation',
      description: 'Book time slots for accessing our mobile bio lab on wheels at your convenience.',
      color: '#3b82f6'
    },
    {
      icon: '🧪',
      title: 'Sample Management',
      description: 'Input and track biological samples with detailed environmental data and geolocation.',
      color: '#10b981'
    },
    {
      icon: '📊',
      title: 'Data Visualization',
      description: 'Visualize your sample data through interactive charts and comprehensive analytics.',
      color: '#f59e0b'
    },
    {
      icon: '📄',
      title: 'Report Generation',
      description: 'Generate professional PDF reports and share them with peers via email or link.',
      color: '#8b5cf6'
    },
    {
      icon: '📋',
      title: 'Experiment Protocols',
      description: 'Access step-by-step biological experiment protocols uploaded by experts.',
      color: '#ec4899'
    },
    {
      icon: '📱',
      title: 'Real-time Notifications',
      description: 'Stay updated with instant notifications about new entries and reports.',
      color: '#06b6d4'
    }
  ];

  return (
    <section id="services" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Our Services</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need for remote biological research
        </p>
        
        <div className={styles.servicesGrid}>
          {services.map((service, index) => (
            <div 
              key={index} 
              className={styles.serviceCard}
              style={{ borderTopColor: service.color }}
            >
              <div className={styles.serviceIcon}>{service.icon}</div>
              <h3 className={styles.serviceTitle}>{service.title}</h3>
              <p className={styles.serviceDescription}>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}