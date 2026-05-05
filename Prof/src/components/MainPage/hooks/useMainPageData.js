import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  cancelEnrollInEvent,
  cancelEvent,
  createEvent,
  deleteEvent,
  EVENT_MANAGEMENT_STATUSES,
  fetchCurrentUserGoals,
  fetchCurrentUserActivePeriodSummary,
  fetchCurrentUserPeriodsSummary,
  fetchCurrentUserSummary,
  fetchEvents,
  fetchEventsImportTemplate,
  importEventsFromCsv,
  fetchMyApplications,
  fetchMyEvents,
  finishEvent,
  getDirectionLabel,
  isTeacherProfile,
  publishEvent,
  registerForEvent,
  updateEvent,
} from '../../../api/backendApi';
import {
  getStoredAuthUser,
  saveAuthSession,
} from '../../../api/session';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const pickEventId = (values = []) => {
  const normalizedValues = values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  if (normalizedValues.length === 0) return '';
  return normalizedValues.find((value) => UUID_PATTERN.test(value)) || normalizedValues[0];
};

const getEventRegistrationId = (event = {}) =>
  pickEventId([
    event.publicId,
    event.eventPublicId,
    event.EventPublicId,
    event.eventPublicID,
    event.EventPublicID,
    event.id,
    event.Id,
  ]);

const getEventIdCandidates = (event = {}, preferredId = '') => {
  const ids = [
    preferredId,
    event.publicId,
    event.eventPublicId,
    event.EventPublicId,
    event.eventPublicID,
    event.EventPublicID,
    event.id,
    event.Id,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
  const unique = Array.from(new Set(ids));
  const uuids = unique.filter((value) => UUID_PATTERN.test(value));
  const fallbackIds = unique.filter((value) => !UUID_PATTERN.test(value));
  return [...uuids, ...fallbackIds];
};

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

const hasAdminAccess = (user = {}) =>
  ['admin', 'moderator'].includes(String(user?.accessLevel ?? '').trim().toLowerCase())
  || ['admin', 'moderator'].includes(String(user?.role ?? '').trim().toLowerCase());

const EVENTS_PAGE_SIZE = 20;
const MAX_EVENTS_PAGES = 2;
const INITIAL_EVENT_FORM = {
  title: '',
  date: '',
  location: '',
  maxPoints: '',
  description: '',
  direction: '',
  course: '',
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

const formatDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatEventDate = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function useMainPageData({ onScrollToTop } = {}) {
  const didLoadRef = useRef(false);

  const [events, setEvents] = useState([]);
  const [userApplications, setUserApplicationsState] = useState([]);
  const [userPoints, setUserPointsState] = useState(0);
  const [toast, setToast] = useState(null);
  const [studentPeriodProgress, setStudentPeriodProgress] = useState(DEFAULT_STUDENT_PERIOD_PROGRESS);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsViewMode, setEventsViewMode] = useState('grid');
  const [currentEventsPage, setCurrentEventsPage] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const [adminCreateFormOpen, setAdminCreateFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEventData, setNewEventData] = useState(INITIAL_EVENT_FORM);

  const isTeacher = currentUser ? isTeacherProfile(currentUser) : false;
  const isAdmin = hasAdminAccess(currentUser);
  const isTeacherOrAdmin = isTeacher || isAdmin;

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

  const loadPagedCollection = useCallback(async (loader) => {
    const items = [];
    const seenItemKeys = new Set();

    for (let page = 0; page < MAX_EVENTS_PAGES; page += 1) {
      const pageItems = await loader(page);
      if (!Array.isArray(pageItems) || pageItems.length === 0) break;

      const uniquePageItems = pageItems.filter((item, index) => {
        const rawKey = item?.publicId ?? item?.id ?? item?.eventPublicId;
        const fallbackKey = `${item?.title ?? ''}|${item?.eventDateTime ?? item?.date ?? ''}|${index}`;
        const key = String(rawKey || fallbackKey);

        if (seenItemKeys.has(key)) {
          return false;
        }

        seenItemKeys.add(key);
        return true;
      });

      if (uniquePageItems.length === 0) break;

      items.push(...uniquePageItems);
      if (pageItems.length < EVENTS_PAGE_SIZE) break;
    }

    return items;
  }, []);

  const loadAllEvents = useCallback(async (user) => {

    try {
      const canViewAllStatuses = isTeacherProfile(user);
      const visibleEventsRequest = canViewAllStatuses
        ? loadPagedCollection((page) =>
          fetchEvents({ statuses: EVENT_MANAGEMENT_STATUSES }, { page, size: EVENTS_PAGE_SIZE }))
          .then((result) => (result.length > 0
            ? result
            : loadPagedCollection((page) => fetchEvents({}, { page, size: EVENTS_PAGE_SIZE }))))
        : loadPagedCollection((page) => fetchEvents({}, { page, size: EVENTS_PAGE_SIZE }));
      const requests = [visibleEventsRequest];

      if (isTeacherProfile(user)) {
        requests.push(loadPagedCollection((page) => fetchMyEvents({}, { page, size: EVENTS_PAGE_SIZE })));
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
      setCurrentEventsPage(0);
      return eventsList;
    } catch (error) {
      console.error('Error loading events:', error);
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
      return [];
    }
  }, [loadPagedCollection, mergeEventsById, showToast]);

  const loadUserData = useCallback(async (user) => {

    if (!isTeacherProfile(user)) {
      const fallbackTotalPoints = Number(user.points ?? getStoredAuthUser()?.points ?? 0) || 0;
      const [applicationsResult, activePeriodSummaryResult, totalSummaryResult, goalsResult] = await Promise.allSettled([
        fetchMyApplications(),
        fetchCurrentUserActivePeriodSummary(),
        fetchCurrentUserSummary(),
        fetchCurrentUserGoals(),
      ]);
      const resolvedTotalPoints = totalSummaryResult.status === 'fulfilled'
        ? (Number(totalSummaryResult.value.totalPoints ?? fallbackTotalPoints) || 0)
        : fallbackTotalPoints;

      if (applicationsResult.status === 'fulfilled') {
        setUserApplicationsState(applicationsResult.value);
      } else {
        console.warn('Failed to load user applications:', applicationsResult.reason);
        setUserApplicationsState([]);
      }

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
    } else {
      setUserApplicationsState([]);
      setUserPointsState(0);
      setStudentPeriodProgress(DEFAULT_STUDENT_PERIOD_PROGRESS);
    }
  }, []);

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
    saveAuthSession({ user });
    Promise.all([
      loadAllEvents(user),
      loadUserData(user),
    ]).catch((error) => {
      console.warn('Initial main page data load failed:', error);
    });
  }, [loadAllEvents, loadUserData]);

  const canManageEvent = useCallback((event = {}) => {
    if (!isTeacherOrAdmin) return false;
    if (isAdmin) return true;
    if (event.isOwnEvent) return true;

    const ownerId = String(getEventOwnerId(event) ?? '').trim();
    if (!ownerId) return false;

    return getUserOwnerIds(currentUser).includes(ownerId);
  }, [currentUser, isAdmin, isTeacherOrAdmin]);

  const handleOpenCreateForm = useCallback(() => {
    if (!isTeacherOrAdmin) {
      showToast('РўРѕР»СЊРєРѕ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЊ РјРѕР¶РµС‚ СЃРѕР·РґР°РІР°С‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
      return;
    }
    setAdminCreateFormOpen(true);
  }, [isTeacherOrAdmin, showToast]);

  const handleCloseCreateForm = useCallback(() => {
    setAdminCreateFormOpen(false);
    setEditingEvent(null);
    setNewEventData(INITIAL_EVENT_FORM);
  }, []);

  const handleOpenEditForm = useCallback((event) => {
    if (!isTeacherOrAdmin) return;
    if (!canManageEvent(event)) {
      showToast('РњРѕР¶РЅРѕ СЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
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
  }, [canManageEvent, isTeacherOrAdmin, showToast]);

  const handleAdminFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewEventData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCreateEvent = useCallback(async (submitData) => {
    if (!isTeacherOrAdmin) {
      showToast('РўРѕР»СЊРєРѕ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЊ РјРѕР¶РµС‚ СЃРѕР·РґР°РІР°С‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
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
        const publicId = editingEvent.publicId;
        if (!publicId) {
          showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ ID РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ', 'error');
          return;
        }

        if (!canManageEvent(editingEvent)) {
          showToast('РњРѕР¶РЅРѕ СЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
          return;
        }

        const updatedEvent = await updateEvent(publicId, payload);
        setEvents((prev) => prev.map((event) => {
          const sameEvent = (event.publicId || event.id) === publicId;
          return sameEvent ? { ...event, ...updatedEvent, ...payload, publicId, isOwnEvent: true } : event;
        }));
        showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РѕР±РЅРѕРІР»РµРЅРѕ', 'success');
      } else {
        const createdEvent = await createEvent(payload);
        const publicId = createdEvent.publicId;
        const { publicationError, ...eventData } = createdEvent;
        const nextEvent = { ...eventData, ...payload, publicId, isOwnEvent: true };

        if (!publicId) {
          setEvents((prev) => [nextEvent, ...prev]);
          showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ СЃРѕР·РґР°РЅРѕ, РЅРѕ Р±СЌРє РЅРµ РїСЂРёСЃР»Р°Р» publicId', 'error');
        } else if (publicationError) {
          setEvents((prev) => [nextEvent, ...prev]);
          showToast(`Р’С‹ СѓР¶Рµ Р·Р°РїРёСЃР°РЅС‹ РЅР° "${event.title}"`, 'info');
        } else {
          setEvents((prev) => [nextEvent, ...prev]);
          showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ СЃРѕР·РґР°РЅРѕ РєР°Рє С‡РµСЂРЅРѕРІРёРє', 'success');
        }
      }

      handleCloseCreateForm();
    } catch (error) {
      console.error('Create event error:', error);
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [canManageEvent, editingEvent, handleCloseCreateForm, isTeacherOrAdmin, showToast]);

  const handlePublishEvent = useCallback(async (event) => {
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ РґР»СЏ РїСѓР±Р»РёРєР°С†РёРё', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('РњРѕР¶РЅРѕ РїСѓР±Р»РёРєРѕРІР°С‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
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
      showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РѕРїСѓР±Р»РёРєРѕРІР°РЅРѕ РґР»СЏ СЃС‚СѓРґРµРЅС‚РѕРІ', 'success');
    } catch (error) {
      showToast(
        error.status === 403
          ? 'РџСѓР±Р»РёРєР°С†РёСЏ Р·Р°РїСЂРµС‰РµРЅР° РґР»СЏ С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ'
          : (error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ'),
        'error',
      );
    }
  }, [canManageEvent, showToast]);

  const handleFinishEvent = useCallback(async (event) => {
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ РґР»СЏ Р·Р°РІРµСЂС€РµРЅРёСЏ', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('РњРѕР¶РЅРѕ Р·Р°РІРµСЂС€Р°С‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
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
      showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ Р·Р°РІРµСЂС€РµРЅРѕ', 'success');
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РІРµСЂС€РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [canManageEvent, showToast]);

  const handleCancelEvent = useCallback(async (event) => {
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ РґР»СЏ РѕС‚РјРµРЅС‹', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('РњРѕР¶РЅРѕ РѕС‚РјРµРЅСЏС‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
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
      showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РѕС‚РјРµРЅРµРЅРѕ', 'success');
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [canManageEvent, showToast]);

  const handleDeleteEvent = useCallback(async (event) => {
    const publicId = event.publicId || event.id;

    if (!publicId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ', 'error');
      return;
    }

    if (!canManageEvent(event)) {
      showToast('РњРѕР¶РЅРѕ СѓРґР°Р»СЏС‚СЊ С‚РѕР»СЊРєРѕ СЃРІРѕРё РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'error');
      return;
    }

    const status = String(event.status || '').toUpperCase();
    if (!['FINISHED', 'CANCELLED'].includes(status)) {
      showToast(`Р’С‹ СѓР¶Рµ Р·Р°РїРёСЃР°РЅС‹ РЅР° "${event.title}"`, 'info');
      return;
    }

    try {
      await deleteEvent(publicId);
      setEvents((prev) => prev.filter((item) => {
        const itemId = item.publicId || item.id;
        return String(itemId) !== String(publicId);
      }));
      showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ СѓРґР°Р»РµРЅРѕ', 'success');
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [canManageEvent, showToast]);

  const handleDownloadEventsTemplate = useCallback(async () => {

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
      showToast('Template downloaded', 'success');
    } catch (error) {
      console.error('Template download error:', error);
      showToast(error.message || 'Failed to download template', 'error');
    }
  }, [showToast]);

  const handleImportEventsCsv = useCallback(async (file) => {
    if (!(file instanceof File)) {
      showToast('Р’С‹Р±РµСЂРёС‚Рµ CSV-С„Р°Р№Р» РґР»СЏ РёРјРїРѕСЂС‚Р°', 'error');
      return false;
    }

    const isCsvType = String(file.type || '').toLowerCase().includes('csv');
    const isCsvName = String(file.name || '').toLowerCase().endsWith('.csv');
    if (!isCsvType && !isCsvName) {
      showToast('РџРѕРґРґРµСЂР¶РёРІР°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ С„Р°Р№Р»С‹ РІ С„РѕСЂРјР°С‚Рµ CSV', 'error');
      return false;
    }

    try {
      await importEventsFromCsv(file);
      if (currentUser) {
        await loadAllEvents(currentUser);
      }
      showToast('РРјРїРѕСЂС‚ РјРµСЂРѕРїСЂРёСЏС‚РёР№ Р·Р°РІРµСЂС€РµРЅ', 'success');
      return true;
    } catch (error) {
      console.error('Events import error:', error);
      const errorMessage = error?.status === 403
        ? 'РРјРїРѕСЂС‚ Р·Р°РїСЂРµС‰РµРЅ: РЅРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РїСЂР°РІ РёР»Рё Р±СЌРєРµРЅРґ РѕС‚РєР»РѕРЅРёР» Р·Р°РїСЂРѕСЃ'
        : (error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РёРјРїРѕСЂС‚РёСЂРѕРІР°С‚СЊ CSV');
      showToast(errorMessage, 'error');
      return false;
    }
  }, [currentUser, loadAllEvents, showToast]);

  const formattedEvents = useMemo(() => (
    events.map((event, index) => {
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
        displayTitle: event.title || 'Р‘РµР· РЅР°Р·РІР°РЅРёСЏ',
        displayDate: formattedDate || event.date || 'Р”Р°С‚Р° РЅРµ СѓРєР°Р·Р°РЅР°',
        displayLocation: event.location || 'РњРµСЃС‚Рѕ РЅРµ СѓРєР°Р·Р°РЅРѕ',
        displayDirection: getDirectionLabel(event.direction),
        displayTeacher: event.teacherName || event.teacher || 'РџСЂРµРїРѕРґР°РІР°С‚РµР»СЊ',
        displayPoints: event.maxPoints || event.points || 0,
        canManage: canManageEvent(event),
      };
    })
  ), [canManageEvent, events, userApplications]);

  const filteredEvents = useMemo(() => {
    let filtered = formattedEvents;

    if (searchTerm) {
      filtered = filtered.filter((event) =>
        event.displayTitle.toLowerCase().includes(searchTerm.toLowerCase())
        || event.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedDirection !== 'all') {
      filtered = filtered.filter((event) => event.direction === selectedDirection);
    }

    if (selectedCourse !== 'all') {
      filtered = filtered.filter((event) => Number(event.course) === Number(selectedCourse));
    }

    return filtered;
  }, [formattedEvents, searchTerm, selectedDirection, selectedCourse]);

  const totalEventsPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PAGE_SIZE));

  useEffect(() => {
    setCurrentEventsPage(0);
  }, [searchTerm, selectedDirection, selectedCourse, selectedDate]);

  useEffect(() => {
    setCurrentEventsPage((prev) => Math.min(prev, totalEventsPages - 1));
  }, [totalEventsPages]);

  const visibleEvents = useMemo(() => {
    const from = currentEventsPage * EVENTS_PAGE_SIZE;
    const to = from + EVENTS_PAGE_SIZE;
    return filteredEvents.slice(from, to);
  }, [currentEventsPage, filteredEvents]);

  const directions = useMemo(() => {
    const dirs = formattedEvents.map((event) => event.direction).filter(Boolean);
    return ['all', ...new Set(dirs)];
  }, [formattedEvents]);

  const courses = useMemo(() => {
    const courseNums = formattedEvents
      .map((event) => Number(event.course))
      .filter((course) => !isNaN(course) && course > 0);
    return ['all', ...new Set(courseNums.sort((a, b) => a - b))];
  }, [formattedEvents]);

  const handleRegisterForEvent = useCallback(async (eventId) => {
    const normalizedEventId = eventId ? String(eventId).trim() : '';
    const event = formattedEvents.find((item) => idsEqual(item.id, normalizedEventId));

    if (isTeacherOrAdmin) {
      showToast('РўРѕР»СЊРєРѕ СЃС‚СѓРґРµРЅС‚С‹ РјРѕРіСѓС‚ Р·Р°РїРёСЃС‹РІР°С‚СЊСЃСЏ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'info');
      return;
    }

    if (!normalizedEventId || !event) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ ID РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РґР»СЏ Р·Р°РїРёСЃРё', 'error');
      return;
    }

    try {
      const candidateIds = getEventIdCandidates(event, normalizedEventId);
      let enrolledEvent = null;
      let resolvedEventId = normalizedEventId;
      let lastError = null;

      for (const candidateId of candidateIds) {
        try {
          enrolledEvent = await registerForEvent(candidateId);
          resolvedEventId = candidateId;
          break;
        } catch (error) {
          lastError = error;
          const isRetriable = error?.status === 400 || error?.status === 404;
          if (!isRetriable) throw error;
        }
      }

      if (!enrolledEvent) throw lastError;

      updateEventParticipation(normalizedEventId, true, enrolledEvent);
      if (!idsEqual(resolvedEventId, normalizedEventId)) {
        updateEventParticipation(resolvedEventId, true, enrolledEvent);
      }
      showToast('Р’С‹ СѓСЃРїРµС€РЅРѕ Р·Р°РїРёСЃР°РЅС‹ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'success');
    } catch (error) {
      if (error?.status === 409) {
        updateEventParticipation(normalizedEventId, true);
        showToast(`Р’С‹ СѓР¶Рµ Р·Р°РїРёСЃР°РЅС‹ РЅР° "${event.title}"`, 'info');
        return;
      }

      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РїРёСЃР°С‚СЊСЃСЏ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [formattedEvents, isTeacherOrAdmin, showToast, updateEventParticipation]);

  const handleCancelEnrollForEvent = useCallback(async (eventId) => {
    const normalizedEventId = eventId ? String(eventId).trim() : '';
    const event = formattedEvents.find((item) => idsEqual(item.id, normalizedEventId));

    if (isTeacherOrAdmin) {
      showToast('РўРѕР»СЊРєРѕ СЃС‚СѓРґРµРЅС‚С‹ РјРѕРіСѓС‚ РѕС‚РјРµРЅСЏС‚СЊ Р·Р°РїРёСЃСЊ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёСЏ', 'info');
      return;
    }

    if (!normalizedEventId || !event) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ ID РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РґР»СЏ РѕС‚РјРµРЅС‹ Р·Р°РїРёСЃРё', 'error');
      return;
    }

    try {
      const candidateIds = getEventIdCandidates(event, normalizedEventId);
      let cancelledEvent = null;
      let resolvedEventId = normalizedEventId;
      let lastError = null;

      for (const candidateId of candidateIds) {
        try {
          cancelledEvent = await cancelEnrollInEvent(candidateId);
          resolvedEventId = candidateId;
          break;
        } catch (error) {
          lastError = error;
          const isRetriable = error?.status === 400 || error?.status === 404;
          if (!isRetriable) throw error;
        }
      }

      if (!cancelledEvent) throw lastError;

      updateEventParticipation(normalizedEventId, false, cancelledEvent);
      if (!idsEqual(resolvedEventId, normalizedEventId)) {
        updateEventParticipation(resolvedEventId, false, cancelledEvent);
      }
      showToast('Р—Р°РїРёСЃСЊ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёРµ РѕС‚РјРµРЅРµРЅР°', 'success');
    } catch (error) {
      if (error?.status === 404 || error?.status === 409) {
        updateEventParticipation(normalizedEventId, false);
        showToast(`Р’С‹ РЅРµ Р·Р°РїРёСЃР°РЅС‹ РЅР° "${event.title}"`, 'info');
        return;
      }

      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ Р·Р°РїРёСЃСЊ РЅР° РјРµСЂРѕРїСЂРёСЏС‚РёРµ', 'error');
    }
  }, [formattedEvents, isTeacherOrAdmin, showToast, updateEventParticipation]);

  const handleRegisterWithToast = useCallback(async (eventId, title) => {
    const normalizedEventId = eventId ? String(eventId).trim() : '';
    const event = normalizedEventId
      ? formattedEvents.find((item) => idsEqual(item.id, normalizedEventId))
      : formattedEvents.find((item) => item.title === title);

    if (!event) {
      showToast('РњРµСЂРѕРїСЂРёСЏС‚РёРµ РЅРµ РЅР°Р№РґРµРЅРѕ', 'error');
      return;
    }

    if (isTeacherOrAdmin) {
      showToast(`Р’С‹ СѓР¶Рµ Р·Р°РїРёСЃР°РЅС‹ РЅР° "${event.title}"`, 'info');
      return;
    }

    if (!event.id) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ ID РјРµСЂРѕРїСЂРёСЏС‚РёСЏ РґР»СЏ Р·Р°РїРёСЃРё', 'error');
      return;
    }

    if (event.isRegistered) {
      await handleCancelEnrollForEvent(event.id);
      return;
    }

    await handleRegisterForEvent(event.id);
  }, [formattedEvents, handleCancelEnrollForEvent, handleRegisterForEvent, isTeacherOrAdmin, showToast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedDirection('all');
    setSelectedCourse('all');
    setSelectedDate('');
    setCurrentEventsPage(0);
  }, []);

  const handleEventsPageChange = useCallback((nextPage) => {
    const normalizedPage = Math.max(0, Math.min(totalEventsPages - 1, Number(nextPage) || 0));
    setCurrentEventsPage(normalizedPage);
    onScrollToTop?.();
  }, [onScrollToTop, totalEventsPages]);

  const goal = Number(studentPeriodProgress.targetPoints ?? 0) || 0;
  const periodPoints = Number(studentPeriodProgress.points ?? 0) || 0;
  const hasTargetGoal = goal > 0;
  const progressPeriodName = studentPeriodProgress.periodName || 'РџРµСЂРёРѕРґ РЅРµ РЅР°Р·РЅР°С‡РµРЅ';
  const remainingPoints = Math.max(goal - periodPoints, 0);
  const progressPercent = hasTargetGoal ? Math.min((periodPoints / goal) * 100, 100) : 0;
  const goalReached = studentPeriodProgress.goalReached || (hasTargetGoal && periodPoints >= goal);

  return {
    goal,
    hasTargetGoal,
    progressPeriodName,
    goalReached,
    toast,
    isTeacherOrAdmin,
    userPoints,
    periodPoints,
    userApplications,
    remainingPoints,
    progressPercent,
    sliderEvents: formattedEvents,
    filters: {
      searchTerm,
      setSearchTerm,
      selectedDirection,
      setSelectedDirection,
      selectedCourse,
      setSelectedCourse,
      selectedDate,
      setSelectedDate,
      directions,
      courses,
      clearFilters,
    },
    eventsSection: {
      visibleEvents,
      eventsCount: filteredEvents.length,
      canManageEvent,
      viewMode: eventsViewMode,
      setViewMode: setEventsViewMode,
      currentPage: currentEventsPage,
      totalPages: totalEventsPages,
      pageSize: EVENTS_PAGE_SIZE,
      handlePageChange: handleEventsPageChange,
      handleRegisterWithToast,
      handleOpenEditForm,
      handlePublishEvent,
      handleFinishEvent,
      handleCancelEvent,
      handleDeleteEvent,
      handleDownloadEventsTemplate,
      handleImportEventsCsv,
    },
    adminModal: {
      isTeacher: isTeacherOrAdmin,
      adminCreateFormOpen,
      newEventData,
      mode: editingEvent ? 'edit' : 'create',
      onOpen: handleOpenCreateForm,
      onClose: handleCloseCreateForm,
      onChange: handleAdminFormChange,
      onSubmit: handleCreateEvent,
    },
  };
}



