import styles from '../PersonalAccountStyle.module.css';

const AdminSummaryCards = ({ eventsCount, pendingReportsCount, onCreate }) => (
  <div className={styles.statsWrapper}>
    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
        <h3>Создать мероприятие</h3>
      </div>
      <div className={styles.goalPeriod}>Новая публикация для студентов</div>
      <p className={styles.adminLeadText}>
        Создавайте новые мероприятия и отслеживайте поступающие отчеты.
      </p>
      <button
        type="button"
        className={styles.adminPrimaryBtn}
        onClick={onCreate}
      >
        Создать мероприятие
      </button>
    </div>

    <div className={styles.goalCard}>
      <div className={styles.goalHeader}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <path d="M16 2v4M8 2v4M3 10h18"></path>
        </svg>
        <h3>Созданные мероприятия</h3>
      </div>
      <div className={styles.goalPeriod}>Всего: {eventsCount}</div>
      <div className={styles.adminSummaryStats}>
        <div className={styles.goalStatItem}>
          <span className={styles.goalStatLabel}>Отчетов на проверке</span>
          <span className={styles.goalStatValue}>{pendingReportsCount}</span>
        </div>
        <div className={styles.goalStatItem}>
          <span className={styles.goalStatLabel}>Проверено</span>
          <span className={styles.goalStatValue}>-</span>
        </div>
      </div>
    </div>
  </div>
);

export default AdminSummaryCards;
