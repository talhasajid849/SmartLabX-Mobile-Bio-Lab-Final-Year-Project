'use client';
import { useRouter } from 'next/navigation';
import styles from '@/styles/user/QuickActions.module.css';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Add Sample',
      description: 'Register a new biological sample',
      icon: '🧪',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      path: '/dashboard/samples/new',
    },
    {
      title: 'Book Lab',
      description: 'Reserve a time slot for lab access',
      icon: '📅',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f093fb',
      path: '/dashboard/reservations/new',
    },
    {
      title: 'View Protocols',
      description: 'Browse experiment protocols',
      icon: '📋',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#4facfe',
      path: '/dashboard/protocols',
    },
    {
      title: 'Generate Report',
      description: 'Create analytical reports',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: '#43e97b',
      path: '/dashboard/reports',
    },
    {
      title: 'View Analytics',
      description: 'Visualize data with charts',
      icon: '📉',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: '#fa709a',
      path: '/dashboard/analytics',
    },
  ];

  return (
    <div className={styles.quickActions}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon}>⚡</span>
          Quick Actions
        </h2>
        <p className={styles.sectionSubtitle}>
          Get started with common tasks
        </p>
      </div>

      <div className={styles.actionsGrid}>
        {actions.map((action, index) => (
          <button
            key={index}
            className={styles.actionCard}
            onClick={() => router.push(action.path)}
            style={{
              '--gradient': action.gradient,
              '--color': action.color,
            }}
          >
            <div className={styles.cardInner}>
              <div className={styles.iconWrapper}>
                <span className={styles.icon}>{action.icon}</span>
                <div className={styles.iconGlow}></div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.actionTitle}>{action.title}</h3>
                <p className={styles.actionDescription}>{action.description}</p>
              </div>
              <div className={styles.arrowIcon}>→</div>
            </div>
            <div className={styles.cardBackground}></div>
          </button>
        ))}
      </div>
    </div>
  );
}
