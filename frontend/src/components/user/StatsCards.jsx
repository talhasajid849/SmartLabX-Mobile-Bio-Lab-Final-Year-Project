// components/user/StatsCards.jsx
'use client';
import styles from '@/styles/user/StatsCards.module.css';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'My Samples',
      value: stats.samples,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🧪',
      bgColor: 'rgba(102, 126, 234, 0.1)',
    },
    {
      label: 'Reservations',
      value: stats.reservations,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '📅',
      bgColor: 'rgba(240, 147, 251, 0.1)',
    },
    {
      label: 'Reports',
      value: stats.reports,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: '📈',
      bgColor: 'rgba(79, 172, 254, 0.1)',
    },
    {
      label: 'Protocols',
      value: stats.protocols,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: '📋',
      bgColor: 'rgba(67, 233, 123, 0.1)',
    },
  ];

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsGrid}>
        {cards.map((card, index) => (
          <div
            key={index}
            className={styles.statCard}
            style={{
              '--gradient': card.gradient,
              '--bg-color': card.bgColor,
            }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>{card.icon}</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.statValue}>{card.value}</h3>
              <p className={styles.statLabel}>{card.label}</p>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
