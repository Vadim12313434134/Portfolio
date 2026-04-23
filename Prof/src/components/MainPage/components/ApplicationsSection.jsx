import styles from '../MainPageStyle.module.css';

const ApplicationsSection = ({ userApplications, getStatusInfo }) => {
  return (
    <div className={styles.applicationsSection}>
      <h2>Мои последние заявки:</h2>
      <div className={styles.applicationsList}>
        {userApplications.slice(0, 3).map((app) => {
          const statusInfo = getStatusInfo(app.status);

          return (
            <div key={app.id} className={styles.applicationCard}>
              <div className={styles.applicationInfo}>
                <h4>{app.eventTitle}</h4>
                <span className={styles.applicationDate}>{app.appliedDate}</span>
              </div>
              <div className={styles.applicationDetails}>
                <span className={styles.applicationPoints}>+{app.points} баллов</span>
                <div
                  className={`${styles.applicationStatusBadge} ${
                    statusInfo?.className ?? ''
                  }`}
                >
                  {statusInfo?.icon} {statusInfo?.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {userApplications.length > 3 && (
        <button className={styles.showAllBtn}>Показать все заявки →</button>
      )}
    </div>
  );
};

export default ApplicationsSection;

