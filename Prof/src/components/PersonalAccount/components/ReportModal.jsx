import styles from '../PersonalAccountStyle.module.css';

const ReportModal = ({
  reportModal,
  reportText,
  setReportText,
  onClose,
  onSaveDraft,
  onSubmit,
}) => {
  if (!reportModal) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.reportModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>Отчет о посещении</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            x
          </button>
        </div>

        <div className={styles.modalBody}>
          <p>
            <strong>Мероприятие:</strong> {reportModal.eventTitle}
          </p>
          <label>Ссылка на Telegraph:</label>
          <input
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="https://telegra.ph/"
            className={styles.reportTextarea}
          />
          <p className={styles.reportHint}>
            Сначала можно сохранить черновик, а затем отправить отчет преподавателю.
          </p>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelReportBtn} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={styles.submitReportBtn} onClick={onSaveDraft}>
            Сохранить черновик
          </button>
          <button type="button" className={styles.submitReportBtn} onClick={onSubmit}>
            Отправить преподавателю
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
