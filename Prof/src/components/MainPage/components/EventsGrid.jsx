import styles from '../MainPageStyle.module.css';
import { getDirectionLabel } from '../../../api/backendApi';

const EventsGrid = ({
  filteredEvents,
  eventsCount,
  getStatusInfo,
  handleRegisterWithToast,
  scrollToTop,
  isAdmin,
  onEditEvent,
  onPublishEvent,
  onFinishEvent,
  onCancelEvent,
  canManageEvent,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const events = Array.isArray(filteredEvents) ? filteredEvents : [];
  const isListView = viewMode === 'list';

  const formatEventDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (events.length === 0) {
    return (
      <div className={styles.eventsGrid}>
        <div className={styles.noEvents}>
          <p>Нет доступных мероприятий</p>
          <button type="button" className={styles.resetFiltersBtn} onClick={scrollToTop}>
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.eventsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <h2>Мероприятия</h2>
          <span className={styles.eventsCount}>Всего: {eventsCount}</span>
        </div>

        <div className={styles.viewToggle} aria-label="Переключить вид мероприятий">
          <button
            type="button"
            className={`${styles.viewToggleButton} ${!isListView ? styles.viewToggleButtonActive : ''}`}
            aria-pressed={!isListView}
            onClick={() => onViewModeChange?.('grid')}
          >
            Плитки
          </button>
          <button
            type="button"
            className={`${styles.viewToggleButton} ${isListView ? styles.viewToggleButtonActive : ''}`}
            aria-pressed={isListView}
            onClick={() => onViewModeChange?.('list')}
          >
            Список
          </button>
        </div>
      </div>

      <div className={`${styles.eventsGrid} ${isListView ? styles.eventsGridList : ''}`}>
        {events.map((event) => {
          const statusInfo = getStatusInfo?.(event.status);
          const formattedDate = event.displayDate || formatEventDate(event.eventDateTime || event.date);
          const location = event.displayLocation || event.location || 'Место не указано';
          const direction = event.displayDirection || getDirectionLabel(event.direction);
          const points = event.maxPoints || event.points || 0;
          const teacher = event.teacherName || event.teacher || 'Преподаватель';
          const canManage = Boolean(isAdmin && (event.canManage ?? canManageEvent?.(event) ?? true));

          return (
            <div
              key={event.reactKey || event.id}
              className={`${styles.eventCard} ${isListView ? styles.eventCardList : ''}`}
            >
              <div className={styles.eventHeader}>
                <h3 className={styles.eventTitle}>{event.title || event.displayTitle || 'Без названия'}</h3>
                <div className={styles.eventHeaderBadges}>
                  {statusInfo && (
                    <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  )}
                  <span className={styles.eventPointsBadge}>+{points} баллов</span>
                </div>
              </div>

              <div className={styles.eventDetails}>
                <div className={styles.detailItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{formattedDate || 'Дата не указана'}</span>
                </div>
                <div className={styles.detailItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
                    <circle cx="12" cy="9" r="3"></circle>
                  </svg>
                  <span>{location}</span>
                </div>
                <div className={styles.detailItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16"></path>
                    <path d="M4 12h16"></path>
                    <path d="M4 17h10"></path>
                  </svg>
                  <span>{direction}</span>
                </div>
                <div className={styles.detailItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6v12"></path>
                    <path d="M6 12h12"></path>
                  </svg>
                  <span>{event.course || '1'} курс</span>
                </div>
              </div>

              <div className={styles.teacherInfo}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{teacher}</span>
              </div>

              <p className={styles.eventDescription}>{event.description || 'Описание отсутствует'}</p>

              {!isAdmin && (
                <button
                  type="button"
                  className={`${styles.registerButton} ${event.isRegistered ? styles.registeredButton : ''}`}
                  onClick={() => handleRegisterWithToast(event.eventPublicId || event.publicId || event.id, event.title)}
                >
                  {event.isRegistered ? 'Отменить запись' : 'Записаться'}
                </button>
              )}

              {canManage && (
                <div className={styles.adminActions}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => onEditEvent?.(event)}
                  >
                    Редактировать
                  </button>
                  {event.status === 'DRAFT' && (
                    <button
                      type="button"
                      className={styles.publishBtn}
                      onClick={() => onPublishEvent?.(event)}
                    >
                      Опубликовать
                    </button>
                  )}
                  {event.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      className={styles.finishBtn}
                      onClick={() => onFinishEvent?.(event)}
                    >
                      Завершить
                    </button>
                  )}
                  {event.status !== 'FINISHED' && event.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className={styles.cancelEventBtn}
                      onClick={() => onCancelEvent?.(event)}
                    >
                      Отменить
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsGrid;
