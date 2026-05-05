const AUTH_USER_KEY = 'authUser';

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const normalizeAccessLevel = (value) => {
  const normalized = normalizeValue(value);
  if (normalized === 'admin') return 'admin';
  if (normalized === 'moderator') return 'admin';
  if (normalized === 'teacher' || normalized === 'prepod' || normalized === 'prof') return 'teacher';
  if (normalized === 'student' || normalized === 'user') return 'student';
  return '';
};

const isAdminByUser = (user = {}) =>
  normalizeAccessLevel(user.accessLevel) === 'admin'
  || normalizeValue(user.role) === 'admin'
  || normalizeValue(user.role) === 'moderator';

const getEffectiveRole = (user = {}) => {
  if (isAdminByUser(user)) return 'admin';

  const normalizedRole = normalizeValue(user.role);
  if (normalizedRole === 'teacher' || normalizedRole === 'prepod' || normalizedRole === 'prof') return 'teacher';
  if (normalizedRole === 'student' || normalizedRole === 'user') return 'student';
  if (normalizedRole === 'moderator') return 'admin';

  const normalizedAccessLevel = normalizeAccessLevel(user.accessLevel);
  if (normalizedAccessLevel) return normalizedAccessLevel;
  return 'student';
};

export const getStoredAuthUser = () => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    const effectiveRole = getEffectiveRole(user);
    const normalizedAccessLevel = normalizeAccessLevel(user.accessLevel) || user.accessLevel || '';
    return {
      ...user,
      id: user.id || user.ldapId || '',
      ldapId: user.ldapId || user.id || '',
      login: user.login || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      course: user.course ?? null,
      direction: user.direction || user.specialization || '',
      specialization: user.specialization || user.direction || '',
      role: effectiveRole,
      accessLevel: normalizedAccessLevel,
      points: user.points ?? 0,
    };
  } catch {
    return null;
  }
};

export const saveAuthSession = ({ user }) => {
  if (!user) return;

  const effectiveRole = getEffectiveRole(user);
  const normalizedAccessLevel = normalizeAccessLevel(user.accessLevel) || user.accessLevel || '';
  const userToStore = {
    ...user,
    id: user.id || user.ldapId,
    ldapId: user.ldapId || user.id,
    login: user.login,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    course: user.course ?? null,
    direction: user.direction || user.specialization,
    specialization: user.specialization || user.direction,
    role: effectiveRole,
    accessLevel: normalizedAccessLevel,
    points: user.points ?? 0,
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userToStore));
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_USER_KEY);
};
export const isAuthenticated = () => {
  return Boolean(getStoredAuthUser());
};
export const isTeacher = () => {
  const user = getStoredAuthUser();
  const role = getEffectiveRole(user);
  return role === 'admin' || role === 'teacher' || role === 'prepod';
};
export const isStudent = () => {
  const user = getStoredAuthUser();
  const role = getEffectiveRole(user);
  return role === 'user' || role === 'student' || (!isTeacher() && role !== 'admin');
};
export const getUserRole = () => {
  const user = getStoredAuthUser();
  const role = getEffectiveRole(user);

  const roleMap = {
    admin: 'Администратор',
    teacher: 'Преподаватель',
    student: 'Студент',
  };

  return roleMap[role] || 'Студент';
};
export const getRawUserRole = () => {
  const user = getStoredAuthUser();
  return getEffectiveRole(user);
};
export const getUserFullName = () => {
  const user = getStoredAuthUser();
  if (!user) return 'Пользователь';
  const fullName = [user.lastName, user.firstName].filter(Boolean).join(' ').trim();
  return fullName || user.login || 'Пользователь';
};
export const getUserDisplayName = () => {
  const user = getStoredAuthUser();
  if (!user) return 'Гость';
  const fullName = getUserFullName();
  if (fullName !== 'Пользователь') return fullName;
  return user.login || 'Пользователь';
};
export const getUserDirection = () => {
  const user = getStoredAuthUser();
  const direction = user?.direction || user?.specialization;

  const directionMap = {
    FRONTEND: 'Frontend-разработка',
    BACKEND: 'Backend-разработка',
    SYSTEM_ADMIN: 'Сис-админ',
    PROJECT_MANAGER: 'PM',
    DESIGNER: 'UX/UI Дизайн',
    INDEFINITE: 'Не определено',
  };

  return directionMap[direction] || direction || 'Не указано';
};
export const getUserCourse = () => {
  const user = getStoredAuthUser();
  return user?.course || null;
};
export const getUserPoints = () => {
  const user = getStoredAuthUser();
  return user?.points || 0;
};

export const updateStoredUser = (updates) => {
  const currentUser = getStoredAuthUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
  return null;
};
export const isSessionValid = () => Boolean(getStoredAuthUser());
export const getUserSummary = () => {
  const user = getStoredAuthUser();
  if (!user) return null;

  return {
    name: getUserDisplayName(),
    fullName: getUserFullName(),
    role: getUserRole(),
    direction: getUserDirection(),
    course: getUserCourse(),
    points: getUserPoints(),
    isTeacher: isTeacher(),
    isStudent: isStudent(),
  };
};
