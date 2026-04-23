import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import styles from './MainPageStyle.module.css';
import Logo from './png/Logo.png';
import Slider from './Slider/Slider';
import AppSidebar from '../Common/AppSidebar';
import { useNavigate } from 'react-router-dom';
import FiltersSection from './components/FiltersSection';
import EventsGrid from './components/EventsGrid';
import ApplicationsSection from './components/ApplicationsSection';
import AdminCreateEventModal from './components/AdminCreateEventModal';
import Toast from './components/Toast';
import {
  cancelEnrollInEvent,
  cancelEvent,
  createEvent,
  EVENT_MANAGEMENT_STATUSES,
  fetchCurrentUser,
  fetchEvents,
  fetchMyApplications,
  fetchMyEvents,
  finishEvent,
  getDirectionLabel,
  isTeacherProfile,
  publishEvent,
  registerForEvent,
  updateEvent,
} from '../../api/backendApi';
import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthUser,
  saveAuthSession,
  saveProfileSetupSession,
} from '../../api/session';

const getEventRegistrationId = (event = {}) =>
  event.publicId ?? event.eventPublicId ?? event.id ?? '';

const getApplicationEventId = (application = {}) =>
  application.eventPublicId ?? '';

const idsEqual = (left, right) =>
  Boolean(left && right) && String(left) === String(right);

const getEventOwnerId = (event = {}) =>
  event.createdById ?? event.createdByTeacherId ?? event.teacherId ?? event.createdBy?.id ?? event.teacher?.id ?? '';

const getUserOwnerIds = (user = {}) => [
  user.id,
  user.ldapId,
  user.userId,
].map((value) => String(value ?? '').trim()).filter(Boolean);

const MainPage = () => {
  const mainContentRef = useRef(null);
  const didLoadRef = useRef(false);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [userApplications, setUserApplicationsState] = useState([]);
  const [userPoints, setUserPointsState] = useState(0);
  const goal = 100;
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsViewMode, setEventsViewMode] = useState('grid');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Определяем роль пользователя
  const isTeacher = currentUser ? isTeacherProfile(currentUser) : false;
  const isAdmin = currentUser?.role === 'admin';
  const isTeacherOrAdmin = isTeacher || isAdmin;

  const [loading, setLoading] = useState(true);

  // Состояние для модального окна создания мероприятия
  const [adminCreateFormOpen, setAdminCreateFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEventData, setNewEventData] = useState({
    title: '',
    date: '',
    location: '',
    maxPoints: '',
    description: '',
    direction: '',
    course: '',
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const mergeEventsById = useCallback((primaryEvents = [], secondaryEvents = []) => {
    const merged = new Map();

    [...primaryEvents, ...secondaryEvents].forEach((event, index) => {
      const key = event.publicId || event.id || `${event.title}-${event.eventDateTime || event.date}-${index}`;
      merged.set(key, { ...merged.get(key), ...event });
    });

    return Array.from(merged.values());
  }, []);

  const updateEventParticipation = useCallback((eventId, alreadyParticipation, eventPatch = {}) => {
    setEvents((prev) => prev.map((event) => {
      const currentEventId = getEventRegistrationId(event);
      if (!idsEqual(currentEventId, eventId)) return event;

      return {
        ...event,
        ...eventPatch,
        id: eventPatch.id || event.id || eventId,
        publicId: eventPatch.publicId || event.publicId || eventId,
        alreadyParticipation,
      };
    }));

    if (!alreadyParticipation) {
      setUserApplicationsState((prev) => prev.filter((app) => !idsEqual(getApplicationEventId(app), eventId)));
    }
  }, []);

  const loadAllEvents = useCallback(async (user) => {
    const token = getAuthToken();
    if (!token) return [];

    try {
      const canViewAllStatuses = isTeacherProfile(user);
      const visibleEventsRequest = canViewAllStatuses
        ? fetchEvents(token, { statuses: EVENT_MANAGEMENT_STATUSES })
          .then((result) => (result.length > 0 ? result : fetchEvents(token)))
        : fetchEvents(token);
      const requests = [visibleEventsRequest];

      if (isTeacherProfile(user)) {
        requests.push(fetchMyEvents(token));
      }

      const [publicEventsResult, ownEventsResult] = await Promise.allSettled(requests);
      const publicEvents = publicEventsResult.status === 'fulfilled'
        ? publicEventsResult.value.filter((event) => canViewAllStatuses || event.status !== 'DRAFT')
        : [];
      const ownEvents = ownEventsResult?.status === 'fulfilled' ? ownEventsResult.value : [];
      const eventsList = mergeEventsById(publicEvents, ownEvents);

      if (publicEventsResult.status === 'rejected' && eventsList.length === 0) {
        throw publicEventsResult.reason;
      }

      setEvents(eventsList);
      return eventsList;
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('Не удалось загрузить мероприятия', 'error');
      return [];
    }
  }, [mergeEventsById, showToast]);


  // Функция для загрузки данных пользователя
  const loadUserData = useCallback(async (user) => {
    const token = getAuthToken();
    if (!token) return;

    if (!isTeacherProfile(user)) {
      try {
        const applications = await fetchMyApplications(token);
        setUserApplicationsState(applications);
      } catch (error) {
        console.warn('Failed to load user applications:', error);
        setUserApplicationsState([]);
      }
      setUserPointsState(user.points ?? 0);
    } else {
      setUserApplicationsState([]);
      setUserPointsState(0);
    }
  }, []);

  // Загрузка при монтировании
  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;

    const token = getAuthToken();

    if (!token) {
      navigate('/AuthPage', { replace: true });
      return;
    }

    fetchCurrentUser(token)
      .then(async (user) => {
        const storedUser = getStoredAuthUser();
        const userWithPoints = {
          ...user,
          points: user.points || storedUser?.points || 0,
        };
        setCurrentUser(userWithPoints);
        saveAuthSession({ token, user: userWithPoints });
        
        // Загружаем мероприятия и данные пользователя параллельно
        await Promise.all([
          loadAllEvents(userWithPoints),
          loadUserData(userWithPoints)
        ]);
        
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching user:', error);
        if (error?.status === 404 || error?.status === 403) {
          saveProfileSetupSession({ token });
          navigate('/ProfileSetup', { replace: true });
          return;
        }
        clearAuthSession();
        navigate('/AuthPage', { replace: true });
      });
  }, [navigate, loadAllEvents, loadUserData]);

  // Функция для открытия модального окна
  const handleOpenCreateForm = () => {
    if (!isTeacherOrAdmin) {
      showToast('Только преподаватель может создавать мероприятия', 'error');
      return;
    }
    setAdminCreateFormOpen(true);
  };

  // Функция для закрытия модального окна
  const handleCloseCreateForm = () => {
    setAdminCreateFormOpen(false);
    setEditingEvent(null);
    setNewEventData({
      title: '',
      date: '',
      location: '',
      maxPoints: '',
      description: '',
      direction: '',
      course: '',
    });
  };

  const formatDateTimeInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const canManageEvent = useCallback((event = {}) => {
    if (!isTeacherOrAdmin) return false;
    if (isAdmin) return true;
    if (event.isOwnEvent) return true;

    const ownerId = String(getEventOwnerId(event) ?? '').trim();
    if (!ownerId) return false;

    return getUserOwnerIds(currentUser).includes(ownerId);
  }, [currentUser, isAdmin, isTeacherOrAdmin]);

  const handleOpenEditForm = (event) => {
    if (!isTeacherOrAdmin) return;
    if (!canManageEvent(event)) {
      showToast('Можно редактировать только свои мероприятия', 'error');
      return;
    }

    setEditingEvent(event);
    setNewEventData({
      title: event.title || '',
      date: formatDateTimeInput(event.eventDateTime || event.date),
      location: event.location || '',
      maxPoints: event.maxPoints || event.points || '',
      description: event.description || '',
      direction: event.direction || '',
      course: event.course || '',
    });
    setAdminCreateFormOpen(true);
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setNewEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Функция создания мероприятия
  // Функция создания мероприятия (POST)
const handleCreateEvent = async (submitData) => {
  if (!isTeacherOrAdmin) {
    showToast('Только преподаватель может создавать мероприятия', 'error');
    return;
  }

  const token = getAuthToken();
  if (!token) return;

  try {
    const payload = {
      title: submitData.title.trim(),
      description: submitData.description?.trim() || '',
      eventDateTime: submitData.eventDateTime,
      location: submitData.location?.trim() || '',
      maxPoints: Number(submitData.maxPoints),
      direction: submitData.direction,
      course: Number(submitData.course),
    };

    if (editingEvent) {
      const publicId = editingEvent.publicId;
      if (!publicId) {
        showToast('Не удалось определить ID мероприятия для редактирования', 'error');
        return;
      }

      if (!canManageEvent(editingEvent)) {
        showToast('Можно редактировать только свои мероприятия', 'error');
        return;
      }

      const updatedEvent = await updateEvent(token, publicId, payload);
      setEvents((prev) => prev.map((event) => {
        const sameEvent = (event.publicId || event.id) === publicId;
        return sameEvent ? { ...event, ...updatedEvent, ...payload, publicId, isOwnEvent: true } : event;
      }));
      showToast('Мероприятие обновлено', 'success');
    } else {
      const createdEvent = await createEvent(token, payload);
      const publicId = createdEvent.publicId;
      const { publicationError, ...eventData } = createdEvent;
      const nextEvent = { ...eventData, ...payload, publicId, isOwnEvent: true };

      if (!publicId) {
        setEvents((prev) => [nextEvent, ...prev]);
        showToast('Мероприятие создано, но бэк не прислал publicId', 'error');
      } else if (publicationError) {
        setEvents((prev) => [nextEvent, ...prev]);
        showToast('Мероприятие создано как черновик, но публикация запрещена для текущего пользователя', 'info');
      } else {
        setEvents((prev) => [nextEvent, ...prev]);
        showToast('Мероприятие создано как черновик', 'success');
      }
    }
    
    handleCloseCreateForm();
  } catch (error) {
    console.error('Create event error:', error);
    showToast(error.message || 'Не удалось сохранить мероприятие', 'error');
  }
};

  const handlePublishEvent = async (event) => {
    const token = getAuthToken();
    const publicId = event.publicId || event.id;

    if (!token || !publicId) {
      showToast('Не удалось определить мероприятие для публикации', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно публиковать только свои мероприятия', 'error');
      return;
    }

    try {
      const publishedEvent = await publishEvent(token, publicId);
      setEvents((prev) => prev.map((item) => {
        const itemId = item.publicId || item.id;
        return itemId === publicId
          ? { ...item, ...publishedEvent, publicId, status: 'PUBLISHED' }
          : item;
      }));
      showToast('Мероприятие опубликовано для студентов', 'success');
    } catch (error) {
      showToast(
        error.status === 403
          ? 'Публикация запрещена для текущего пользователя'
          : (error.message || 'Не удалось опубликовать мероприятие'),
        'error',
      );
    }
  };

  const handleFinishEvent = async (event) => {
    const token = getAuthToken();
    const publicId = event.publicId || event.id;

    if (!token || !publicId) {
      showToast('Не удалось определить мероприятие для завершения', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно завершать только свои мероприятия', 'error');
      return;
    }

    try {
      const finishedEvent = await finishEvent(token, publicId);
      setEvents((prev) => prev.map((item) => {
        const itemId = item.publicId || item.id;
        return itemId === publicId
          ? { ...item, ...finishedEvent, publicId, status: 'FINISHED' }
          : item;
      }));
      showToast('Мероприятие завершено', 'success');
    } catch (error) {
      showToast(error.message || 'Не удалось завершить мероприятие', 'error');
    }
  };

  const handleCancelEvent = async (event) => {
    const token = getAuthToken();
    const publicId = event.publicId || event.id;

    if (!token || !publicId) {
      showToast('Не удалось определить мероприятие для отмены', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно отменять только свои мероприятия', 'error');
      return;
    }

    try {
      const cancelledEvent = await cancelEvent(token, publicId);
      setEvents((prev) => prev.map((item) => {
        const itemId = item.publicId || item.id;
        return itemId === publicId
          ? { ...item, ...cancelledEvent, publicId, status: 'CANCELLED' }
          : item;
      }));
      showToast('Мероприятие отменено', 'success');
    } catch (error) {
      showToast(error.message || 'Не удалось отменить мероприятие', 'error');
    }
  };

  // Форматирование даты
  const formatEventDate = useCallback((dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Преобразуем события для отображения
  const formattedEvents = useMemo(() => {
    return events.map((event, index) => {
      const eventId = getEventRegistrationId(event);
      const reactKey = eventId || `event-${index}-${event.title || 'untitled'}`;
      const formattedDate = formatEventDate(event.eventDateTime || event.date);
      const application = userApplications.find((item) => {
        const applicationEventId = getApplicationEventId(item);
        return idsEqual(applicationEventId, eventId);
      });

      return {
        ...event,
        id: eventId,
        eventPublicId: eventId,
        reactKey,
        alreadyParticipation: event.alreadyParticipation === true || Boolean(application),
        isRegistered: event.alreadyParticipation === true || Boolean(application),
        reportPublicId: application?.publicId ?? event.reportPublicId,
        reportStatus: application?.status ?? event.reportStatus,
        reportLink: application?.reportLink ?? event.reportLink,
        formattedDate,
        displayTitle: event.title || 'Без названия',
        displayDate: formattedDate || event.date || 'Дата не указана',
        displayLocation: event.location || 'Место не указано',
        displayDirection: getDirectionLabel(event.direction),
        displayTeacher: event.teacherName || event.teacher || 'Преподаватель',
        displayPoints: event.maxPoints || event.points || 0,
        canManage: canManageEvent(event),
      };
    });
  }, [canManageEvent, events, formatEventDate, userApplications]);

  // Фильтрация событий
  const filteredEvents = useMemo(() => {
    let filtered = formattedEvents;
    
    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.displayTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Фильтр по направлению
    if (selectedDirection !== 'all') {
      filtered = filtered.filter(event => event.direction === selectedDirection);
    }
    
    // Фильтр по курсу
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(event => Number(event.course) === Number(selectedCourse));
    }
    
    return filtered;
  }, [formattedEvents, searchTerm, selectedDirection, selectedCourse]);

  const sliderEvents = formattedEvents;

  // Получаем уникальные направления для фильтра
  const directions = useMemo(() => {
    const dirs = formattedEvents.map(event => event.direction).filter(Boolean);
    return ['all', ...new Set(dirs)];
  }, [formattedEvents]);

  // Получаем уникальные курсы для фильтра
  const courses = useMemo(() => {
    const courseNums = formattedEvents
      .map(event => Number(event.course))
      .filter(course => !isNaN(course) && course > 0);
    return ['all', ...new Set(courseNums.sort((a, b) => a - b))];
  }, [formattedEvents]);

  const handleRegisterForEvent = async (eventId) => {
    const normalizedEventId = eventId ? String(eventId) : '';
    const event = formattedEvents.find((item) => idsEqual(item.id, normalizedEventId));

    if (!currentUser || isTeacherOrAdmin) {
      showToast('Только студенты могут записываться на мероприятия', 'info');
      return;
    }

    if (!normalizedEventId || !event) {
      showToast('Не удалось определить ID мероприятия для записи', 'error');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const enrolledEvent = await registerForEvent(token, normalizedEventId);
      updateEventParticipation(normalizedEventId, true, enrolledEvent);
      showToast('Вы успешно записаны на мероприятие', 'success');
    } catch (error) {
      if (error?.status === 409) {
        updateEventParticipation(normalizedEventId, true);
        showToast(`Вы уже записаны на "${event.title}"`, 'info');
        return;
      }

      showToast(error.message || 'Не удалось записаться на мероприятие', 'error');
    }
  };

  const handleCancelEnrollForEvent = async (eventId) => {
    const normalizedEventId = eventId ? String(eventId) : '';
    const event = formattedEvents.find((item) => idsEqual(item.id, normalizedEventId));

    if (!currentUser || isTeacherOrAdmin) {
      showToast('Только студенты могут отменять запись на мероприятия', 'info');
      return;
    }

    if (!normalizedEventId || !event) {
      showToast('Не удалось определить ID мероприятия для отмены записи', 'error');
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const cancelledEvent = await cancelEnrollInEvent(token, normalizedEventId);
      updateEventParticipation(normalizedEventId, false, cancelledEvent);
      showToast('Запись на мероприятие отменена', 'success');
    } catch (error) {
      if (error?.status === 404 || error?.status === 409) {
        updateEventParticipation(normalizedEventId, false);
        showToast(`Вы не записаны на "${event.title}"`, 'info');
        return;
      }

      showToast(error.message || 'Не удалось отменить запись на мероприятие', 'error');
    }
  };

  const remainingPoints = Math.max(goal - userPoints, 0);
  const progressPercent = goal > 0 ? (userPoints / goal) * 100 : 0;

  const handleRegisterWithToast = async (eventId, title) => {
    const normalizedEventId = eventId ? String(eventId) : '';
    const event = normalizedEventId
      ? formattedEvents.find((item) => idsEqual(item.id, normalizedEventId))
      : formattedEvents.find((item) => item.title === title);

    if (!event) {
      showToast('Мероприятие не найдено', 'error');
      return;
    }

    if (isTeacherOrAdmin) {
      showToast('Преподаватель не записывается на мероприятия', 'info');
      return;
    }

    if (!event.id) {
      showToast('Не удалось определить ID мероприятия для записи', 'error');
      return;
    }

    if (event.isRegistered) {
      await handleCancelEnrollForEvent(event.id);
      return;
    }

    await handleRegisterForEvent(event.id);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'DRAFT':
        return { text: 'Черновик', className: styles.statusDraft, icon: '○' };
      case 'PUBLISHED':
        return { text: 'Опубликовано', className: styles.statusPublished, icon: '✓' };
      case 'FINISHED':
        return { text: 'Завершено', className: styles.statusFinished, icon: '■' };
      case 'CANCELLED':
        return { text: 'Отменено', className: styles.statusCancelled, icon: '×' };
      case 'pending':
        return { text: 'На проверке', className: styles.statusPending, icon: '⏳' };
      case 'approved':
        return { text: 'Одобрено', className: styles.statusApproved, icon: '✓' };
      case 'rejected':
        return { text: 'Отклонено', className: styles.statusRejected, icon: '✕' };
      case 'draft':
        return { text: 'Черновик отчета', className: styles.statusDraft, icon: '○' };
      case 'submitted':
        return { text: 'Отчет на проверке', className: styles.statusPending, icon: '⏳' };
      case 'accepted':
        return { text: 'Отчет принят', className: styles.statusApproved, icon: '✓' };
      case 'refused':
        return { text: 'Отчет отклонен', className: styles.statusRejected, icon: '✕' };
      default:
        return null;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDirection('all');
    setSelectedCourse('all');
    setSelectedDate('');
  };

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className={styles.appContainer}>Загрузка...</div>;
  }

  return (
    <div className={styles.appContainer}>
      <AppSidebar activePage="main" logoSrc={Logo} brandName="it-college" />

      <main ref={mainContentRef} className={styles.mainContent}>
        <div className={styles.headerActions}>
         
        </div>

        <Slider 
          events={sliderEvents} 
          onRegister={handleRegisterWithToast} 
          isAdmin={isTeacherOrAdmin} 
        />

        <div className={styles.statsWrapper}>
          {isTeacherOrAdmin ? (
            <>
              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  <h3>Создание мероприятия</h3>
                </div>
                <div className={styles.goalPeriod}>Новая публикация для студентов</div>
                <p className={styles.adminSummaryText}>
                  Создавайте мероприятия прямо с главной страницы. Новое событие сразу попадет в ленту студентов.
                </p>
                <button
                  type="button"
                  className={styles.adminCreateInlineBtn}
                  onClick={handleOpenCreateForm}
                >
                  Создать мероприятие
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.pointsCard}>
                <div className={styles.pointsHeader}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <h3>Ваши баллы</h3>
                </div>
                <div className={styles.pointsAmount}>{userPoints}</div>
                <p className={styles.pointsDescription}>
                  Баллы начисляются после проверки преподавателем
                </p>
                <div className={styles.pendingPoints}>
                  <span>На проверке: </span>
                  <strong>
                    {userApplications
                      .filter((app) => ['pending', 'submitted'].includes(app.status))
                      .reduce((sum, app) => sum + app.points, 0)}{' '}
                    баллов
                  </strong>
                </div>
              </div>

              <div className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v8M8 12h8"></path>
                  </svg>
                  <h3>Достижение цели в {goal} баллов</h3>
                </div>
                <div className={styles.goalPeriod}>Цель периода: {goal} баллов</div>
                <div className={styles.goalStats}>
                  <div className={styles.goalStatItem}>
                    <span className={styles.goalStatLabel}>Получено</span>
                    <span className={styles.goalStatValue}>{userPoints} баллов</span>
                  </div>
                  <div className={styles.goalStatItem}>
                    <span className={styles.goalStatLabel}>Осталось</span>
                    <span className={styles.goalStatValue}>{remainingPoints} баллов</span>
                  </div>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className={styles.goalMessage}>
                  {progressPercent >= 100 ? 'Цель достигнута' : `До цели осталось ${remainingPoints} баллов`}
                </div>
              </div>
            </>
          )}
        </div>

        <FiltersSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedDirection={selectedDirection}
          setSelectedDirection={setSelectedDirection}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          directions={directions}
          courses={courses}
          clearFilters={clearFilters}
        />

        <EventsGrid
          filteredEvents={filteredEvents}
          eventsCount={formattedEvents.length}
          getStatusInfo={getStatusInfo}
          handleRegisterWithToast={handleRegisterWithToast}
          scrollToTop={scrollToTop}
          isAdmin={isTeacherOrAdmin}
          onEditEvent={handleOpenEditForm}
          onPublishEvent={handlePublishEvent}
          onFinishEvent={handleFinishEvent}
          onCancelEvent={handleCancelEvent}
          canManageEvent={canManageEvent}
          viewMode={eventsViewMode}
          onViewModeChange={setEventsViewMode}
        />

        {!isTeacherOrAdmin && (
          <ApplicationsSection userApplications={userApplications} getStatusInfo={getStatusInfo} />
        )}
      </main>

      <AdminCreateEventModal
        isTeacher={isTeacherOrAdmin}
        adminCreateFormOpen={adminCreateFormOpen}
        onClose={handleCloseCreateForm}
        newEventData={newEventData}
        onChange={handleAdminFormChange}
        onSubmit={handleCreateEvent}
        mode={editingEvent ? 'edit' : 'create'}
      />

      <Toast toast={toast} />
    </div>
  );
};

export default MainPage;
