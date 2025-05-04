"use client";

import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ROUTES } from '../lib/routes';
import { ThemeModeSwitch } from './ThemeModeSwitch';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  Tag, 
  Calendar as CalendarIcon,
  Clock,
  Menu,
  X
} from 'lucide-react';
import styles from './AppLayout.module.css';
import { useIsMobile } from '../helpers/useIsMobile';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className = '' }: AppLayoutProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { path: ROUTES.HOME, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: ROUTES.TASKS, label: 'Tasks', icon: <ListTodo size={20} /> },
    { path: ROUTES.PROJECTS, label: 'Projects', icon: <FolderKanban size={20} /> },
    { path: ROUTES.CATEGORIES, label: 'Categories', icon: <Tag size={20} /> },
    { path: ROUTES.CALENDAR, label: 'Calendar', icon: <CalendarIcon size={20} /> },
    { path: ROUTES.DAILY_PLANNER, label: 'Daily Planner', icon: <Clock size={20} /> },
  ];

  return (
    <div className={`${styles.layout} ${className}`}>
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button 
          className={styles.sidebarToggle} 
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.appTitle}>TaskFlow</h1>
          <ThemeModeSwitch className={styles.themeSwitch} />
        </div>
        
        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.path} className={styles.navItem}>
                <Link 
                  href={item.path} 
                  className={`${styles.navLink} ${router.pathname === item.path ? styles.active : ''}`}
                  onClick={closeSidebarOnMobile}
                >
                  {item.icon}
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};