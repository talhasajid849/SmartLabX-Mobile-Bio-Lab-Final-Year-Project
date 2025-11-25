"use client";
import React from "react";
import styles from "@/styles/visitor/landing.module.css";
import Link from "next/link";
import { useSelector } from "react-redux";
import Image from "next/image";

export default function HeroSection({ openRegisterModal }) {
  const { isAuthenticated, loading } = useSelector((state) => state.user);
  
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Welcome to Mobile Bio Lab</h1>
        <p className={styles.heroSubtitle}>
          Mobile Bio Lab on Wheels - Bringing Science to Your Doorstep
        </p>
        <p className={styles.heroDescription}>
          Access cutting-edge biological research facilities remotely. Perfect
          for students, researchers, and technicians in remote or virtual
          learning environments.
        </p>
        <div className={styles.heroButtons}>
          {isAuthenticated && !loading ? (
            <Link href="/dashboard/reservations">
              <button className={styles.btnHeroPrimary}>Reserve Your Slot</button>
            </Link>
          ) : (
            <button className={styles.btnHeroPrimary} onClick={openRegisterModal}>
              Get Started Free
            </button>
          )}

          <Link href="/about">
            <button className={styles.btnHeroSecondary}>Learn More</button>
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <h3 className={styles.heroStatNumber}>500+</h3>
            <p className={styles.heroStatLabel}>Active Users</p>
          </div>
          <div className={styles.heroStat}>
            <h3 className={styles.heroStatNumber}>1000+</h3>
            <p className={styles.heroStatLabel}>Samples Analyzed</p>
          </div>
          <div className={styles.heroStat}>
            <h3 className={styles.heroStatNumber}>50+</h3>
            <p className={styles.heroStatLabel}>Protocols</p>
          </div>
        </div>
      </div>

      <div className={styles.heroImage}>
        <div className={styles.heroImagePlaceholder}>
          <Image
            className={styles.heroImagePlaceholder}
            src="https://res.cloudinary.com/dbdrhbe4q/image/upload/v1763041709/13241855_5180171_wprj1v.jpg"
            alt="Bio lab X Banner Image"
            width={500}
            height={500}
          />
        </div>
      </div>
    </section>
  );
}