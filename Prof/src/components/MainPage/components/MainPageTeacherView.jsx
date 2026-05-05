import { useRef, useState } from 'react';
import styles from '../MainPageStyle.module.css';
import MainPageEventsSection from './MainPageEventsSection';

const MainPageTeacherView = ({
  onOpenCreateForm,
  onDownloadEventsTemplate,
  onImportEventsCsv,
  filtersSectionProps,
  eventsGridProps,
  getStatusInfo,
}) => {
  const csvInputRef = useRef(null);
  const [isImportingEvents, setIsImportingEvents] = useState(false);

  const handleOpenCsvDialog = () => {
    csvInputRef.current?.click();
  };

  const handleCsvSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;

    setIsImportingEvents(true);
    try {
      await onImportEventsCsv?.(selectedFile);
    } finally {
      setIsImportingEvents(false);
    }
  };

  return (
    <>
      <div className={styles.adminCreateWrap}>
        <div className={styles.adminCreateCard}>
          <div className={styles.adminCreateHeader}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            <h3>Создание мероприятия</h3>
          </div>
          <div className={styles.adminCreateBadge}>Новая публикация для студентов</div>
          <p className={styles.adminSummaryText}>
            Создавайте мероприятия прямо с главной страницы. Новое событие сразу попадет в ленту студентов.
          </p>
          <button
            type="button"
            className={styles.adminCreateInlineBtn}
            onClick={onOpenCreateForm}
          >
            Создать мероприятие
          </button>
          <button
            type="button"
            className={styles.adminSecondaryInlineBtn}
            onClick={onDownloadEventsTemplate}
          >
            Скачать шаблон импорта
          </button>
          <button
            type="button"
            className={styles.adminSecondaryInlineBtn}
            onClick={handleOpenCsvDialog}
            disabled={Boolean(isImportingEvents)}
          >
            {isImportingEvents ? 'Импорт CSV...' : 'Импортировать CSV'}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className={styles.hiddenFileInput}
            onChange={handleCsvSelected}
          />
        </div>
      </div>

      <MainPageEventsSection
        filtersSectionProps={filtersSectionProps}
        eventsGridProps={eventsGridProps}
        getStatusInfo={getStatusInfo}
      />
    </>
  );
};

export default MainPageTeacherView;
