import { apiFetch } from '../apiClient';
import { ENDPOINTS, getPagedContent } from './shared';

const normalizeGoal = (raw = {}) => ({
  publicId: String(raw.publicId ?? raw.PublicId ?? raw.publicID ?? raw.PublicID ?? '').trim(),
  periodName: String(raw.periodName ?? raw.PeriodName ?? '').trim(),
  periodStatus: String(raw.periodStatus ?? raw.PeriodStatus ?? '').trim().toUpperCase(),
  courseNumber: Number(raw.courseNumber ?? raw.CourseNumber ?? raw.course ?? 0) || 0,
  targetPoints: Number(raw.targetPoints ?? raw.TargetPoints ?? raw.points ?? 0) || 0,
});

export async function createGoal(payload = {}) {
  const periodName = String(payload.periodName ?? '').trim();
  const course = Number(payload.course);
  const targetPoints = Number(payload.targetPoints);

  if (!periodName) {
    throw new Error('Укажите период для цели');
  }
  if (!Number.isInteger(course) || course <= 0) {
    throw new Error('Укажите корректный номер курса');
  }
  if (!Number.isFinite(targetPoints) || targetPoints <= 0) {
    throw new Error('Укажите корректное количество баллов');
  }

  const data = await apiFetch(ENDPOINTS.goals, {
    method: 'POST',
    body: {
      periodName,
      course,
      targetPoints,
    },
  });

  const payloadData = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  return normalizeGoal(payloadData);
}

export async function fetchGoals() {
  const data = await apiFetch(ENDPOINTS.goals, {
    method: 'GET',
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const goals = getPagedContent(payload).map((goal) => normalizeGoal(goal));

  return {
    goals,
  };
}

export async function fetchGoalsByFilters(filters = {}) {
  const periodName = String(filters.periodName ?? '').trim();
  const courseNumberRaw = Number(filters.courseNumber);
  const status = String(filters.status ?? '').trim().toUpperCase();
  const page = Number.isFinite(Number(filters.page)) ? Number(filters.page) : 0;
  const size = Number.isFinite(Number(filters.size)) ? Number(filters.size) : 20;

  const data = await apiFetch(ENDPOINTS.goals, {
    method: 'GET',
    params: {
      periodName: periodName || undefined,
      courseNumber: Number.isFinite(courseNumberRaw) && courseNumberRaw > 0 ? courseNumberRaw : undefined,
      status: status || undefined,
      page,
      size,
    },
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const goals = getPagedContent(payload).map((goal) => normalizeGoal(goal));
  const pageMeta = payload?.page ?? payload?.Page ?? {};

  return {
    goals,
    page: {
      number: Number(pageMeta.number ?? pageMeta.pageNumber ?? page) || page,
      size: Number(pageMeta.size ?? pageMeta.pageSize ?? size) || size,
      totalElements: Number(pageMeta.totalElements ?? pageMeta.total ?? goals.length) || goals.length,
      totalPages: Number(pageMeta.totalPages ?? 0) || 0,
    },
  };
}

const pickGoalByPriority = (goals = [], periodName = '', courseNumber = 0) => {
  const normalizedPeriodName = String(periodName ?? '').trim();
  const normalizedCourseNumber = Number(courseNumber) || 0;

  if (!Array.isArray(goals) || goals.length === 0) return null;

  const exactMatch = goals.find((goal) =>
    String(goal.periodName ?? '').trim() === normalizedPeriodName
    && Number(goal.courseNumber ?? 0) === normalizedCourseNumber
    && Number(goal.targetPoints ?? 0) > 0,
  );
  if (exactMatch) return exactMatch;

  const withPositiveTarget = goals.find((goal) => Number(goal.targetPoints ?? 0) > 0);
  if (withPositiveTarget) return withPositiveTarget;

  return goals[0] ?? null;
};

export async function fetchStudentGoalByPeriodAndCourse(options = {}) {
  const periodName = String(options.periodName ?? '').trim();
  const courseNumber = Number(options.courseNumber) || 0;
  if (courseNumber <= 0) return null;

  const strictResult = await fetchGoalsByFilters({
    periodName: periodName || undefined,
    courseNumber,
    status: 'ACTIVE',
    page: 0,
    size: 20,
  });

  const strictGoal = pickGoalByPriority(strictResult.goals, periodName, courseNumber);
  if (strictGoal) return strictGoal;

  if (courseNumber <= 0) return null;

  const activeByCourseResult = await fetchGoalsByFilters({
    courseNumber,
    status: 'ACTIVE',
    page: 0,
    size: 20,
  });

  return pickGoalByPriority(activeByCourseResult.goals, periodName, courseNumber);
}

export async function fetchGoalByPublicId(publicId) {
  const normalizedPublicId = String(publicId ?? '').trim();
  if (!normalizedPublicId) {
    throw new Error('Не удалось определить publicId цели');
  }

  const data = await apiFetch(ENDPOINTS.goalByPublicId(normalizedPublicId), {
    method: 'GET',
  });

  const payloadData = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  return normalizeGoal(payloadData);
}

