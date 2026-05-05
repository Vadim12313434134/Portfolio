import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PersonalAccountStyle.module.css';
import Logo from './png/Logo.png';
import AppSidebar from '../Common/AppSidebar';
import ProfileHeader from './components/ProfileHeader';
import StatsSection from './components/StatsSection';
import MyEventsList from './components/MyEventsList';
import ReportModal from './components/ReportModal';
import AccountInfoCards from './components/AccountInfoCards';
import AdminReportsList from './components/AdminReportsList';
import AdminSummaryCards from './components/AdminSummaryCards';
import AdminCreateEventModal from '../MainPage/components/AdminCreateEventModal';
import Toast from '../MainPage/components/Toast';
import {
  cancelEvent,
  createEvent,
  EVENT_MANAGEMENT_STATUSES,
  fetchAdminPendingReports,
  fetchCurrentUserGoals,
  fetchCurrentUserActivePeriodSummary,
  fetchCurrentUserPeriodsSummary,
  fetchCurrentUserSummary,
  fetchEvents,
  fetchEventsImportTemplate,
  importEventsFromCsv,
  fetchMyEvents,
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
  getStoredAuthUser,
  saveAuthSession,
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

const hasAdminAccess = (user = {}) =>
  ['admin', 'moderator'].includes(String(user?.accessLevel ?? '').trim().toLowerCase())
  || ['admin', 'moderator'].includes(String(user?.role ?? '').trim().toLowerCase());

const getSpecializationTextByUser = (user = {}) => {
  if (hasAdminAccess(user)) return '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0439';
  if (isTeacherProfile(user)) return '\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c';
  return '\u0421\u0442\u0443\u0434\u0435\u043d\u0442';
};

const toProfileData = (user) => {
  if (!user) return DEFAULT_PROFILE_DATA;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = fullName || user.login || '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c';

  return {
    id: String(user.id ?? ''),
    ldapId: String(user.id ?? user.ldapId ?? ''),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: displayName,
    course: user.course !== null && user.course !== undefined ? user.course : null,
    direction: user.direction || '',
    specialization: getSpecializationTextByUser(user),
    email: user.email || '',
    phone: user.phone || '',
  };
};

const DEFAULT_STUDENT_PERIOD_PROGRESS = {
  periodName: '',
  courseNumber: 0,
  points: 0,
  approvedReportsCount: 0,
  targetPoints: 0,
  goalReached: false,
};

const normalizeStudentPeriodProgress = (raw = {}, fallbackPoints = 0) => {
  const points = Number(raw.points ?? fallbackPoints ?? 0) || 0;
  const targetPointsRaw = Number(raw.targetPoints ?? 0);
  const targetPoints = Number.isFinite(targetPointsRaw) ? Math.max(targetPointsRaw, 0) : 0;

  return {
    periodName: String(raw.periodName ?? '').trim(),
    courseNumber: Number(raw.courseNumber ?? 0) || 0,
    points,
    approvedReportsCount: Number(raw.approvedReportsCount ?? 0) || 0,
    targetPoints,
    goalReached: Boolean(raw.goalReached ?? (targetPoints > 0 && points >= targetPoints)),
  };
};

const PersonalAccount = () => {
  const didLoadRef = useRef(false);
  const [reportModal, setReportModal] = useState(null);
  const [reportText, setReportText] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [myEvents, setMyEventsState] = useState([]);
  const [userPoints, setUserPointsState] = useState(0);
  const [events, setEvents] = useState([]);
  const [adminPendingReports, setAdminPendingReports] = useState([]);
  const [reportPointsById, setReportPointsById] = useState({});
  const [toast, setToast] = useState(null);
  const [studentPeriodProgress, setStudentPeriodProgress] = useState(DEFAULT_STUDENT_PERIOD_PROGRESS);

  const [adminCreateFormOpen, setAdminCreateFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEventData, setNewEventData] = useState(EMPTY_EVENT_FORM);

  const [profileData, setProfileData] = useState(() => toProfileData(getStoredAuthUser()));
  const isTeacher = currentUser ? isTeacherProfile(currentUser) : false;
  const isAdmin = hasAdminAccess(currentUser);

  const goal = Number(studentPeriodProgress.targetPoints ?? 0) || 0;
  const periodPoints = Number(studentPeriodProgress.points ?? 0) || 0;
  const hasTargetGoal = goal > 0;
  const progressPeriodName = studentPeriodProgress.periodName || 'Период не назначен';
  const remainingPoints = Math.max(goal - periodPoints, 0);
  const progressPercent = hasTargetGoal ? Math.min((periodPoints / goal) * 100, 100) : 0;
  const goalReached = studentPeriodProgress.goalReached || (hasTargetGoal && periodPoints >= goal);

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

    return [...merged.values()];
  }, []);

  const loadPageData = useCallback(async (user) => {

    if (isTeacherProfile(user)) {
      const isAdminUser = hasAdminAccess(user);
      const userOwnerIds = getUserOwnerIds(user);
      const isOwnedByCurrentUser = (event = {}) => {
        const ownerId = String(getEventOwnerId(event) ?? '').trim();
        return Boolean(ownerId && userOwnerIds.includes(ownerId));
      };
      const allEventsRequest = fetchEvents({ statuses: EVENT_MANAGEMENT_STATUSES })
        .then((result) => (result.length > 0 ? result : fetchEvents()));
      const createdEventsRequest = fetchMyEvents({
        statuses: EVENT_MANAGEMENT_STATUSES,
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
      )
        .map((event) => ({ ...event, isOwnEvent: true }));
      const visibleEvents = mergeEventsById(allEvents, ownedEvents);
      const recordsSourceEvents = isAdminUser ? visibleEvents : ownedEvents;
      const participationRecords = await fetchAdminPendingReports(recordsSourceEvents);
      setEvents(visibleEvents);
      setAdminPendingReports(participationRecords);
      setMyEventsState([]);
      setUserPointsState(0);
      setStudentPeriodProgress(DEFAULT_STUDENT_PERIOD_PROGRESS);
    } else {
      setEvents([]);
      const fallbackTotalPoints = Number(user.points ?? getStoredAuthUser()?.points ?? 0) || 0;
      const [registeredEventsResult, activePeriodSummaryResult, totalSummaryResult, goalsResult] = await Promise.allSettled([
        fetchMyRegisteredEvents(),
        fetchCurrentUserActivePeriodSummary(),
        fetchCurrentUserSummary(),
        fetchCurrentUserGoals(),
      ]);
      const resolvedTotalPoints = totalSummaryResult.status === 'fulfilled'
        ? (Number(totalSummaryResult.value.totalPoints ?? fallbackTotalPoints) || 0)
        : fallbackTotalPoints;

      if (registeredEventsResult.status !== 'fulfilled') {
        throw registeredEventsResult.reason;
      }

      setMyEventsState(registeredEventsResult.value);

      let resolvedProgress;

      if (activePeriodSummaryResult.status === 'fulfilled') {
        resolvedProgress = normalizeStudentPeriodProgress(activePeriodSummaryResult.value, resolvedTotalPoints);
      } else {
        console.warn('Failed to load active period summary:', activePeriodSummaryResult.reason);
        const [periodsSummaryResult] = await Promise.allSettled([
          fetchCurrentUserPeriodsSummary({
            page: 0,
            size: 1,
            sortBy: 'updatedAt',
            sortDirection: 'desc',
          }),
        ]);

        if (periodsSummaryResult.status === 'fulfilled' && periodsSummaryResult.value.summaries.length > 0) {
          resolvedProgress = normalizeStudentPeriodProgress(
            periodsSummaryResult.value.summaries[0],
            resolvedTotalPoints,
          );
        } else {
          if (periodsSummaryResult.status !== 'fulfilled') {
            console.warn('Failed to load periods summary:', periodsSummaryResult.reason);
          }
          resolvedProgress = normalizeStudentPeriodProgress({}, resolvedTotalPoints);
        }
      }
      if (goalsResult.status === 'fulfilled') {
        const goalsPayload = goalsResult.value ?? {};
        const goalPeriodName = String(goalsPayload.name ?? '').trim();
        const goalTargetPoints = Number(goalsPayload.targetPoints ?? 0) || 0;

        if (goalPeriodName || goalTargetPoints > 0) {
          resolvedProgress = normalizeStudentPeriodProgress({
            ...resolvedProgress,
            periodName: goalPeriodName || resolvedProgress.periodName,
            targetPoints: goalTargetPoints > 0 ? goalTargetPoints : resolvedProgress.targetPoints,
          }, resolvedTotalPoints);
        }
      } else {
        console.warn('Failed to load current user goals:', goalsResult.reason);
      }

      const resolvedPoints = Number(resolvedTotalPoints) || 0;
      setStudentPeriodProgress(resolvedProgress);
      setUserPointsState(resolvedPoints);
      setCurrentUser((prev) => (prev ? { ...prev, points: resolvedPoints } : prev));

      if (resolvedPoints !== fallbackTotalPoints) {
        saveAuthSession({
          user: {
            ...user,
            points: resolvedPoints,
          },
        });
      }
      setAdminPendingReports([]);
    }
  }, [mergeEventsById]);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    const defaultUser = {
      id: 'dev-user',
      ldapId: 'dev-user',
      login: 'dev-user',
      firstName: 'Dev',
      lastName: 'User',
      fullName: 'Dev User',
      role: 'student',
      accessLevel: 'student',
      points: 0,
      direction: '',
      course: null,
    };
    const user = getStoredAuthUser() || defaultUser;

    setCurrentUser(user);
    setProfileData(toProfileData(user));
    saveAuthSession({ user });
    loadPageData(user).catch((error) => {
      console.warn('Initial personal account data load failed:', error);
    });
  }, [loadPageData]);

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

    if (!/^https:\/\/telegra\.ph\/.*$/i.test(reportLink)) {
      showToast('Отчет должен быть ссылкой на Telegraph в формате https://telegra.ph/', 'error');
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
    if (!currentUser || !reportModal) return;

    const reportLink = reportText.trim();
    if (!validateReportLink(reportLink)) return;

    try {
      const report = await saveEventReportDraft({
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
    if (!currentUser || !reportModal) return;

    const reportLink = reportText.trim();
    if (!validateReportLink(reportLink)) return;

    try {
      const report = await submitEventReport({
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
    if (!currentUser) return;

    const eventPublicId = event.eventPublicId || event.publicId || event.id;
    const publicId = event.reportPublicId;
    const reportLink = String(event.reportLink || '').trim();

    if (!publicId || !reportLink) {
      handleOpenReport(event, 'submit');
      return;
    }

    if (!validateReportLink(reportLink)) return;

    try {
      const report = await submitEventReport({
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

    try {
      const normalizedStatus = String(nextStatus).toLowerCase();
      const isAcceptAction = normalizedStatus === 'accepted' || normalizedStatus === 'approved';
      const isRefuseAction = normalizedStatus === 'refused' || normalizedStatus === 'rejected';
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

      const matchedEvent = events.find((event) => {
        const eventId = String(event.publicId || event.id || '').trim();
        return eventId && eventId === String(submissionEventId);
      });

      if (!matchedEvent || !canManageEvent(matchedEvent)) {
        showToast('Можно отменять проверку только отчетов по своим мероприятиям', 'error');
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

        await reviewReport({
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

      await reviewReport({
        publicId: submissionPublicId,
        eventPublicId: submissionEventId,
      }, nextStatus, submissionEventId);

      if (isRefuseAction) {
        await loadPageData(currentUser);
        showToast('Проверка отчета отменена', 'success');
        return;
      }

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

        const updatedEvent = await updateEvent(publicId, payload);
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

      const createdEvent = await createEvent(payload);
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
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('Не удалось определить мероприятие для публикации', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно публиковать только свои мероприятия', 'error');
      return;
    }

    try {
      const publishedEvent = await publishEvent(publicId);
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
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('Не удалось определить мероприятие для завершения', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно завершать только свои мероприятия', 'error');
      return;
    }

    try {
      const finishedEvent = await finishEvent(publicId);
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
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('Не удалось определить мероприятие для отмены', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('Можно отменять только свои мероприятия', 'error');
      return;
    }

    try {
      const cancelledEvent = await cancelEvent(publicId);
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

  const handleDownloadEventsTemplate = async () => {

    try {
      const { blob, fileName, contentType } = await fetchEventsImportTemplate();
      const downloadBlob = blob instanceof Blob
        ? blob
        : new Blob([blob], { type: contentType || 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = fileName || 'events-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Шаблон импорта скачан', 'success');
    } catch (error) {
      console.error('Template download error:', error);
      showToast(error.message || 'Не удалось скачать шаблон импорта', 'error');
    }
  };

  const handleImportEventsCsv = async (file) => {
    if (!(file instanceof File)) {
      showToast('Выберите CSV-файл для импорта', 'error');
      return false;
    }

    const isCsvType = String(file.type || '').toLowerCase().includes('csv');
    const isCsvName = String(file.name || '').toLowerCase().endsWith('.csv');
    if (!isCsvType && !isCsvName) {
      showToast('Поддерживаются только CSV-файлы', 'error');
      return false;
    }

    try {
      await importEventsFromCsv(file);
      if (currentUser) {
        await loadPageData(currentUser);
      }
      showToast('Импорт мероприятий завершен', 'success');
      return true;
    } catch (error) {
      console.error('Events import error:', error);
      showToast(
        error?.status === 403
          ? 'Импорт запрещен: недостаточно прав'
          : (error.message || 'Не удалось импортировать CSV'),
        'error',
      );
      return false;
    }
  };

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
              onCreate={handleOpenCreateForm}
              onDownloadTemplate={handleDownloadEventsTemplate}
              onImportCsv={handleImportEventsCsv}
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
              periodPoints={periodPoints}
              goal={goal}
              hasTargetGoal={hasTargetGoal}
              periodName={progressPeriodName}
              goalReached={goalReached}
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






