import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './AppSidebar.module.css';
import { getStoredAuthUser } from '../../api/session';

const AppSidebar = ({ activePage, logoSrc, brandName = 'it-college' }) => {
  const currentUser = getStoredAuthUser();
  const normalizedRole = String(currentUser?.role ?? '').trim().toLowerCase();
  const normalizedAccessLevel = String(currentUser?.accessLevel ?? '').trim().toLowerCase();
  const canManageUsers = ['admin', 'moderator'].includes(normalizedRole)
    || ['admin', 'moderator'].includes(normalizedAccessLevel);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        {logoSrc ? <img className={styles.logo} src={logoSrc} alt="Logo" /> : null}
        <span className={styles.brand}>{brandName}</span>
      </div>

      <nav className={styles.navLinks}>
        <NavLink
          to="/MainPage"
          className={`${styles.navItem} ${activePage === 'main' ? styles.active : ''}`}
        >
          Мероприятия
        </NavLink>
        <NavLink
          to="/PersonalAccount"
          className={`${styles.navItem} ${activePage === 'account' ? styles.active : ''}`}
        >
          Личный кабинет
        </NavLink>
        {canManageUsers && (
          <NavLink
            to="/Users"
            className={`${styles.navItem} ${activePage === 'users' ? styles.active : ''}`}
          >
            Пользователи
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default AppSidebar;
