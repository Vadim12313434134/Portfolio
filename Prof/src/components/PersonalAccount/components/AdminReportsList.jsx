import styles from '../PersonalAccountStyle.module.css';
import {
  getReportCardKey,
  getReportReviewKey,
  getSubmissionStatusText,
  isHttpUrl,
} from '../utils/accountHelpers';

const AdminReportsList = ({
  reports,
  pointsByReport,
  onPointsChange,
  onReview,
}) => (
  <div className={styles.eventsBlock}>
    <h3>Отчеты студентов</h3>
    <div className={styles.eventsList}>
      {reports.length > 0 ? (
        reports.map((submission, index) => {
          const reportKey = getReportReviewKey(submission);

          return (
            <div key={getReportCardKey(submission, index)} className={styles.reportReviewCard}>
              <div className={styles.reportReviewHeader}>
                <div>
                  <h4 className={styles.eventTitle}>{submission.eventTitle}</h4>
                  <p className={styles.reportMetaText}>
                    Студент: {submission.studentName} • Отправлен: {submission.submittedAt}
                  </p>
                </div>
                <span className={styles.pendingBadge}>{getSubmissionStatusText(submission)}</span>
              </div>
              {isHttpUrl(submission.reportLink) ? (
                <a
                  className={styles.reportReviewText}
                  href={submission.reportLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {submission.reportLink}
                </a>
              ) : (
                <p className={styles.reportReviewText}>{submission.reportLink}</p>
              )}
              <div className={styles.reportReviewActions}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  max={submission.eventPoints || undefined}
                  className={styles.pointsInput}
                  value={pointsByReport[reportKey] ?? ''}
                  onChange={(event) => onPointsChange(submission, event.target.value)}
                  placeholder={submission.eventPoints ? `До ${submission.eventPoints}` : 'Баллы'}
                />
                <button
                  type="button"
                  className={styles.rejectBtn}
                  onClick={() => onReview(submission, 'rejected')}
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  className={styles.approveBtn}
                  onClick={() => onReview(submission, 'approved')}
                >
                  Начислить баллы
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles.eventCard}>
          <p className={styles.emptyStateText}>Новых отчетов на проверке пока нет.</p>
        </div>
      )}
    </div>
  </div>
);

export default AdminReportsList;
