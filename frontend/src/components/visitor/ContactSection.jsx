'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function ContactSection() {
  return (
    <section id="contact" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Get In Touch</h2>
        <p className={styles.sectionSubtitle}>
          Have questions? We`d love to hear from you
        </p>
        
        <div className={styles.contactGrid}>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>📧</div>
              <div>
                <h4 className={styles.contactLabel}>Email</h4>
                <p className={styles.contactValue}>info@smartlabx.com</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>📞</div>
              <div>
                <h4 className={styles.contactLabel}>Phone</h4>
                <p className={styles.contactValue}>+1 (555) 123-4567</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>📍</div>
              <div>
                <h4 className={styles.contactLabel}>Address</h4>
                <p className={styles.contactValue}>123 Science Park, Research City, RC 12345</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>⏰</div>
              <div>
                <h4 className={styles.contactLabel}>Working Hours</h4>
                <p className={styles.contactValue}>Mon - Fri: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}