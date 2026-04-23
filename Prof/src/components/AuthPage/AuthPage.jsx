import { useEffect, useState } from 'react';
import styles from './AuthPageStyle.module.css';
import { useNavigate } from 'react-router-dom';
import { loginUser, createUserProfile, fetchCurrentUser } from '../../api/backendApi';
import { getAuthToken, saveAuthSession, clearAuthSession } from '../../api/session';

const AuthPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState('');
  const [tempLogin, setTempLogin] = useState('');
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    direction: '',
    course: 1,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const directions = [
    { value: 'FRONTEND', label: 'Frontend-разработка' },
    { value: 'BACKEND', label: 'Backend-разработка' },
    { value: 'PROJECT_MANAGER', label: 'Pm' },
    { value: 'DESIGNER', label: 'UX/UI Дизайн' },
    { value: 'SYSTEM_ADMIN', label: 'Аналитика' },
    { value: 'INDEFINITE', label: 'Не определено' },
  ];

  const courses = [
    { value: 1, label: '1 курс' },
    { value: 2, label: '2 курс' },
    { value: 3, label: '3 курс' },
    { value: 4, label: '4 курс' },
  ];

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    // Проверяем, есть ли уже пользователь в localStorage
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      navigate('/MainPage', { replace: true });
    } else {
      clearAuthSession();
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'course' ? parseInt(value) : value,
    }));
  };

  // Шаг 1: Логин
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.login.trim()) {
      setError('Введите логин');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Введите пароль');
      setLoading(false);
      return;
    }

    try {
      const { token, isProfileExists, role, points } = await loginUser({
        login: formData.login.trim(),
        password: formData.password
      });
      
      console.log('Login result:', { token: !!token, isProfileExists, role });
      
      if (!token) {
        throw new Error('Не удалось получить токен');
      }
      
      if (isProfileExists === true) {
        // Получаем данные пользователя один раз
        const user = await fetchCurrentUser(token);
        console.log('User data from backend:', user);
        
        // Сохраняем все данные сразу
        const userWithData = {
          ...user,
          // Сохраняем firstName и lastName для отображения в личном кабинете
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.login,
          direction: user.direction,
          course: user.course,
          points: user.points || points || 0,
        };
        
        saveAuthSession({ token, user: userWithData });
        navigate('/MainPage', { replace: true });
      } else {
        // Профиля нет - переходим на создание профиля
        setTempToken(token);
        setTempLogin(formData.login);
        setStep(2);
        setError('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Создание профиля
  const handleProfileCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.direction) {
      setError('Выберите направление подготовки');
      setLoading(false);
      return;
    }

    if (!formData.course) {
      setError('Выберите курс');
      setLoading(false);
      return;
    }

    try {
      const user = await createUserProfile(tempToken, {
        direction: formData.direction,
        course: formData.course
      });
      
      console.log('Profile created:', user);
      
      // Сохраняем пользователя с созданными данными
      const userWithData = {
        ...user,
        firstName: user.firstName || tempLogin,
        lastName: user.lastName || '',
        fullName: user.fullName || tempLogin,
        direction: formData.direction,
        course: formData.course,
      };
      
      saveAuthSession({ token: tempToken, user: userWithData });
      navigate('/MainPage', { replace: true });
    } catch (err) {
      console.error('Profile creation error:', err);
      setError(err.message || 'Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registrationContainer}>
      <div className={styles.registrationBox}>
        {step === 1 ? (
          <form className={styles.registrationForm} onSubmit={handleLogin}>
            <h2 className={styles.title}>Вход в систему</h2>
            
            <div className={styles.formGroup}>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleChange}
                placeholder="Логин"
                required
                autoComplete="username"
              />
            </div>

            <div className={styles.formGroup}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Пароль"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Входим...' : 'Войти'}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        ) : (
          <form className={styles.registrationForm} onSubmit={handleProfileCreate}>
            <h2 className={styles.title}>Заполните профиль</h2>
            <p className={styles.subtitle}>Пользователь: {tempLogin}</p>
            
            <div className={styles.formGroup}>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                required
                className={styles.select}
              >
                <option value="">Выберите направление подготовки</option>
                {directions.map(dir => (
                  <option key={dir.value} value={dir.value}>
                    {dir.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className={styles.select}
              >
                {courses.map(course => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Сохраняем...' : 'Сохранить и войти'}
            </button>

            <button 
              type="button" 
              className={styles.backBtn}
              onClick={() => setStep(1)}
            >
              Назад
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
