import styles from '../PersonalAccountStyle.module.css';
import { getDirectionName } from '../utils/accountHelpers';

const AccountInfoCards = ({ profileData, isTeacher, isAdmin }) => (
  <div className={styles.userInfoBlock}>
    {!isTeacher && !isAdmin && (
      <div className={styles.infoCard}>
        <span className={styles.infoLabel}>Курс</span>
        <span className={styles.infoValue}>{profileData.course || 'Не указан'}</span>
      </div>
    )}
    <div className={styles.infoCard}>
      <span className={styles.infoLabel}>Направление</span>
      <span className={styles.infoValue}>{getDirectionName(profileData.direction)}</span>
    </div>
  </div>
);

export default AccountInfoCards;
