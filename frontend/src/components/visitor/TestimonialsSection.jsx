'use client';
import React from 'react';
import styles from '@/styles/visitor/landing.module.css';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Research Scientist',
      company: 'BioTech Institute',
      image: '👩‍🔬',
      rating: 5,
      text: 'Mobile Bio Lab has revolutionized how we conduct field research. The mobile lab setup is incredible, and the data management tools are top-notch!'
    },
    {
      name: 'Michael Chen',
      role: 'PhD Student',
      company: 'Stanford University',
      image: '👨‍🎓',
      rating: 5,
      text: 'As a remote student, accessing lab facilities was always challenging. Mobile Bio Lab made it possible for me to complete my research without being on campus.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Lab Technician',
      company: 'GeneLab Research',
      image: '👩‍💼',
      rating: 5,
      text: 'The sample tracking and QR code scanning features save us so much time. The platform is intuitive and easy to use.'
    },
    {
      name: 'Dr. James Wilson',
      role: 'Professor',
      company: 'MIT Biology Department',
      image: '👨‍🏫',
      rating: 5,
      text: 'I recommend Mobile Bio Lab to all my students. The protocol library and real-time data collection are game-changers for biological research.'
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>What Our Users Say</h2>
        <p className={styles.sectionSubtitle}>
          Trusted by researchers, students, and technicians worldwide
        </p>
        
        <div className={styles.testimonialsGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.testimonialAvatar}>{testimonial.image}</div>
                <div>
                  <h4 className={styles.testimonialName}>{testimonial.name}</h4>
                  <p className={styles.testimonialRole}>{testimonial.role}</p>
                  <p className={styles.testimonialCompany}>{testimonial.company}</p>
                </div>
              </div>
              <div className={styles.testimonialRating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className={styles.star}>⭐</span>
                ))}
              </div>
              <p className={styles.testimonialText}>{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}