import styles from '../PersonalAccountStyle.module.css';

const EventStatusBadge = ({ status }) => {
  if (status === 'DRAFT') return <span className={styles.draftBadge}>Черновик</span>;
  if (status === 'PUBLISHED') return <span className={styles.publishedBadge}>Опубликовано</span>;
  if (status === 'FINISHED') return <span className={styles.finishedBadge}>Завершено</span>;
  if (status === 'CANCELLED') return <span className={styles.cancelledBadge}>Отменено</span>;
  return null;
};

const AdminEventsList = ({
  events,
  canManageEvent,
  onEdit,
  onPublish,
  onFinish,
  onCancel,
}) => (
  <div className={styles.eventsBlock}>
    <h3>Все мероприятия</h3>
    <div className={styles.eventsList}>
      {events.length > 0 ? (
        events.map((event) => {
          const canManage = canManageEvent(event);
          const isClosed = event.status === 'FINISHED' || event.status === 'CANCELLED';

          return (
            <div key={event.id || event.publicId} className={styles.eventCard}>
              <h4 className={styles.eventTitle}>{event.title}</h4>
              <p className={styles.eventDescription}>{event.description}</p>
              <div className={styles.eventMeta}>
                <span>{event.date}</span>
                <span>{event.location}</span>
                <span>{event.points} баллов</span>
                <EventStatusBadge status={event.status} />
              </div>
              {canManage && !isClosed && (
                <div className={styles.eventActions}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => onEdit(event)}
                  >
                    Редактировать
                  </button>
                  {event.status === 'DRAFT' && (
                    <button
                      type="button"
                      className={styles.publishBtn}
                      onClick={() => onPublish(event)}
                    >
                      Опубликовать
                    </button>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      className={styles.finishBtn}
                      onClick={() => onFinish(event)}
                    >
                      Завершить
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.cancelEventBtn}
                    onClick={() => onCancel(event)}
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className={styles.eventCard}>
          <p className={styles.emptyStateText}>У вас пока нет созданных мероприятий.</p>
        </div>
      )}
    </div>
  </div>
);

export default AdminEventsList;
