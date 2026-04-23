// Auth storage keys
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';
const PROFILE_SETUP_KEY = 'profileSetupPending';
const PROFILE_SETUP_LOGIN_KEY = 'profileSetupLogin';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || '';

export const getRefreshToken = () => localStorage.getItem(AUTH_REFRESH_TOKEN_KEY) || '';

export const getStoredAuthUser = () => {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    // Normalize user data for consistency
    return {
      id: user.id || user.ldapId || '',
      ldapId: user.ldapId || user.id || '',
      login: user.login || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      course: user.course ?? null,
      direction: user.direction || user.specialization || '',
      specialization: user.specialization || user.direction || '',
      role: user.role || 'student',
      points: user.points ?? 0,
      ...user
    };
  } catch {
    return null;
  }
};

export const saveAuthSession = ({ token, user, refreshToken }) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
  if (user) {
    // Store normalized user data
    const userToStore = {
      id: user.id || user.ldapId,
      ldapId: user.ldapId || user.id,
      login: user.login,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      course: user.course ?? null,
      direction: user.direction || user.specialization,
      specialization: user.specialization || user.direction,
      role: user.role || 'student',
      points: user.points ?? 0,
      ...user
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userToStore));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(PROFILE_SETUP_KEY);
  localStorage.removeItem(PROFILE_SETUP_LOGIN_KEY);
};

// Save profile setup pending state
export const saveProfileSetupSession = ({ token, login }) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(PROFILE_SETUP_KEY, 'true');
  }
  if (login) {
    localStorage.setItem(PROFILE_SETUP_LOGIN_KEY, login);
  }
};

// Check if profile setup is pending
export const isProfileSetupPending = () => {
  return localStorage.getItem(PROFILE_SETUP_KEY) === 'true';
};

// Clear profile setup flag
export const clearProfileSetupPending = () => {
  localStorage.removeItem(PROFILE_SETUP_KEY);
};

export const getProfileSetupSession = () => ({
  token: getAuthToken(),
  login: localStorage.getItem(PROFILE_SETUP_LOGIN_KEY) || '',
  pending: isProfileSetupPending(),
});

export const clearProfileSetupSession = () => {
  clearProfileSetupPending();
  localStorage.removeItem(PROFILE_SETUP_LOGIN_KEY);
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token && token.length > 0;
};

// Check if user is a teacher (admin or teacher/prepod)
// Check if user is a teacher
export const isTeacher = () => {
  const user = getStoredAuthUser();
  const role = user?.role?.toLowerCase();
  return role === 'admin' || role === 'teacher' || role === 'prepod';
};

// Check if user is a student
export const isStudent = () => {
  const user = getStoredAuthUser();
  const role = user?.role?.toLowerCase();
  return role === 'user' || role === 'student' || (!isTeacher() && role !== 'admin');
};

// Get user role with proper display name
export const getUserRole = () => {
  const user = getStoredAuthUser();
  const role = user?.role?.toLowerCase() || 'student';
  
  const roleMap = {
    'admin': 'Администратор',
    'teacher': 'Преподаватель',
    'prepod': 'Преподаватель',
    'user': 'Студент',
    'student': 'Студент'
  };
  
  return roleMap[role] || 'Студент';
};

// Get raw user role for logic
export const getRawUserRole = () => {
  const user = getStoredAuthUser();
  return user?.role?.toLowerCase() || 'student';
};

// Get user full name
export const getUserFullName = () => {
  const user = getStoredAuthUser();
  if (!user) return 'Пользователь';
  const fullName = [user.lastName, user.firstName].filter(Boolean).join(' ').trim();
  return fullName || user.login || 'Пользователь';
};

// Get user display name for UI
export const getUserDisplayName = () => {
  const user = getStoredAuthUser();
  if (!user) return 'Гость';
  const fullName = getUserFullName();
  if (fullName !== 'Пользователь') return fullName;
  return user.login || 'Пользователь';
};

// Get user direction
export const getUserDirection = () => {
  const user = getStoredAuthUser();
  const direction = user?.direction || user?.specialization;
  
  const directionMap = {
    'FRONTEND': 'Frontend-разработка',
    'BACKEND': 'Backend-разработка',
    'SYSTEM_ADMIN': 'Сис-админ',
    'PROJECT_MANAGER': 'PM',
    'DESIGNER': 'UX/UI Дизайн',
    'INDEFINITE': 'Не определено'
  };
  
  return directionMap[direction] || direction || 'Не указано';
};

// Get user course
export const getUserCourse = () => {
  const user = getStoredAuthUser();
  return user?.course || null;
};

// Get user points
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

// Get auth headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Check token expiration (if your backend provides expiration info)
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // Try to decode JWT token (if it's a JWT)
    const payload = token.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload));
      if (decoded.exp) {
        return Date.now() >= decoded.exp * 1000;
      }
    }
  } catch {
    // If not JWT or can't decode, assume not expired
  }
  return false;
};

// Validate if current session is valid
export const isSessionValid = () => {
  const token = getAuthToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }
  return true;
};

// Get user summary for display
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
