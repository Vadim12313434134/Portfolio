import { apiFetch } from '../apiClient';
import { ENDPOINTS, getPagedContent } from './shared';

const normalizePeriod = (raw = {}) => ({
  name: String(raw.name ?? raw.Name ?? ''),
  startDate: String(raw.startDate ?? raw.StartDate ?? '').trim(),
  endDate: String(raw.endDate ?? raw.EndDate ?? '').trim(),
  status: String(raw.status ?? raw.Status ?? '').trim().toUpperCase(),
});

const hasNonEmptyPeriodName = (value) => String(value ?? '').trim().length > 0;

const getPeriodNameCandidates = (name) => {
  const rawName = String(name ?? '');
  const trimmedName = rawName.trim();
  const candidates = [rawName];

  if (trimmedName && trimmedName !== rawName) {
    candidates.push(trimmedName);
  }

  return [...new Set(candidates.filter((value) => value.length > 0))];
};

const withPeriodNameCandidates = async (name, requestFactory) => {
  if (!hasNonEmptyPeriodName(name)) {
    throw new Error('Не удалось определить название периода');
  }

  const candidates = getPeriodNameCandidates(name);
  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      const response = await requestFactory(candidate);
      return { response, resolvedName: candidate };
    } catch (error) {
      lastError = error;
      const shouldTryNextCandidate = error?.status === 404 || error?.status === 400;
      if (!shouldTryNextCandidate || index === candidates.length - 1) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error('Не удалось выполнить операцию с периодом');
};

export async function fetchStudyPeriods() {
  const data = await apiFetch(ENDPOINTS.period, {
    method: 'GET',
  });

  const payload = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  const periods = getPagedContent(payload).map((period) => normalizePeriod(period));

  return {
    periods,
  };
}

export async function fetchStudyPeriodByName(name) {
  const { response } = await withPeriodNameCandidates(name, (candidateName) => apiFetch(
    ENDPOINTS.periodByName(candidateName),
    {
      method: 'GET',
    },
  ));

  const payloadData = response?.data ?? response?.Data ?? response?.result ?? response?.Result ?? response;
  return normalizePeriod(payloadData);
}

export async function createStudyPeriod(payload = {}) {
  const name = String(payload.name ?? '').trim();
  const startDate = String(payload.startDate ?? '').trim();
  const endDate = String(payload.endDate ?? '').trim();

  if (!name) {
    throw new Error('Укажите название периода');
  }
  if (!startDate || !endDate) {
    throw new Error('Укажите даты начала и окончания периода');
  }

  const data = await apiFetch(ENDPOINTS.period, {
    method: 'POST',
    body: {
      name,
      startDate,
      endDate,
    },
  });

  const payloadData = data?.data ?? data?.Data ?? data?.result ?? data?.Result ?? data;
  return normalizePeriod(payloadData);
}

export async function updateStudyPeriod(name, payload = {}) {
  const startDate = String(payload.startDate ?? '').trim();
  const endDate = String(payload.endDate ?? '').trim();

  if (!startDate || !endDate) {
    throw new Error('Укажите даты начала и окончания периода');
  }

  const { response } = await withPeriodNameCandidates(name, (candidateName) => apiFetch(
    ENDPOINTS.periodByName(candidateName),
    {
      method: 'PATCH',
      body: {
        startDate,
        endDate,
      },
    },
  ));

  const payloadData = response?.data ?? response?.Data ?? response?.result ?? response?.Result ?? response;
  return normalizePeriod(payloadData);
}

export async function deleteStudyPeriod(name) {
  const { resolvedName } = await withPeriodNameCandidates(name, (candidateName) => apiFetch(
    ENDPOINTS.periodByName(candidateName),
    {
      method: 'DELETE',
    },
  ));

  return { name: resolvedName };
}

export async function archiveStudyPeriod(name) {
  const { response } = await withPeriodNameCandidates(name, (candidateName) => apiFetch(
    ENDPOINTS.periodArchivate(candidateName),
    {
      method: 'PATCH',
    },
  ));

  const payloadData = response?.data ?? response?.Data ?? response?.result ?? response?.Result ?? response;
  return normalizePeriod(payloadData);
}

export async function activateStudyPeriod(name) {
  const { response } = await withPeriodNameCandidates(name, (candidateName) => apiFetch(
    ENDPOINTS.periodActivate(candidateName),
    {
      method: 'PATCH',
    },
  ));

  const payloadData = response?.data ?? response?.Data ?? response?.result ?? response?.Result ?? response;
  return normalizePeriod(payloadData);
}
