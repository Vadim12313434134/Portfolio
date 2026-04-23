
export const ENDPOINTS = {
  login: '/auth/login',
  users: '/users',
  usersMe: '/users/me',
  userByLdapId: (ldapId) => `/users/${ldapId}`,
  events: '/events',
  eventsSearch: '/events/search',
  myEventsSearch: '/events/search/my',
  eventById: (publicId) => `/events/${publicId}`,
  eventPublish: (publicId) => `/events/${publicId}/publish`,
  eventFinish: (publicId) => `/events/${publicId}/finish`,
  eventCancel: (publicId) => `/events/${publicId}/cancel`,
  eventEnroll: (publicId) => `/events/${publicId}/enroll`,
  eventCancelEnroll: (publicId) => `/events/${publicId}/cancel-enroll`,
  participationRecords: (eventPublicId) => `/events/${eventPublicId}/participation-records`,
  participationRecordsForMe: (eventPublicId) => `/events/${eventPublicId}/participation-records/search/my`,
  participationRecordsForMyEvents: (eventPublicId) => `/events/${eventPublicId}/participation-records/search/for-my-events`,
  participationRecord: (eventPublicId, publicId) => `/events/${eventPublicId}/participation-records/${publicId}`,
  participationRecordSubmit: (eventPublicId, publicId) => `/events/${eventPublicId}/participation-records/${publicId}/submit`,
  participationRecordReturnToDraft: (eventPublicId, publicId) => `/events/${eventPublicId}/participation-records/${publicId}/returnToDraft`,
  participationRecordRefuse: (eventPublicId, publicId) => `/events/${eventPublicId}/participation-records/${publicId}/refuse`,
  participationRecordAccept: (eventPublicId, publicId) => `/events/${eventPublicId}/participation-records/${publicId}/accept`,
};

const EVENT_DETAILS_CACHE_KEY = 'eventDetailsCache';

export const DEFAULT_SEARCH_PARAMS = {
  page: 0,
  size: 50,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

export const MY_REPORT_STATUSES = ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REFUSED'];
export const MY_REPORT_STATUS_PRIORITY = ['ACCEPTED', 'REFUSED', 'SUBMITTED', 'DRAFT'];
export const REVIEW_REPORT_STATUSES = ['DRAFT', 'SUBMITTED'];
export const REVIEW_REPORT_STATUS_PRIORITY = ['SUBMITTED', 'DRAFT'];
export const EVENT_MANAGEMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'FINISHED', 'CANCELLED'];

const toLower = (value) => String(value ?? '').trim().toLowerCase();

export const normalizeRoleValue = (role) => {
  const value = toLower(role).replace(/^role[-_]/, '');

  if (value === 'admin') return 'admin';
  if (value === 'teacher' || value === 'prepod' || value === 'prof') return 'teacher';
  if (value === 'user' || value === 'student' || value === 'moderator') return 'student';
  return '';
};

const canUseLocalStorage = () => typeof localStorage !== 'undefined';

export const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const toBooleanOrUndefined = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = toLower(value);
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;

  return Boolean(value);
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => UUID_PATTERN.test(String(value ?? '').trim());

export const pickPublicId = (values = []) => {
  const normalizedValues = values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  return normalizedValues.find(isUuid) || normalizedValues[0] || '';
};

export const normalizeEventStatus = (status, fallback = 'PUBLISHED') => {
  const value = toLower(status);
  if (value === 'draft') return 'DRAFT';
  if (value === 'published') return 'PUBLISHED';
  if (value === 'finished') return 'FINISHED';
  if (value === 'cancelled' || value === 'canceled') return 'CANCELLED';
  return status ?? fallback;
};

export const DIRECTION_LABELS = {
  BACKEND: 'Backend-разработка',
  FRONTEND: 'Frontend-разработка',
  SYSTEM_ADMIN: 'Системное администрирование',
  DESIGNER: 'Дизайн',
  ENGLISH: 'Английский язык',
  PROJECT_MANAGER: 'Project Manager',
  INDEFINITE: 'Не определено',
};

export const getDirectionLabel = (direction) =>
  DIRECTION_LABELS[direction] || direction || 'Не указано';

Object.assign(DIRECTION_LABELS, {
  BACKEND: 'Backend-разработка',
  FRONTEND: 'Frontend-разработка',
  SYSTEM_ADMIN: 'Системное администрирование',
  DESIGNER: 'Дизайн',
  ENGLISH: 'Английский язык',
  PROJECT_MANAGER: 'Project Manager',
  INDEFINITE: 'Не определено',
});

export const getEventPublicId = (raw = {}) =>
  raw.PublicId
    ?? raw.PublicID
    ?? raw.publicId
    ?? raw.publicID
    ?? raw.public_id
    ?? raw.EventPublicId
    ?? raw.EventPublicID
    ?? raw.eventPublicId
    ?? raw.eventPublicID
    ?? raw.Id
    ?? raw.id
    ?? raw.Uuid
    ?? raw.uuid
    ?? '';

export const getEventDateTime = (raw = {}) =>
  raw.EventDateTime
    ?? raw.EventDate
    ?? raw.DateTime
    ?? raw.StartsAt
    ?? raw.StartAt
    ?? raw.StartDateTime
    ?? raw.Event?.EventDateTime
    ?? raw.Event?.Date
    ?? raw.Date
    ?? raw.eventDateTime
    ?? raw.eventDate
    ?? raw.dateTime
    ?? raw.startsAt
    ?? raw.startAt
    ?? raw.startDateTime
    ?? raw.event?.eventDateTime
    ?? raw.event?.date
    ?? raw.date
    ?? '';

export const getEventLocation = (raw = {}) =>
  raw.Location ?? raw.EventLocation ?? raw.Place ?? raw.Venue ?? raw.Address ?? raw.Event?.Location
    ?? raw.location ?? raw.eventLocation ?? raw.place ?? raw.venue ?? raw.address ?? raw.event?.location ?? '';

export const getEventDirection = (raw = {}) =>
  raw.Direction ?? raw.EventDirection ?? raw.Track ?? raw.Specialization ?? raw.Category ?? raw.Event?.Direction
    ?? raw.direction ?? raw.eventDirection ?? raw.track ?? raw.specialization ?? raw.category ?? raw.event?.direction ?? '';

export const getEventCourse = (raw = {}) =>
  toNumberOrNull(raw.Course ?? raw.EventCourse ?? raw.CourseNumber ?? raw.Event?.Course
    ?? raw.course ?? raw.eventCourse ?? raw.courseNumber ?? raw.event?.course);

export const cleanObject = (object = {}) =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const getEventSignature = (event = {}) => [
  event.title,
  event.description,
  event.maxPoints ?? event.points,
].map(toLower).join('|');

const readEventDetailsCache = () => {
  if (!canUseLocalStorage()) return { byPublicId: {}, bySignature: {} };

  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_DETAILS_CACHE_KEY) || '{}');
    return {
      byPublicId: parsed.byPublicId || {},
      bySignature: parsed.bySignature || {},
    };
  } catch {
    return { byPublicId: {}, bySignature: {} };
  }
};

const writeEventDetailsCache = (cache) => {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(EVENT_DETAILS_CACHE_KEY, JSON.stringify(cache));
};

export const buildEventSearchBody = (filters = {}) =>
  cleanObject({
    direction: filters.direction,
    course: toNumberOrNull(filters.course),
    eventDate: filters.eventDate,
    statuses: filters.statuses,
    includeForAllCourses: filters.includeForAllCourses,
    includeForAllCoursesOnly: filters.includeForAllCoursesOnly,
    createdByTeacherId: toNumberOrNull(filters.createdByTeacherId),
  });

export const buildSearchParams = (options = {}) =>
  cleanObject({
    page: options.page ?? DEFAULT_SEARCH_PARAMS.page,
    size: options.size ?? DEFAULT_SEARCH_PARAMS.size,
    sortBy: options.sortBy ?? DEFAULT_SEARCH_PARAMS.sortBy,
    sortDirection: options.sortDirection ?? DEFAULT_SEARCH_PARAMS.sortDirection,
  });

export const getPagedContent = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data?.events)) return data.data.events;
  if (Array.isArray(data?.result?.content)) return data.result.content;
  if (Array.isArray(data?.result?.items)) return data.result.items;
  if (Array.isArray(data?.result?.events)) return data.result.events;
  return [];
};

export const getEventPayload = (data) => {
  const payload = data?.Event ?? data?.event ?? data?.Item ?? data?.item ?? data?.Data ?? data?.data ?? data ?? {};
  if (!payload || typeof payload !== 'object' || !data || typeof data !== 'object') return payload;

  return {
    ...payload,
    alreadyParticipation: payload.alreadyParticipation ?? data.alreadyParticipation,
  };
};

export const getParticipationRecordPayload = (data) => {
  const payload = data?.participationRecord
    ?? data?.participationRecordResponse
    ?? data?.participationRecordDto
    ?? data?.record
    ?? data?.report
    ?? data?.item
    ?? data?.data
    ?? data
    ?? {};
  if (!payload || typeof payload !== 'object') return payload;
  return payload;
};

export const toRuDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeRole = (raw = {}) => {
  const role = normalizeRoleValue(raw.role);
  if (role) return role;
  return raw.course === null || raw.course === undefined ? 'teacher' : 'student';
};

export const isTeacherProfile = (user) => {
  if (!user) return false;
  const role = normalizeRoleValue(user.role);

  if (role === 'admin' || role === 'teacher') return true;
  if (role === 'student') return false;

  return user.course === null || user.course === undefined;
};

export const normalizeUser = (raw = {}) => {
  const firstName = raw.firstName ?? raw.name ?? raw.first_name ?? '';
  const lastName = raw.lastName ?? raw.surname ?? raw.last_name ?? '';
  const ldapId = raw.ldapId ?? raw.ldap_id ?? raw.id ?? raw.userId ?? raw.login ?? raw.username ?? '';
  const course = toNumberOrNull(raw.course);

  return {
    id: raw.id ?? ldapId,
    ldapId,
    login: raw.login ?? raw.username ?? raw.userName ?? '',
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || raw.fullName || '',
    direction: raw.direction ?? raw.specialization ?? '',
    specialization: raw.direction ?? raw.specialization ?? '',
    course,
    role: normalizeRole({ ...raw, course }),
    points: Number(raw.points ?? raw.totalPoints ?? 0) || 0,
  };
};

export const normalizeEvent = (raw = {}) => {
  const maxPoints = Number(raw.MaxPoints ?? raw.maxPoints ?? raw.Points ?? raw.points ?? 0) || 0;
  const publicId = getEventPublicId(raw);
  const teacherFullName = [
    raw.TeacherFirstName ?? raw.teacherFirstName,
    raw.TeacherLastName ?? raw.TeacherSecondName ?? raw.SecondName
      ?? raw.teacherLastName ?? raw.teacherSecondName ?? raw.secondName,
  ].filter(Boolean).join(' ');
  const teacherName = raw.TeacherName || raw.teacherName || teacherFullName || raw.Teacher || raw.teacher || '';
  const eventDateTime = getEventDateTime(raw);
  const course = getEventCourse(raw);

  return {
    id: publicId,
    publicId,
    title: raw.Title ?? raw.TitleOfEvent ?? raw.EventTitle ?? raw.Name
      ?? raw.title ?? raw.titleOfEvent ?? raw.eventTitle ?? raw.name ?? 'Без названия',
    description: raw.Description ?? raw.EventDescription ?? raw.description ?? raw.eventDescription ?? '',
    date: toRuDate(eventDateTime),
    eventDateTime,
    location: getEventLocation(raw),
    points: maxPoints,
    maxPoints,
    direction: getEventDirection(raw),
    course,
    teacher: teacherName || 'Преподаватель не указан',
    teacherName: teacherName || 'Преподаватель не указан',
    status: normalizeEventStatus(raw.Status ?? raw.status),
    alreadyParticipation: toBooleanOrUndefined(
      raw.AlreadyParticipation
        ?? raw.AlreadyParticipating
        ?? raw.IsParticipating
        ?? raw.IsRegistered
        ?? raw.alreadyParticipation
        ?? raw.alreadyParticipating
        ?? raw.isParticipating
        ?? raw.isRegistered
    ),
    createdAt: raw.CreatedAt ?? raw.createdAt,
    updateAt: raw.UpdateAt ?? raw.UpdatedAt ?? raw.updateAt,
    createdById: raw.CreatedById ?? raw.CreatedByTeacherId ?? raw.TeacherId
      ?? raw.createdById ?? raw.createdByTeacherId ?? raw.teacherId,
  };
};

const needsEventDetails = (event = {}) =>
  Boolean(event.publicId) && (
    !event.eventDateTime
    || !event.direction
    || !event.location
    || !event.course
    || event.alreadyParticipation === undefined
  );

const stripUserEventState = (event = {}) => {
  const cacheableEvent = { ...event };
  delete cacheableEvent.alreadyParticipation;
  delete cacheableEvent.isOwnEvent;
  return cacheableEvent;
};

const mergeEventDetails = (event, details) => {
  if (!details) return event;

  const eventDateTime = details.eventDateTime || event.eventDateTime;
  return {
    ...event,
    ...details,
    publicId: details.publicId || event.publicId,
    id: details.publicId || details.id || event.id,
    title: details.title || event.title,
    description: details.description || event.description,
    eventDateTime,
    date: eventDateTime ? toRuDate(eventDateTime) : (details.date || event.date),
    location: details.location || event.location,
    direction: details.direction || event.direction,
    course: details.course ?? event.course,
    maxPoints: details.maxPoints || event.maxPoints,
    points: details.points || event.points,
    teacher: details.teacher || event.teacher,
    teacherName: details.teacherName || event.teacherName,
    status: details.status || event.status,
  };
};

export const cacheEventDetails = (event) => {
  if (!event?.title) return event;

  const normalized = normalizeEvent(event);
  const fullEvent = mergeEventDetails(normalized, event);
  const cache = readEventDetailsCache();
  const signature = getEventSignature(fullEvent);

  if (fullEvent.publicId) {
    cache.byPublicId[fullEvent.publicId] = {
      ...cache.byPublicId[fullEvent.publicId],
      ...stripUserEventState(fullEvent),
    };
  }

  if (signature) {
    cache.bySignature[signature] = {
      ...cache.bySignature[signature],
      ...stripUserEventState(fullEvent),
    };
  }

  writeEventDetailsCache(cache);
  return fullEvent;
};

export const mergeCachedEventDetails = (event) => {
  const cache = readEventDetailsCache();
  const cachedByPublicId = event.publicId ? cache.byPublicId[event.publicId] : null;
  const cachedBySignature = cache.bySignature[getEventSignature(event)];
  const cached = cachedByPublicId || cachedBySignature;

  if (!cached) return event;
  return mergeEventDetails(event, stripUserEventState(cached));
};

export const enrichEventsWithDetails = async (token, events = [], fetchEventDetails) =>
  Promise.all(events.map(async (event) => {
    const cachedEvent = mergeCachedEventDetails(event);
    if (!needsEventDetails(cachedEvent)) return cachedEvent;

    try {
      if (typeof fetchEventDetails !== 'function') return cachedEvent;
      const details = await fetchEventDetails(token, cachedEvent.publicId);
      return cacheEventDetails(mergeEventDetails(cachedEvent, details));
    } catch (error) {
      console.warn('Event details load failed:', error);
      return cachedEvent;
    }
  }));

export const normalizeReportStatus = (status) => {
  const value = toLower(status);
  if (value === 'draft') return 'draft';
  if (value === 'accepted' || value === 'approved') return 'accepted';
  if (value === 'refused' || value === 'rejected' || value === 'declined') return 'refused';
  if (value === 'submitted' || value === 'sent' || value === 'on_review' || value === 'pending') return 'submitted';
  return 'draft';
};

const getParticipationRecordPoints = (raw = {}, fallback = {}) =>
  toNumberOrNull(
    raw.points
      ?? raw.Points
      ?? raw.awardedPoints
      ?? raw.AwardedPoints
      ?? raw.score
      ?? raw.Score
      ?? raw.ParticipationRecord?.Points
      ?? raw.ParticipationRecord?.AwardedPoints
      ?? raw.participationRecord?.points
      ?? raw.participationRecord?.awardedPoints
      ?? raw.Record?.Points
      ?? raw.Record?.AwardedPoints
      ?? raw.record?.points
      ?? raw.record?.awardedPoints
      ?? raw.Report?.Points
      ?? raw.Report?.AwardedPoints
      ?? raw.report?.points
      ?? raw.report?.awardedPoints
      ?? fallback.points
      ?? fallback.awardedPoints,
  ) ?? 0;

export const normalizeReport = (raw = {}, fallback = {}) => ({
  publicId: pickPublicId([raw.publicId, raw.PublicId, raw.publicID, raw.PublicID, fallback.publicId]),
  eventPublicId: pickPublicId([
    raw.eventPublicId,
    raw.EventPublicId,
    raw.eventPublicID,
    raw.EventPublicID,
    fallback.eventPublicId,
  ]),
  eventTitle: raw.eventTitle ?? raw.event?.title ?? 'Мероприятие',
  eventPoints: Number(raw.eventPoints ?? fallback.eventPoints ?? 0) || 0,
  studentName: raw.studentName ?? raw.student?.fullName ?? raw.student?.name ?? 'Студент',
  reportLink: raw.reportLink
    ?? raw.link
    ?? raw.reportText
    ?? raw.text
    ?? raw.participationRecord?.reportLink
    ?? raw.record?.reportLink
    ?? raw.report?.reportLink
    ?? '',
  status: normalizeReportStatus(raw.status ?? raw.participationRecord?.status ?? raw.record?.status ?? raw.report?.status),
  points: getParticipationRecordPoints(raw),
  awardedPoints: getParticipationRecordPoints(raw),
  submittedAt: toRuDate(raw.submittedAt ?? raw.createdAt),
  reviewedAt: toRuDate(raw.reviewedAt ?? raw.updatedAt),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

export const normalizeParticipationRecord = (raw = {}, fallback = {}) => {
  const swaggerRecordId = pickPublicId([raw.publicId, raw.PublicId, raw.publicID, raw.PublicID]);
  const swaggerEventId = pickPublicId([raw.eventPublicId, raw.EventPublicId, raw.eventPublicID, raw.EventPublicID]);
  const swaggerReportLink = raw.reportLink ?? raw.ReportLink;
  const swaggerStatus = raw.status ?? raw.Status;
  const eventPublicId = swaggerEventId || fallback.eventPublicId || '';
  const publicId = swaggerRecordId || fallback.publicId || '';
  const eventPoints = Number(raw.eventPoints ?? raw.maxPoints ?? raw.MaxPoints ?? raw.event?.maxPoints ?? fallback.eventPoints ?? fallback.maxPoints ?? 0) || 0;
  const awardedPoints = getParticipationRecordPoints(raw, fallback);
  const studentName = (
    raw.studentName
    ?? raw.student?.fullName
    ?? raw.student?.name
    ?? [raw.secondName, raw.firstName].filter(Boolean).join(' ')
  ) || fallback.studentName || 'Студент';
  const link = swaggerReportLink
    ?? raw.Link
    ?? raw.link
    ?? raw.ReportLink
    ?? raw.reportLink
    ?? raw.ReportText
    ?? raw.reportText
    ?? raw.Text
    ?? raw.text
    ?? raw.ParticipationRecord?.ReportLink
    ?? raw.ParticipationRecord?.Link
    ?? raw.ParticipationRecord?.ReportText
    ?? raw.participationRecord?.reportLink
    ?? raw.participationRecord?.link
    ?? raw.participationRecord?.reportText
    ?? raw.Record?.ReportLink
    ?? raw.Record?.Link
    ?? raw.Record?.ReportText
    ?? raw.record?.reportLink
    ?? raw.record?.link
    ?? raw.record?.reportText
    ?? raw.Report?.ReportLink
    ?? raw.Report?.Link
    ?? raw.Report?.ReportText
    ?? raw.report?.reportLink
    ?? raw.report?.link
    ?? raw.report?.reportText
    ?? fallback.link
    ?? fallback.reportLink
    ?? '';

  return {
    publicId,
    eventPublicId,
    eventTitle: raw.eventTitle ?? raw.titleOfEvent ?? raw.title ?? raw.event?.title ?? fallback.eventTitle ?? fallback.title ?? 'Мероприятие',
    eventPoints,
    studentId: raw.StudentId ?? raw.studentId ?? raw.UserId ?? raw.userId ?? raw.Student?.Id ?? raw.student?.id ?? raw.student?.ldapId ?? fallback.studentId,
    studentName: raw.StudentName ?? raw.Student?.FullName ?? raw.Student?.Name ?? ([raw.SecondName, raw.FirstName].filter(Boolean).join(' ') || studentName),
    reportLink: link,
    status: normalizeReportStatus(
      swaggerStatus
        ?? raw.ParticipationRecord?.Status
        ?? raw.participationRecord?.status
        ?? raw.Record?.Status
        ?? raw.record?.status
        ?? raw.Report?.Status
        ?? raw.report?.status
        ?? fallback.status,
    ),
    points: awardedPoints,
    awardedPoints,
    submittedAt: toRuDate(raw.SubmittedAt ?? raw.submittedAt ?? raw.CreatedAt ?? raw.createdAt ?? fallback.submittedAt),
    reviewedAt: toRuDate(raw.ReviewedAt ?? raw.reviewedAt ?? raw.UpdatedAt ?? raw.updatedAt ?? fallback.reviewedAt),
    createdAt: raw.CreatedAt ?? raw.createdAt ?? fallback.createdAt,
    updatedAt: raw.UpdatedAt ?? raw.updatedAt ?? fallback.updatedAt,
    teacherName: raw.TeacherName ?? raw.teacherName ?? raw.Teacher?.FullName ?? raw.teacher?.fullName ?? fallback.teacherName,
  };
};


export function getUserDisplayName(user) {
  if (!user) return 'Пользователь';
  const fullName = user.fullName || [user.lastName, user.firstName].filter(Boolean).join(' ').trim();
  return fullName || user.login || `Пользователь #${user.id ?? ''}`;
}

