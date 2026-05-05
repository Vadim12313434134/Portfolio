import { apiFetch } from '../apiClient';
import {
  ENDPOINTS,
  getPagedContent,
  normalizeAccessLevelValue,
  normalizeRoleValue,
  normalizeUser,
} from './shared';

const getFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeUserSummary = (raw = {}) => ({
  ldapId: raw.ldapId ?? raw.ldap_id ?? raw.id ?? '',
  totalPoints: Number(
    getFirstDefined(
      raw.totalPoints,
      raw.TotalPoints,
      raw.total_points,
      raw.points,
      raw.Points,
    ) ?? 0,
  ) || 0,
  approvedReportsCount: Number(
    getFirstDefined(
      raw.approvedReportsCount,
      raw.ApprovedReportsCount,
      raw.approved_reports_count,
      raw.approvedReports,
      raw.ApprovedReports,
    ) ?? 0,
  ) || 0,
});

const normalizeCurrentUserGoals = (raw = {}) => ({
  name: String(
    getFirstDefined(
      raw.name,
      raw.Name,
      raw.periodName,
      raw.PeriodName,
      raw.period_name,
    ) ?? '',
  ).trim(),
  startDate: String(
    getFirstDefined(
      raw.startDate,
      raw.StartDate,
      raw.start_date,
    ) ?? '',
  ).trim(),
  endDate: String(
    getFirstDefined(
      raw.endDate,
      raw.EndDate,
      raw.end_date,
    ) ?? '',
  ).trim(),
  targetPoints: Number(
    getFirstDefined(
      raw.targetPoints,
      raw.TargetPoints,
      raw.target_points,
      raw.goalPoints,
      raw.goal_points,
    ) ?? 0,
  ) || 0,
});

const normalizePageMeta = (raw = {}, fallbackSize = 20) => {
  const size = Number(raw?.size ?? raw?.pageSize ?? fallbackSize) || fallbackSize;
  const totalElements = Number(raw?.totalElements ?? raw?.total ?? 0) || 0;
  const rawTotalPages = Number(raw?.totalPages ?? 0) || 0;

  return {
    number: Number(raw?.number ?? raw?.pageNumber ?? 0) || 0,
    size,
    totalElements,
    totalPages: rawTotalPages || (totalElements > 0 ? Math.ceil(totalElements / size) : 0),
  };
};

const normalizeUsersPageMeta = (raw = {}) => {
  return normalizePageMeta(raw, 20);
};

const normalizePeriodSummary = (raw = {}) => ({
  periodName: String(
    getFirstDefined(
      raw.periodName,
      raw.PeriodName,
      raw.period_name,
      typeof raw.period === 'string' ? raw.period : undefined,
      raw.name,
      raw.period?.name,
      raw.period?.periodName,
      raw.Period?.Name,
      raw.goal?.periodName,
      raw.goal?.period_name,
      raw.goal?.period?.name,
    ) ?? '',
  ).trim(),
  courseNumber: Number(
    getFirstDefined(
      raw.courseNumber,
      raw.course,
      raw.CourseNumber,
      raw.Course,
      raw.course_number,
      raw.goal?.courseNumber,
      raw.goal?.course,
      raw.goal?.course_number,
      raw.goal?.courseNumberValue,
      raw.goal?.CourseNumber,
    ) ?? 0,
  ) || 0,
  points: Number(
    getFirstDefined(
      raw.points,
      raw.totalPoints,
      raw.Points,
      raw.TotalPoints,
      raw.total_points,
      raw.currentPoints,
      raw.CurrentPoints,
      raw.current_points,
    ) ?? 0,
  ) || 0,
  approvedReportsCount: Number(
    getFirstDefined(
      raw.approvedReportsCount,
      raw.approvedReports,
      raw.ApprovedReportsCount,
      raw.ApprovedReports,
      raw.approved_reports_count,
    ) ?? 0,
  ) || 0,
  targetPoints: Number(
    getFirstDefined(
      raw.targetPoints,
      raw.TargetPoints,
      raw.target_points,
      raw.goalPoints,
      raw.goal_points,
      raw.goalTargetPoints,
      raw.goal_target_points,
      raw.targetPoint,
      raw.goal?.targetPoints,
      raw.goal?.TargetPoints,
      raw.goal?.target_points,
      raw.goal?.goalPoints,
      raw.goal?.goal_points,
      raw.goal?.targetPoint,
      raw.goalInfo?.targetPoints,
      raw.goalInfo?.target_points,
    ) ?? 0,
  ) || 0,
  goalPublicId: String(
    getFirstDefined(
      raw.goalPublicId,
      raw.GoalPublicId,
      raw.goal_public_id,
      raw.goalId,
      raw.GoalId,
      raw.goal_id,
      raw.publicId,
      raw.PublicId,
      raw.publicID,
      raw.PublicID,
      raw.goal?.publicId,
      raw.goal?.PublicId,
      raw.goal?.publicID,
      raw.goal?.PublicID,
    ) ?? '',
  ).trim(),
  goalReached: Boolean(raw.goalReached ?? raw.GoalReached ?? raw.goal_reached ?? false),
});

const pickFirstPeriodSummary = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate) && candidate.length > 0) return candidate[0];
    if (Array.isArray(candidate?.content) && candidate.content.length > 0) return candidate.content[0];
    if (Array.isArray(candidate?.items) && candidate.items.length > 0) return candidate.items[0];
    if (typeof candidate === 'object' && !Array.isArray(candidate)) return candidate;
  }
  return {};
};

const normalizePeriodsSummaryPageMeta = (raw = {}) => normalizePageMeta(raw, 20);

export async function loginUser({ login, password }) {
  const data = await apiFetch(ENDPOINTS.login, {
    method: 'POST',
    body: {
      username: login,
      password,
    },
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};

  const rawRole = getFirstDefined(
    payload?.role,
    payload?.Role,
    payload?.userRole,
    payload?.user_role,
    payloadUser?.role,
    payloadUser?.Role,
  );

  const rawAccessLevel = getFirstDefined(
    payload?.accessLevel,
    payload?.AccessLevel,
    payload?.access_level,
    payload?.ACCESS_LEVEL,
    payload?.accesslevel,
    payload?.Accesslevel,
    payloadUser?.accessLevel,
    payloadUser?.AccessLevel,
    payloadUser?.access_level,
    payloadUser?.ACCESS_LEVEL,
    payloadUser?.accesslevel,
    payloadUser?.Accesslevel,
  );

  const normalizedAccessLevel = normalizeAccessLevelValue(rawAccessLevel);
  const normalizedRole = normalizeRoleValue(rawRole);
  const effectiveRole = normalizedAccessLevel === 'admin'
    ? 'admin'
    : (normalizedRole || rawRole || '');

  const rawUser = payloadUser && Object.keys(payloadUser).length > 0 ? payloadUser : payload;
  const points = Number(rawUser?.points ?? rawUser?.totalPoints ?? 0) || 0;

  return {
    isProfileExists: getFirstDefined(payload?.isProfileExists, payload?.IsProfileExists),
    role: effectiveRole,
    accessLevel: normalizedAccessLevel || rawAccessLevel || '',
    points,
  };
}

export async function createUserProfile({ direction, course }) {
  const data = await apiFetch(ENDPOINTS.users, {
    method: 'POST',
    body: {
      direction,
      course: Number(course),
    },
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};
  return normalizeUser({
    ...payload,
    ...(payloadUser && typeof payloadUser === 'object' ? payloadUser : {}),
  });
}

export async function fetchCurrentUser() {
  const data = await apiFetch(ENDPOINTS.usersMe, {
    method: 'GET',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};
  return normalizeUser({
    ...payload,
    ...(payloadUser && typeof payloadUser === 'object' ? payloadUser : {}),
  });
}

export async function fetchCurrentUserSummary() {
  const data = await apiFetch(ENDPOINTS.usersSummary, {
    method: 'GET',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data ?? {};
  const summaryCandidate = payload?.summary
    ?? payload?.Summary
    ?? payload?.userSummary
    ?? payload?.UserSummary
    ?? payload;
  return normalizeUserSummary(summaryCandidate);
}

export async function fetchCurrentUserGoals() {
  const data = await apiFetch(ENDPOINTS.usersMeGoals, {
    method: 'GET',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data ?? {};
  const goalCandidate = payload?.goal
    ?? payload?.Goal
    ?? payload?.period
    ?? payload?.Period
    ?? payload;
  return normalizeCurrentUserGoals(goalCandidate);
}

export async function fetchCurrentUserActivePeriodSummary() {
  const data = await apiFetch(ENDPOINTS.usersMeSummaryActivePeriod, {
    method: 'GET',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data ?? {};
  const summaryCandidate = pickFirstPeriodSummary(
    payload?.summary,
    payload?.Summary,
    payload?.activePeriod,
    payload?.ActivePeriod,
    payload?.active_period,
    payload?.periodSummary,
    payload?.PeriodSummary,
    payload?.period,
    payload?.Period,
    payload?.content,
    payload?.items,
    payload,
  );
  return normalizePeriodSummary(summaryCandidate);
}

export async function fetchCurrentUserPeriodsSummary(options = {}) {
  const page = Number(options.page ?? 0) || 0;
  const size = Number(options.size ?? 20) || 20;
  const sortBy = String(options.sortBy ?? 'updatedAt').trim() || 'updatedAt';
  const sortDirection = String(options.sortDirection ?? 'desc').trim() || 'desc';

  const data = await apiFetch(ENDPOINTS.usersMeSummaryPeriods, {
    method: 'GET',
    params: {
      page,
      size,
      sortBy,
      sortDirection,
    },
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const pagedItems = getPagedContent(payload);
  const fallbackSingleSummary = pickFirstPeriodSummary(
    payload?.summary,
    payload?.Summary,
    payload?.activePeriod,
    payload?.ActivePeriod,
    payload?.active_period,
    payload?.periodSummary,
    payload?.PeriodSummary,
    payload?.period,
    payload?.Period,
  );
  const summariesSource = pagedItems.length > 0
    ? pagedItems
    : (fallbackSingleSummary && Object.keys(fallbackSingleSummary).length > 0 ? [fallbackSingleSummary] : []);
  const summaries = summariesSource.map((item) => normalizePeriodSummary(item));
  const pageMeta = normalizePeriodsSummaryPageMeta(
    payload?.page
      ?? payload?.Page
      ?? payload?.pagination
      ?? payload?.Pagination
      ?? {},
  );

  return {
    summaries,
    page: pageMeta,
  };
}

export async function fetchUsers(options = {}) {
  const page = Number(options.page ?? 0) || 0;
  const size = Number(options.size ?? 20) || 20;
  const sortBy = String(options.sortBy ?? 'blocked').trim() || 'blocked';

  const filterPayload = options.filters && typeof options.filters === 'object'
    ? options.filters
    : {};

  const data = await apiFetch(ENDPOINTS.usersSearch, {
    method: 'POST',
    params: {
      page,
      size,
      sortBy,
    },
    body: filterPayload,
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const users = getPagedContent(payload).map((user) => normalizeUser(user));
  const pageMeta = normalizeUsersPageMeta(
    payload?.page
    ?? payload?.Page
    ?? payload?.pagination
    ?? payload?.Pagination
    ?? {},
  );

  return {
    users,
    page: pageMeta,
  };
}

export async function fetchUserByLdapId(ldapId) {
  const data = await apiFetch(ENDPOINTS.userByLdapId(ldapId), {
    method: 'GET',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};
  return normalizeUser({
    ...payload,
    ...(payloadUser && typeof payloadUser === 'object' ? payloadUser : {}),
  });
}

export async function blockUserByLdapId(ldapId) {
  const normalizedLdapId = String(ldapId ?? '').trim();
  if (!normalizedLdapId) {
    throw new Error('Не удалось определить ldapId пользователя');
  }

  const data = await apiFetch(ENDPOINTS.userBlock(normalizedLdapId), {
    method: 'PATCH',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};

  return normalizeUser({
    ...payload,
    ...(payloadUser && typeof payloadUser === 'object' ? payloadUser : {}),
    ldapId: payload?.ldapId ?? payload?.LdapId ?? payloadUser?.ldapId ?? payloadUser?.LdapId ?? normalizedLdapId,
    blocked: payload?.blocked ?? payload?.Blocked ?? payloadUser?.blocked ?? payloadUser?.Blocked ?? true,
  });
}

export async function unblockUserByLdapId(ldapId) {
  const normalizedLdapId = String(ldapId ?? '').trim();
  if (!normalizedLdapId) {
    throw new Error('Не удалось определить ldapId пользователя');
  }

  const data = await apiFetch(ENDPOINTS.userUnblock(normalizedLdapId), {
    method: 'PATCH',
  });
  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const payloadUser = payload?.user ?? payload?.User ?? payload?.profile ?? payload?.Profile ?? {};

  return normalizeUser({
    ...payload,
    ...(payloadUser && typeof payloadUser === 'object' ? payloadUser : {}),
    ldapId: payload?.ldapId ?? payload?.LdapId ?? payloadUser?.ldapId ?? payloadUser?.LdapId ?? normalizedLdapId,
    blocked: payload?.blocked ?? payload?.Blocked ?? payloadUser?.blocked ?? payloadUser?.Blocked ?? false,
  });
}
