import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../AuthPage/AuthPageStyle.module.css';
import { createUserProfile } from '../../api/backendApi';
import {
  clearAuthSession,
  clearProfileSetupSession,
  getProfileSetupSession,
  saveAuthSession,
} from '../../api/session';


const DIRECTIONS = [
    { value: 'FRONTEND', label: 'Frontend-разработка' },
    { value: 'BACKEND', label: 'Backend-разработка' },
    { value: 'PROJECT_MANAGER', label: 'Проектный-менеджер' },
    { value: 'DESIGNER', label: 'UX/UI Дизайн' },
    { value: 'SYSTEM_ADMIN', label: 'Системный администратор' },
    { value: 'INDEFINITE', label: 'Не определено' },
];

const COURSES = [1, 2, 3, 4];

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const pending = useMemo(() => getProfileSetupSession(), []);

  const [direction, setDirection] = useState('');
  const [course, setCourse] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pending.token) {
      navigate('/AuthPage', { replace: true });
    }
  }, [pending.token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pending.token) return;

    setLoading(true);
    setError('');

    try {
      const user = await createUserProfile(pending.token, { direction, course });
      saveAuthSession({ token: pending.token, user });
      clearProfileSetupSession();
      navigate('/MainPage', { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось создать профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearAuthSession();
    navigate('/AuthPage', { replace: true });
  };

  return (
    <div className={styles.registrationContainer}>
      <div className={styles.registrationBox}>
        <form className={styles.registrationForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Заполните профиль</h2>
          <p className={styles.subtitle}>Пользователь: {pending.login}</p>

          <div className={styles.formGroup}>
            <select
              className={styles.select}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              required
            >
              <option value="">Выберите направление</option>
              {DIRECTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.select}
              value={course}
              onChange={(e) => setCourse(Number(e.target.value))}
              required
            >
              {COURSES.map((value) => (
                <option key={value} value={value}>
                  {value} курс
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.btn} disabled={loading || !direction}>
            {loading ? 'Сохраняем...' : 'Сохранить и войти'}
          </button>

          <button type="button" className={styles.backBtn} onClick={handleBack}>
            Назад
          </button>

          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
