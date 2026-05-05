import { useRef, useState } from 'react';
import styles from '../PersonalAccountStyle.module.css';

const AdminSummaryCards = ({ onCreate, onDownloadTemplate, onImportCsv }) => {
  const csvInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleOpenCsvDialog = () => {
    csvInputRef.current?.click();
  };

  const handleCsvSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      await onImportCsv?.(selectedFile);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.statsWrapper}>
      <div className={styles.goalCard}>
        <div className={styles.goalHeader}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          <h3>Создать мероприятие</h3>
        </div>
        <div className={styles.goalPeriod}>Новая публикация для студентов</div>
        <p className={styles.adminSummaryText}>
          Создавайте новые мероприятия и отслеживайте поступающие отчеты.
        </p>
        <button
          type="button"
          className={styles.adminCreateInlineBtn}
          onClick={onCreate}
        >
          Создать мероприятие
        </button>
        <button
          type="button"
          className={styles.adminSecondaryInlineBtn}
          onClick={onDownloadTemplate}
        >
          Скачать шаблон импорта
        </button>
        <button
          type="button"
          className={styles.adminSecondaryInlineBtn}
          onClick={handleOpenCsvDialog}
          disabled={Boolean(isImporting)}
        >
          {isImporting ? 'Импорт CSV...' : 'Импортировать CSV'}
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
  );
};

export default AdminSummaryCards;

