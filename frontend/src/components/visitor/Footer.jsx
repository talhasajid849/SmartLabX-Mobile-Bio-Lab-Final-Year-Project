'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>🔬 Mobile Bio Lab</h3>
            <p className={styles.footerText}>
              Bringing cutting-edge biological research facilities to your doorstep. 
              Empowering students, researchers, and technicians worldwide.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink}>📘</a>
              <a href="#" className={styles.socialLink}>🐦</a>
              <a href="#" className={styles.socialLink}>📸</a>
              <a href="#" className={styles.socialLink}>💼</a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <a href="#about" className={styles.footerLink}>About Us</a>
            <a href="#services" className={styles.footerLink}>Services</a>
            <a href="#features" className={styles.footerLink}>Features</a>
            <a href="#contact" className={styles.footerLink}>Contact</a>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Resources</h4>
            <a href="#" className={styles.footerLink}>Documentation</a>
            <a href="#" className={styles.footerLink}>API Reference</a>
            <a href="#" className={styles.footerLink}>Help Center</a>
            <a href="#" className={styles.footerLink}>FAQs</a>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Legal</h4>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLink}>Terms of Service</a>
            <a href="#" className={styles.footerLink}>Cookie Policy</a>
            <a href="#" className={styles.footerLink}>GDPR</a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            © {currentYear} Mobile Bio Lab. All rights reserved.
          </p>
          <p className={styles.footerCredit}>
            Made with ❤️ for Science
          </p>
        </div>
      </div>
    </footer>
  );
}