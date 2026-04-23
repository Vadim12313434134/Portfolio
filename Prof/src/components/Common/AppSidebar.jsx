import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './AppSidebar.module.css';
import { clearAuthSession } from '../../api/session';

const AppSidebar = ({ activePage, logoSrc, brandName = 'it-college' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/AuthPage', { replace: true });
  };

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
      </nav>

      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.navItem} onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
