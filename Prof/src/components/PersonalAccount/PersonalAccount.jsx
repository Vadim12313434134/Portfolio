import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import styles from './PersonalAccountStyle.module.css';
import Logo from './png/Logo.png';
import AppSidebar from '../Common/AppSidebar';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './components/ProfileHeader';
import StatsSection from './components/StatsSection';
import MyEventsList from './components/MyEventsList';
import ReportModal from './components/ReportModal';
import AccountInfoCards from './components/AccountInfoCards';
import AdminEventsList from './components/AdminEventsList';
import AdminReportsList from './components/AdminReportsList';
import AdminSummaryCards from './components/AdminSummaryCards';
import AdminCreateEventModal from '../MainPage/components/AdminCreateEventModal';
import Toast from '../MainPage/components/Toast';
import {
  cancelEvent,
  createEvent,
  EVENT_MANAGEMENT_STATUSES,
  fetchAdminPendingReports,
  fetchCurrentUser,
  fetchEvents,
  fetchMyRegisteredEvents,
  finishEvent,
  isTeacherProfile,
  publishEvent,
  reviewReport,
  saveEventReportDraft,
  submitEventReport,
  updateEvent,
} from '../../api/backendApi';
import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthUser,
  saveAuthSession,
  saveProfileSetupSession,
} from '../../api/session';
import {
  DEFAULT_PROFILE_DATA,
  EMPTY_EVENT_FORM,
  formatDateTimeInput,
  getEventOwnerId,
  getInitials,
  getReportReviewKey,
  getSubmissionEventId,
  getSubmissionPublicId,
  getUserOwnerIds,
} from './utils/accountHelpers';

const PersonalAccount = () => {
  const navigate = useNavigate();
  const didLoadRef = useRef(false);
  const [reportModal, setReportModal] = useState(null);
  const [reportText, setReportText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [myEvents, setMyEventsState] = useState([]);
  const [userPoints, setUserPointsState] = useState(0);
  const [events, setEvents] = useState([]);
  const [adminPendingReports, setAdminPendingReports] = useState([]);
  const [reportPointsById, setReportPointsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [adminCreateFormOpen, setAdminCreateFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEventData, setNewEventData] = useState(EMPTY_EVENT_FORM);

  const [profileData, setProfileData] = useState(DEFAULT_PROFILE_DATA);

  // Определяем роль по наличию course
  const isTeacher = currentUser ? isTeacherProfile(currentUser) : false;
  const isAdmin = currentUser?.role === 'admin';

  const goal = 100;
  const remainingPoints = Math.max(goal - userPoints, 0);
  const progressPercent = goal > 0 ? (userPoints / goal) * 100 : 0;

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);


  // Функция для получения текста специализации
  const getSpecializationText = useCallback((user = currentUser) => {
    if (user?.role === 'admin') return 'Администратор мероприятий';
    if (isTeacherProfile(user)) return 'Преподаватель';
    return 'Студент';
  }, [currentUser]);

  const mergeEventsById = useCallback((primaryEvents = [], secondaryEvents = []) => {
    const merged = new Map();

    [...primaryEvents, ...secondaryEvents].forEach((event, index) => {
      const key = event.publicId || event.id || `${event.title}-${event.eventDateTime || event.date}-${index}`;
      merged.set(key, { ...merged.get(key), ...event });
    });

    return [...merged.values()];
  }, []);

  const loadPageData = useCallback(async (user) => {
    const token = getAuthToken();
    if (!token) return;

    if (isTeacherProfile(user)) {
      const userOwnerIds = getUserOwnerIds(user);
      const isOwnedByCurrentUser = (event = {}) => {
        const ownerId = String(getEventOwnerId(event) ?? '').trim();
        return Boolean(ownerId && userOwnerIds.includes(ownerId));
      };
      const allEventsRequest = fetchEvents(token, { statuses: EVENT_MANAGEMENT_STATUSES })
        .then((result) => (result.length > 0 ? result : fetchEvents(token)));
      const createdEventsRequest = fetchEvents(token, {
        statuses: EVENT_MANAGEMENT_STATUSES,
        createdByTeacherId: user.id,
      });
      const [allEventsResult, ownEventsResult] = await Promise.allSettled([
        allEventsRequest,
        createdEventsRequest,
      ]);
      const allEvents = allEventsResult.status === 'fulfilled' ? allEventsResult.value : [];
      const ownEvents = ownEventsResult.status === 'fulfilled' ? ownEventsResult.value : [];
      const ownedEvents = mergeEventsById(
        ownEvents,
        allEvents.filter(isOwnedByCurrentUser),
      ).map((event) => ({ ...event, isOwnEvent: true }));
      const visibleEvents = mergeEventsById(allEvents, ownedEvents);
      const participationRecords = await fetchAdminPendingReports(token, ownedEvents);
      setEvents(visibleEvents);
      setAdminPendingReports(participationRecords);
      setMyEventsState([]);
      setUserPointsState(0);
    } else {
      setEvents([]);
      const registeredEvents = await fetchMyRegisteredEvents(token);
      setMyEventsState(registeredEvents);
      setUserPointsState(user.points ?? 0);
      setAdminPendingReports([]);
    }
  }, [mergeEventsById]);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;

    const token = getAuthToken();

    if (!token) {
      navigate('/AuthPage', { replace: true });
      return;
    }

    // Загружаем данные пользователя с бэка
    const loadInitialData = async () => {
      let user;

      try {
        const fetchedUser = await fetchCurrentUser(token);
        const storedUser = getStoredAuthUser();
        user = {
          ...fetchedUser,
          points: fetchedUser.points || storedUser?.points || 0,
        };
        setCurrentUser(user);
        
        // Обновляем сессию с актуальными данными
        saveAuthSession({ token, user });

        // Формируем полное имя из firstName и lastName
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const displayName = fullName || user.login || 'Пользователь';
        
        setProfileData({
          id: String(user.id ?? ''),
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          fullName: displayName,
          course: user.course !== null && user.course !== undefined ? user.course : null,
          direction: user.direction || '',
          specialization: getSpecializationText(user),
          email: user.email || '',
          phone: user.phone || '',
        });

      } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        if (error?.status === 404 || error?.status === 403) {
          saveProfileSetupSession({ token });
          navigate('/ProfileSetup', { replace: true });
          return;
        }
        clearAuthSession();
        navigate('/AuthPage', { replace: true });
        return;
      }

      try {
        await loadPageData(user);
      } catch (error) {
        console.error('Ошибка загрузки данных личного кабинета:', error);
        setEvents([]);
        setMyEventsState([]);
        setAdminPendingReports([]);
        setUserPointsState(user.points ?? 0);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [navigate, loadPageData, getSpecializationText]);

  const pendingPoints = myEvents
    .filter((event) => event.reportLink && ['pending', 'submitted'].includes(event.reportStatus))
    .reduce((sum, event) => sum + event.points, 0);

  const adminCreatedEvents = useMemo(() => {
    if (!isTeacher && !isAdmin) return [];
    return events;
  }, [isTeacher, isAdmin, events]);

  const canManageEvent = useCallback((event = {}) => {
    if (!isTeacher && !isAdmin) return false;
    if (isAdmin) return true;

    const ownerId = String(getEventOwnerId(event) ?? '').trim();
    if (!ownerId) return event.isOwnEvent === true;

    return getUserOwnerIds(currentUser).includes(ownerId);
  }, [currentUser, isAdmin, isTeacher]);


  const handleReportPointsChange = (submission, value) => {
    const key = getReportReviewKey(submission);
    setReportPointsById((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOpenReport = (event, action = 'draft') => {
    const reportPublicId = event.reportLink ? event.reportPublicId : '';

    setReportModal({
      eventPublicId: event.eventPublicId || event.publicId || event.id,
      publicId: reportPublicId,
      hasExistingReport: Boolean(reportPublicId),
      eventTitle: event.title,
      action,
    });
    setReportText(event.reportLink || '');
  };

  const handleCloseReport = () => {
    setReportModal(null);
    setReportText('');
  };

  const validateReportLink = (reportLink) => {
    if (!reportLink) {
      showToast('Пожалуйста, укажите ссылку на Telegraph', 'error');
      return false;
    }

    if (!/^https:\/\/telegra\.ph\/.+/i.test(reportLink)) {
      showToast('Отчет должен быть ссылкой на Telegraph в формате https://telegra.ph/...', 'error');
      return false;
    }

    return true;
  };

  const updateMyEventReport = (report, fallbackLink, fallbackStatus = 'draft', source = reportModal) => {
    if (!source) return;

    setMyEventsState((prev) => prev.map((event) => {
      const eventPublicId = event.eventPublicId || event.publicId || event.id;
      const reportPublicId = event.reportPublicId;
      const isSameEvent = String(eventPublicId) === String(source.eventPublicId);
      const isSameReport = source.publicId && String(reportPublicId) === String(source.publicId);
      const nextStatus = report.status || fallbackStatus;

      return isSameEvent || isSameReport
        ? {
            ...event,
            reportPublicId: report.publicId || event.reportPublicId,
            reportLink: report.reportLink || fallbackLink,
            reportStatus: nextStatus,
            reportSubmitted: nextStatus !== 'draft',
            awardedPoints: report.awardedPoints ?? event.awardedPoints,
          }
        : event;
    }));
  };

  const handleSaveReportDraft = async () => {
    const token = getAuthToken();
    if (!token || !currentUser || !reportModal) return;

    const reportLink = reportText.trim();
    if (!validateReportLink(reportLink)) return;

    try {
      const report = await saveEventReportDraft(token, {
        eventPublicId: reportModal.eventPublicId,
        publicId: reportModal.publicId,
        forceCreate: !reportModal.hasExistingReport,
        reportLink,
      });

      updateMyEventReport(report, reportLink, 'draft');
      setReportModal((prev) => (prev
        ? {
            ...prev,
            publicId: report.publicId || prev.publicId,
            hasExistingReport: Boolean(report.publicId || prev.publicId),
          }
        : prev));
      showToast('Черновик отчета сохранен', 'success');
    } catch (error) {
      showToast(error.message || 'Не удалось сохранить черновик отчета', 'error');
    }
  };

  const handleSubmitReport = async () => {
    const token = getAuthToken();
    if (!token || !currentUser || !reportModal) return;

    const reportLink = reportText.trim();
    if (!validateReportLink(reportLink)) return;

    try {
      const report = await submitEventReport(token, {
        eventPublicId: reportModal.eventPublicId,
        publicId: reportModal.publicId,
        forceCreate: !reportModal.hasExistingReport,
        reportLink,
      });

      updateMyEventReport(report, reportLink, 'submitted');

      handleCloseReport();
      showToast('Отчет отправлен на проверку преподавателю', 'success');
    } catch (error) {
      console.error('Report submit failed:', {
        status: error?.status,
        data: error?.data,
        reportModal,
      });
      showToast(error.message || 'Не удалось отправить отчет', 'error');
    }
  };

  const handleSubmitSavedReport = async (event) => {
    const token = getAuthToken();
    if (!token || !currentUser) return;

    const eventPublicId = event.eventPublicId || event.publicId || event.id;
    const publicId = event.reportPublicId;
    const reportLink = String(event.reportLink || '').trim();

    if (!publicId || !reportLink) {
      handleOpenReport(event, 'submit');
      return;
    }

    if (!validateReportLink(reportLink)) return;

    try {
      const report = await submitEventReport(token, {
        eventPublicId,
        publicId,
        reportLink,
      });

      updateMyEventReport(report, reportLink, 'submitted', { eventPublicId, publicId });
      showToast('Отчет отправлен преподавателю', 'success');
    } catch (error) {
      console.error('Saved report submit failed:', {
        status: error?.status,
        data: error?.data,
        event,
      });
      showToast(error.message || 'Не удалось отправить отчет', 'error');
    }
  };

  const handleReviewReport = async (submission, nextStatus) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const normalizedStatus = String(nextStatus).toLowerCase();
      const isAcceptAction = normalizedStatus === 'accepted' || normalizedStatus === 'approved';
      const reportKey = getReportReviewKey(submission);
      const submissionEventId = getSubmissionEventId(submission);
      const submissionPublicId = getSubmissionPublicId(submission);

      if (!submissionPublicId || !submissionEventId) {
        console.error('Report review skipped: missing participation ids', {
          eventPublicId: submissionEventId,
          publicId: submissionPublicId,
          knownFields: {
            publicId: submission.publicId,
            eventPublicId: submission.eventPublicId,
            reportLink: submission.reportLink,
            status: submission.status,
          },
          keys: submission && typeof submission === 'object' ? Object.keys(submission) : [],
        });
        showToast('Нельзя принять или отклонить отчет: не удалось найти publicId записи или eventPublicId мероприятия', 'error');
        await loadPageData(currentUser);
        return;
      }

      const rawPoints = isAcceptAction ? reportPointsById[reportKey] : 0;
      const normalizedPoints = String(rawPoints ?? '').trim();

      if (isAcceptAction) {
        if (!normalizedPoints) {
          showToast('Введите количество баллов для начисления', 'error');
          return;
        }

        const awardedPoints = Number(normalizedPoints);
        if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
          showToast('Введите целое количество баллов больше 0', 'error');
          return;
        }

        if (submission.eventPoints && awardedPoints > submission.eventPoints) {
          showToast(`Нельзя начислить больше ${submission.eventPoints} баллов`, 'error');
          return;
        }

        console.info('Report accept request', {
          eventPublicId: submissionEventId,
          publicId: submissionPublicId,
          points: awardedPoints,
        });

        await reviewReport(token, {
          publicId: submissionPublicId,
          eventPublicId: submissionEventId,
        }, nextStatus, submissionEventId, {
          points: awardedPoints,
        });
        setAdminPendingReports((prev) => prev.filter((report) => getReportReviewKey(report) !== reportKey));
        setReportPointsById((prev) => {
          const next = { ...prev };
          delete next[reportKey];
          return next;
        });
        showToast('Баллы начислены, отчет принят', 'success');
        return;
      }

      await reviewReport(token, {
        publicId: submissionPublicId,
        eventPublicId: submissionEventId,
      }, nextStatus, submissionEventId);
      await loadPageData(currentUser);
      showToast('Статус отчета обновлен', 'success');
    } catch (error) {
      console.error('Report review failed:', {
        status: error?.status,
        data: error?.data,
        eventPublicId: getSubmissionEventId(submission),
        publicId: getSubmissionPublicId(submission),
        nextStatus,
      });
      showToast(
        error?.status === 403
          ? 'Бэк запретил начисление баллов: у текущего аккаунта нет прав проверять отчет по этому мероприятию'
          : (error.message || 'Не удалось обновить статус отчета'),
        'error',
      );
    }
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setNewEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetEventForm = () => {
    setEditingEvent(null);
    setNewEventData(EMPTY_EVENT_FORM);
  };

  const handleOpenCreateForm = () => {
    resetEventForm();
    setAdminCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setAdminCreateFormOpen(false);
    resetEventForm();
  };


  const handleOpenEditForm = (event) => {
    const publicId = event.publicId || event.id;
    if (!publicId) {
      showToast('Не удалось определить ID мероприятия для редактирования', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно редактировать только свои мероприятия', 'error');
      return;
    }

    setEditingEvent({ ...event, publicId });
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

  const handleCreateEvent = async (submitData) => {
    if (!isTeacher && !isAdmin) {
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
        const publicId = editingEvent.publicId || editingEvent.id;
        if (!publicId) {
          showToast('Не удалось определить ID мероприятия для редактирования', 'error');
          return;
        }

        if (!canManageEvent(editingEvent)) {
          showToast('Можно редактировать только свои мероприятия', 'error');
          return;
        }

        const updatedEvent = await updateEvent(token, publicId, payload);
        setEvents((prev) => prev.map((item) => {
          const itemId = item.publicId || item.id;
          return itemId === publicId
            ? { ...item, ...updatedEvent, ...payload, publicId, isOwnEvent: true }
            : item;
        }));
        handleCloseCreateForm();
        showToast('Мероприятие обновлено', 'success');
        return;
      }

      const createdEvent = await createEvent(token, payload);
      const publicId = createdEvent.publicId;
      const { publicationError, ...eventData } = createdEvent;
      const nextEvent = { ...eventData, ...payload, publicId, isOwnEvent: true };

      setEvents((prev) => [nextEvent, ...prev]);
      handleCloseCreateForm();
      showToast(
        publicationError
          ? 'Мероприятие создано как черновик, но публикация запрещена для текущего пользователя'
          : 'Мероприятие создано как черновик',
        publicationError ? 'info' : 'success',
      );
    } catch (error) {
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
      showToast('Мероприятие опубликовано и появится на главной странице', 'success');
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


  if (loading) {
    return <div className={styles.profilePage}>Загрузка...</div>;
  }

  return (
    <div className={styles.profilePage}>
      <AppSidebar activePage="account" logoSrc={Logo} brandName="it-college" />

      <main className={styles.mainContent}>
        <ProfileHeader
          profileData={profileData}
          initials={getInitials(profileData.fullName)}
        />

        <AccountInfoCards
          profileData={profileData}
          isTeacher={isTeacher}
          isAdmin={isAdmin}
        />

        {(isTeacher || isAdmin) ? (
          <>
            <AdminSummaryCards
              eventsCount={adminCreatedEvents.length}
              pendingReportsCount={adminPendingReports.length}
              onCreate={handleOpenCreateForm}
            />

            <AdminEventsList
              events={adminCreatedEvents}
              canManageEvent={canManageEvent}
              onEdit={handleOpenEditForm}
              onPublish={handlePublishEvent}
              onFinish={handleFinishEvent}
              onCancel={handleCancelEvent}
            />

            <AdminReportsList
              reports={adminPendingReports}
              pointsByReport={reportPointsById}
              onPointsChange={handleReportPointsChange}
              onReview={handleReviewReport}
            />
          </>
        ) : (
          <>
            <StatsSection
              userPoints={userPoints}
              pendingPoints={pendingPoints}
              goal={goal}
              remainingPoints={remainingPoints}
              progressPercent={progressPercent}
            />

            <MyEventsList
              myEvents={myEvents}
              onOpenReport={handleOpenReport}
              onSubmitReport={handleSubmitSavedReport}
            />
          </>
        )}
      </main>

      <ReportModal
        reportModal={reportModal}
        reportText={reportText}
        setReportText={setReportText}
        onClose={handleCloseReport}
        onSaveDraft={handleSaveReportDraft}
        onSubmit={handleSubmitReport}
      />

      <AdminCreateEventModal
        isTeacher={isTeacher || isAdmin}
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

export default PersonalAccount;
