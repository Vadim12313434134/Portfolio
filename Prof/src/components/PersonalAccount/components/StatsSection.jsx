import styles from '../PersonalAccountStyle.module.css';

const StatsSection = ({
  userPoints,
  pendingPoints,
  goal,
  remainingPoints,
  progressPercent,
}) => {
  return (
    <div className={styles.statsWrapper}>
      <div className={styles.pointsCard}>
        <div className={styles.pointsHeader}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>

          <h3>Ваши баллы</h3>
        </div>

        <div className={styles.pointsAmount}>{userPoints}</div>
        <p className={styles.pointsDescription}>
          Баллы начисляются после проверки преподавателем
        </p>

        <div className={styles.pendingPoints}>
          <span>⏳ На проверке: </span>
          <strong>{pendingPoints} баллов</strong>
        </div>
      </div>

      <div className={styles.goalCard}>
        <div className={styles.goalHeader}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8M8 12h8"></path>
          </svg>
          <h3>Достижение цели в {goal} баллов</h3>
        </div>

        <div className={styles.goalPeriod}>
          Цель первого периода: {goal} баллов за Апрель
        </div>

        <div className={styles.goalStats}>
          <div className={styles.goalStatItem}>
            <span className={styles.goalStatLabel}>Было получено</span>
            <span className={styles.goalStatValue}>{userPoints} баллов</span>
          </div>
          <div className={styles.goalStatItem}>
            <span className={styles.goalStatLabel}>Осталось</span>
            <span className={styles.goalStatValue}>
              {remainingPoints} баллов
            </span>
          </div>
        </div>

        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className={styles.goalMessage}>
          {progressPercent >= 100
            ? '🎉 Поздравляем! Цель достигнута! 🎉'
            : `До цели осталось ${remainingPoints} баллов`}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;

