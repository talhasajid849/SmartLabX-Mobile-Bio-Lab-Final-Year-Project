"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/visitor/landing.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "@/store/actions/auth.action";
import Image from "next/image";
import Logo from "../common/logo";

export default function Navbar({ openRegisterModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const pathname = usePathname();

  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div className={styles.navBrand}>
            <Logo />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className={styles.navMenuDesktop}>
          {links.map((link) => {
            const isActive = pathname === link.href;
            
            return (
              <div
                key={link.href}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                style={{ position: "relative" }}
              >
                <Link href={link.href} style={{ textDecoration: "none" }}>
                  <button
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  >
                    {link.name}
                  </button>
                </Link>
              </div>
            );
          })}

          {/* Auth Section */}
          {isAuthenticated ? (
            <div
              title="Go to dashboard"
              className={styles.avatarContainer}
              onClick={() => (window.location.href = "/dashboard")}
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <Image
                src={user?.profile_picture}
                alt={user?.first_name || "User"}
                className={styles.avatar}
                width={50}
                height={50}
              />
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/login">
                <button className={styles.btnLogin}>Login</button>
              </Link>
              <button className={styles.btnRegister} onClick={openRegisterModal}>
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <button className={styles.mobileNavLink}>{link.name}</button>
          </Link>
        ))}
        {isAuthenticated ? (
          <button
            className={styles.btnRegister}
            style={{ width: "100%", marginTop: "8px" }}
            onClick={() => (window.location.href = "/dashboard")}
          >
            Dashboard
          </button>
        ) : (
          <>
            <Link href="/login">
              <button className={styles.btnLogin} style={{ width: "100%", marginTop: "8px" }}>
                Login
              </button>
            </Link>
            <button
              className={styles.btnRegister}
              style={{ width: "100%" }}
              onClick={() => {
                openRegisterModal();
                setMobileMenuOpen(false);
              }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}