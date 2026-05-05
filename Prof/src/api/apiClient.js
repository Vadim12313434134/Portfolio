import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DEV_COOKIE_PAIR = 'session=CDS-login-user=i23s0044';
const STUB_COOKIE_VALUE = String(import.meta.env.VITE_STUB_COOKIE || DEV_COOKIE_PAIR).trim();
const STUB_COOKIE_HEADER_NAME = String(import.meta.env.VITE_STUB_COOKIE_HEADER || 'X-Stub-Cookie').trim();
const STUB_COOKIE_SAME_SITE = String(import.meta.env.VITE_STUB_COOKIE_SAME_SITE || 'Lax').trim();
const STUB_COOKIE_SECURE = String(import.meta.env.VITE_STUB_COOKIE_SECURE || '').trim().toLowerCase() === 'true';

const parseCookiePair = (cookieString) => {
  const firstChunk = String(cookieString || '').split(';')[0]?.trim();
  if (!firstChunk) return null;

  const separatorIndex = firstChunk.indexOf('=');
  if (separatorIndex <= 0) return null;

  const name = firstChunk.slice(0, separatorIndex).trim();
  const value = firstChunk.slice(separatorIndex + 1).trim();
  if (!name) return null;
  return { name, value };
};

const ensureDevCookie = () => {
  if (typeof document === 'undefined') return;

  const parsedCookie = parseCookiePair(DEV_COOKIE_PAIR);
  if (!parsedCookie) return;

  const { name, value } = parsedCookie;
  const existingCookieValue = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (existingCookieValue === `${name}=${value}`) return;

  const sameSite = ['Lax', 'Strict', 'None'].includes(STUB_COOKIE_SAME_SITE) ? STUB_COOKIE_SAME_SITE : 'Lax';
  const secureFlag = STUB_COOKIE_SECURE ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; SameSite=${sameSite}${secureFlag}`;
};

const buildCookieHeaders = () => {
  const headers = {};
  const cookieValue = STUB_COOKIE_VALUE || DEV_COOKIE_PAIR;
  if (!cookieValue || !STUB_COOKIE_HEADER_NAME) return headers;

  headers[STUB_COOKIE_HEADER_NAME] = cookieValue;
  headers.Cookie = cookieValue;

  return headers;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const normalizeErrorMessage = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if ([502, 503, 504].includes(status)) {
    return 'API server is unavailable. Check backend and proxy settings.';
  }

  return data?.message
    ?? data?.error
    ?? data?.errors?.[0]?.message
    ?? data?.detail
    ?? error?.message
    ?? `Request failed with status ${status ?? 'unknown'}`;
};

export async function apiFetch(path, { method = 'GET', body, params } = {}) {
  ensureDevCookie();

  try {
    const response = await api.request({
      url: path,
      method,
      params,
      data: body,
      headers: {
        Accept: 'application/json',
        ...buildCookieHeaders(),
      },
    });

    if (response.status === 204) {
      return { success: true };
    }

    return response.data ?? { success: true };
  } catch (error) {
    const err = new Error(normalizeErrorMessage(error));
    err.status = error?.response?.status;
    err.data = error?.response?.data ?? null;
    throw err;
  }
}

export async function apiFetchBlob(path, { method = 'GET', params } = {}) {
  ensureDevCookie();

  try {
    const response = await api.request({
      url: path,
      method,
      params,
      responseType: 'blob',
      headers: {
        Accept: '*/*',
        ...buildCookieHeaders(),
      },
    });

    return {
      blob: response.data,
      headers: response.headers ?? {},
      status: response.status,
    };
  } catch (error) {
    const err = new Error(normalizeErrorMessage(error));
    err.status = error?.response?.status;
    err.data = error?.response?.data ?? null;
    throw err;
  }
}
