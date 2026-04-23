import { apiFetch } from '../apiClient';
import { ENDPOINTS, normalizeRoleValue, normalizeUser } from './shared';
export async function loginUser({ login, password }) {
  const data = await apiFetch(ENDPOINTS.login, {
    method: 'POST',
    body: {
      username: login,
      password,
    },
  });
  const rawRole = data.role ?? data.user?.role;
  const rawUser = data.user ?? data.profile ?? data;
  const points = Number(rawUser?.points ?? rawUser?.totalPoints ?? 0) || 0;

  return {
    token: data.token,
    isProfileExists: data.isProfileExists,
    role: normalizeRoleValue(rawRole) || rawRole,
    points,
  };
}

export async function createUserProfile(token, { direction, course }) {
  const data = await apiFetch(ENDPOINTS.users, {
    method: 'POST',
    token,
    body: {
      direction,
      course: Number(course),
    },
  });
  return normalizeUser(data.user ?? data.profile ?? data);
}

export async function fetchCurrentUser(token) {
  const data = await apiFetch(ENDPOINTS.usersMe, {
    method: 'GET',
    token,
  });
  return normalizeUser(data.user ?? data.profile ?? data);
}

export async function fetchUserByLdapId(token, ldapId) {
  const data = await apiFetch(ENDPOINTS.userByLdapId(ldapId), {
    method: 'GET',
    token,
  });
  return normalizeUser(data.user ?? data.profile ?? data);
}


