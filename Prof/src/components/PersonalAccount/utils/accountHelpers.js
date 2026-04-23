export const EMPTY_EVENT_FORM = {
  title: '',
  date: '',
  location: '',
  maxPoints: '',
  description: '',
  direction: '',
  course: '',
};

export const DEFAULT_PROFILE_DATA = {
  fullName: '',
  firstName: '',
  lastName: '',
  specialization: 'Студент',
  course: 1,
  direction: '',
  id: '',
  email: '',
  phone: '',
};

export const DIRECTION_NAMES = {
  FRONTEND: 'Frontend-разработка',
  BACKEND: 'Backend-разработка',
  SYSTEM_ADMIN: 'Системное администрирование',
  DESIGNER: 'Дизайн',
  ENGLISH: 'Английский язык',
  PROJECT_MANAGER: 'Project Manager',
  INDEFINITE: 'Не определено',
};

export const getDirectionName = (direction) =>
  DIRECTION_NAMES[direction] || direction || 'Не указано';

export const getEventOwnerId = (event = {}) =>
  event.createdById ?? event.createdByTeacherId ?? event.teacherId ?? event.createdBy?.id ?? event.teacher?.id ?? '';

export const getUserOwnerIds = (user = {}) => [
  user.id,
  user.ldapId,
  user.userId,
].map((value) => String(value ?? '').trim()).filter(Boolean);

export const isHttpUrl = (value) => /^https?:\/\/.+/i.test(String(value || ''));

export const findNestedValueByKeys = (value, keys, depth = 0, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object' || depth > 5 || seen.has(value)) return '';
  seen.add(value);

  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  for (const [key, childValue] of Object.entries(value)) {
    if (keySet.has(key.toLowerCase()) && childValue) {
      return childValue;
    }

    const nestedValue = findNestedValueByKeys(childValue, keys, depth + 1, seen);
    if (nestedValue) return nestedValue;
  }

  return '';
};

const REPORT_PUBLIC_ID_KEYS = ['publicId', 'publicID', 'public_id'];
const EVENT_PUBLIC_ID_KEYS = ['eventPublicId', 'eventPublicID', 'event_public_id'];

export const getReportReviewKey = (submission = {}) =>
  String(
    submission.publicId
      || submission.PublicId
      || submission.publicID
      || submission.PublicID
      || findNestedValueByKeys(submission, REPORT_PUBLIC_ID_KEYS)
      || [
        submission.eventPublicId || 'event',
        submission.status || 'status',
        submission.studentId || submission.studentName || 'student',
        submission.reportLink || 'report',
      ].join('-'),
  );

export const getReportCardKey = (submission = {}, index = 0) =>
  `${getReportReviewKey(submission)}-${index}`;

export const getSubmissionPublicId = (submission = {}) =>
  String(
    submission.publicId
      || submission.PublicId
      || submission.publicID
      || submission.PublicID
      || findNestedValueByKeys(submission, REPORT_PUBLIC_ID_KEYS)
      || '',
  ).trim();

export const getSubmissionEventId = (submission = {}) =>
  String(
    submission.eventPublicId
      || submission.EventPublicId
      || submission.eventPublicID
      || submission.EventPublicID
      || findNestedValueByKeys(submission, EVENT_PUBLIC_ID_KEYS)
      || '',
  ).trim();

export const getSubmissionStatusText = (submission = {}) => {
  if (submission.status === 'draft') return 'Черновик';
  if (submission.status === 'submitted') return 'На проверке';
  if (submission.status === 'accepted') return 'Принят';
  if (submission.status === 'refused') return 'Отклонен';
  return 'Отчет';
};

export const formatDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
