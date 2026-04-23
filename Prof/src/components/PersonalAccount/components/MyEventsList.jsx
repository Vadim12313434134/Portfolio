import styles from '../PersonalAccountStyle.module.css';

const getReportStatusText = (event) => {
  if (event.reportStatus === 'accepted') {
    return `Проверено, начислено ${event.awardedPoints ?? event.points ?? 0} баллов`;
  }

  if (event.reportStatus === 'refused') {
    return 'Отчет отклонен преподавателем';
  }

  if (event.reportStatus === 'submitted') {
    return 'Отчет на проверке';
  }

  if (event.reportStatus === 'draft' && event.reportLink) {
    return 'Черновик сохранен';
  }

  return 'Вы записаны, отчет еще не создан';
};

const MyEventsList = ({ myEvents, onOpenReport, onSubmitReport }) => {
  return (
    <div className={styles.eventsBlock}>
      <h3>Мои мероприятия</h3>
      <div className={styles.eventsList}>
        {myEvents.length > 0 ? (
          myEvents.map((event) => (
            <div key={event.reportPublicId || event.publicId || event.id} className={styles.eventCard}>
              <div className={styles.eventContent}>
                <h4 className={styles.eventTitle}>{event.title}</h4>
                <p className={styles.eventDescription}>{event.description}</p>
                <div className={styles.eventMeta}>
                  <span className={styles.eventDate}>{event.date}</span>
                  <span className={styles.eventLocation}>{event.location}</span>
                  <span className={styles.eventTeacher}>{event.teacher}</span>
                  <span className={styles.eventPoints}>+{event.points} баллов</span>
                </div>

                {event.reportLink && (
                  <a className={styles.reportLink} href={event.reportLink} target="_blank" rel="noreferrer">
                    Открыть отчет
                  </a>
                )}

                <div className={styles.eventActions}>
                  {event.reportStatus === 'accepted' ? (
                    <span className={styles.completedBadge}>{getReportStatusText(event)}</span>
                  ) : event.reportStatus === 'refused' ? (
                    <span className={styles.rejectedBadge}>{getReportStatusText(event)}</span>
                  ) : event.reportStatus === 'submitted' ? (
                    <span className={styles.pendingBadge}>{getReportStatusText(event)}</span>
                  ) : event.reportStatus === 'draft' && event.reportLink ? (
                    <>
                      <span className={styles.pendingBadge}>{getReportStatusText(event)}</span>
                      <button
                        type="button"
                        className={styles.testBtn}
                        onClick={() => onOpenReport(event, 'draft')}
                      >
                        Редактировать отчет
                      </button>
                      <button
                        type="button"
                        className={styles.testBtn}
                        onClick={() => onSubmitReport(event)}
                      >
                        Отправить преподавателю
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={styles.pendingBadge}>{getReportStatusText(event)}</span>
                      <button
                        type="button"
                        className={styles.testBtn}
                        onClick={() => onOpenReport(event, 'draft')}
                      >
                        Создать отчет
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.eventCard}>
            <p className={styles.emptyStateText}>Вы пока не записались ни на одно мероприятие.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEventsList;
