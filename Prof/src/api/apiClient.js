const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export async function apiFetch(path, { method = 'GET', body, token, params } = {}) {
  const headers = {
    Accept: 'application/json',
  };
  const hasBody = body !== undefined && body !== null;

  if (hasBody && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const requestBody = hasBody && !(body instanceof FormData) && !(body instanceof URLSearchParams)
    ? JSON.stringify(body)
    : body;

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody,
  });

  if (res.status === 204) {
    return { success: true };
  }

  const rawText = await res.text().catch(() => '');
  const parsed = rawText ? safeJsonParse(rawText) : null;

  if (!res.ok) {
    const isProxyOrGatewayError = [502, 503, 504].includes(res.status);
    const message = isProxyOrGatewayError
      ? 'API-сервер недоступен. Проверьте, что бэкенд запущен и адрес прокси указан верно.'
      : parsed?.message
      ?? parsed?.error
      ?? parsed?.errors?.[0]?.message
      ?? parsed?.detail
      ?? rawText
      ?? `Request failed with status ${res.status}`;

    const err = new Error(message);
    err.status = res.status;
    err.data = parsed;
    throw err;
  }

  return parsed ?? { success: true };
}
