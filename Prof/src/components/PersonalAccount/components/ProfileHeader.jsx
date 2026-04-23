import React from 'react';
import styles from '../PersonalAccountStyle.module.css';

const ProfileHeader = ({ profileData, initials }) => {
  return (
    <div className={styles.profileHeader}>
      <div className={styles.avatar}>
        {initials || profileData.firstName?.[0] || 'П'}
      </div>
      <div className={styles.profileInfo}>
        <h2 className={styles.profileName}>{profileData.fullName || 'Пользователь'}</h2>
        <p className={styles.profileSpecialization}>{profileData.specialization}</p>
        {profileData.firstName && profileData.lastName && (
          <p className={styles.profileDetails}>
            {profileData.firstName} {profileData.lastName}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;