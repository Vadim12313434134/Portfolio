import { apiFetch, apiFetchBlob } from '../apiClient';
import {
  ENDPOINTS,
  buildEventSearchBody,
  buildSearchParams,
  cacheEventDetails,
  cleanObject,
  enrichEventsWithDetails,
  getEventDateTime,
  getEventLocation,
  getEventPayload,
  getPagedContent,
  mergeCachedEventDetails,
  normalizeEvent,
  normalizeEventStatus,
  normalizeParticipationRecord,
  toRuDate,
} from './shared';

const getFileNameFromDisposition = (contentDisposition, fallback = 'events-import-template.xlsx') => {
  if (!contentDisposition || typeof contentDisposition !== 'string') return fallback;

  const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''));
    } catch {
    }
  }

  const fileNameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (!fileNameMatch?.[1]) return fallback;

  const parsed = fileNameMatch[1].trim().replace(/^["']|["']$/g, '');
  return parsed || fallback;
};
export async function createEvent(payload) {
  const requestedStatus = normalizeEventStatus(payload.status, 'DRAFT');
  const data = await apiFetch(ENDPOINTS.events, {
    method: 'POST',
    body: cleanObject({
      title: payload.title,
      description: payload.description,
      eventDateTime: payload.eventDateTime,
      location: payload.location,
      direction: payload.direction,
      course: Number(payload.course),
      maxPoints: Number(payload.maxPoints),
    }),
  });

  const eventData = getEventPayload(data);
  const createdStatus = eventData.Status || eventData.status
    ? normalizeEventStatus(eventData.Status ?? eventData.status)
    : null;
  const eventFallback = {
    ...payload,
    ...eventData,
    eventDateTime: getEventDateTime(eventData) || payload.eventDateTime,
    location: getEventLocation(eventData) || payload.location,
    status: eventData.Status ?? eventData.status ?? requestedStatus,
  };
  const normalized = {
    ...normalizeEvent(eventFallback),
    eventDateTime: getEventDateTime(eventFallback),
    date: toRuDate(getEventDateTime(eventFallback)),
    location: getEventLocation(eventFallback),
    status: createdStatus ?? normalizeEventStatus(requestedStatus, 'PUBLISHED'),
  };

  if (normalizeEventStatus(requestedStatus) === 'PUBLISHED' && createdStatus !== 'PUBLISHED' && normalized.publicId) {
    try {
      const publishedEvent = await publishEvent(normalized.publicId);
      return cacheEventDetails({
        ...normalized,
        ...publishedEvent,
        location: publishedEvent.location || normalized.location,
        status: 'PUBLISHED',
      });
    } catch (error) {
      return cacheEventDetails({
        ...normalized,
        status: createdStatus ?? normalized.status ?? 'DRAFT',
        publicationError: error,
      });
    }
  }

  return cacheEventDetails(normalized);
}

export async function searchEvents(filters = {}, options = {}) {
  const data = await apiFetch(ENDPOINTS.eventsSearch, {
    method: 'POST',
    params: buildSearchParams(options),
    body: buildEventSearchBody(filters),
  });
  const events = getPagedContent(data).map((event) => mergeCachedEventDetails(normalizeEvent(event)));
  return enrichEventsWithDetails(events, fetchEventById);
}

export async function fetchEventsList() {
  const data = await apiFetch(ENDPOINTS.events, {
    method: 'GET',
  });
  return getPagedContent(data).map((event) => mergeCachedEventDetails(normalizeEvent(event)));
}

export async function fetchEvents(filters = {}, options = {}) {
  const normalizedFilters = cleanObject({
    statuses: ['PUBLISHED'],
    ...filters,
  });

  try {
    const publishedEvents = await searchEvents(normalizedFilters, options);
    return publishedEvents;
  } catch (error) {
    console.warn('Published events search failed:', error);
    return [];
  }
}

export async function fetchMyEvents(filters = {}, options = {}) {
  const data = await apiFetch(ENDPOINTS.myEventsSearch, {
    method: 'POST',
    params: buildSearchParams(options),
    body: buildEventSearchBody(filters),
  });

  const events = getPagedContent(data).map((event) => {
    const normalized = normalizeEvent(event);
    const record = normalizeParticipationRecord(event, {
      eventPublicId: normalized.publicId,
      eventTitle: normalized.title,
      eventPoints: normalized.maxPoints,
    });
    const reportStatus = record.status;
    const hasSavedReport = Boolean(record.reportLink || reportStatus !== 'draft');

    return mergeCachedEventDetails({
      ...normalized,
      isOwnEvent: true,
      reportPublicId: hasSavedReport ? record.publicId : '',
      eventPublicId: normalized.publicId,
      reportStatus,
      reportLink: record.reportLink,
      reportSubmitted: Boolean(event.reportSubmitted || reportStatus === 'submitted' || reportStatus === 'accepted' || reportStatus === 'refused'),
      awardedPoints: record.awardedPoints,
    });
  });

  return enrichEventsWithDetails(events, fetchEventById);
}

export async function fetchEventById(publicId) {
  const data = await apiFetch(ENDPOINTS.eventById(publicId), {
    method: 'GET',
  });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function updateEvent(publicId, payload) {
  const data = await apiFetch(ENDPOINTS.eventById(publicId), {
    method: 'PATCH',
    body: cleanObject({
      title: payload.title,
      description: payload.description,
      eventDateTime: payload.eventDateTime,
      location: payload.location,
      direction: payload.direction,
      course: payload.course !== undefined ? Number(payload.course) : undefined,
      maxPoints: payload.maxPoints !== undefined ? Number(payload.maxPoints) : undefined,
    }),
  });
  const eventData = getEventPayload(data);
  const eventFallback = {
    ...payload,
    ...eventData,
    eventDateTime: getEventDateTime(eventData) || payload.eventDateTime,
    location: getEventLocation(eventData) || payload.location,
    publicId,
  };
  return {
    ...cacheEventDetails(normalizeEvent(eventFallback)),
    eventDateTime: getEventDateTime(eventFallback),
    date: toRuDate(getEventDateTime(eventFallback)),
    location: getEventLocation(eventFallback),
  };
}

export async function publishEvent(publicId) {
  const data = await apiFetch(ENDPOINTS.eventPublish(publicId), { method: 'PATCH' });
  const eventData = getEventPayload(data);
  const status = eventData.Status ?? eventData.status ?? 'PUBLISHED';
  return cacheEventDetails({
    ...normalizeEvent({ publicId, ...eventData, status }),
    publicId,
    id: publicId,
    status: normalizeEventStatus(status, 'PUBLISHED'),
  });
}

export async function finishEvent(publicId) {
  const data = await apiFetch(ENDPOINTS.eventFinish(publicId), { method: 'PATCH' });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function cancelEvent(publicId) {
  const data = await apiFetch(ENDPOINTS.eventCancel(publicId), { method: 'PATCH' });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function deleteEvent(publicId) {
  await apiFetch(ENDPOINTS.eventById(publicId), {
    method: 'DELETE',
  });

  return { publicId, id: publicId };
}

export async function fetchEventsImportTemplate() {
  const { blob, headers } = await apiFetchBlob(ENDPOINTS.eventsImportTemplate, {
    method: 'GET',
  });

  const contentDisposition = headers?.['content-disposition'] ?? headers?.['Content-Disposition'] ?? '';
  const contentType = headers?.['content-type'] ?? headers?.['Content-Type'] ?? blob.type ?? 'application/octet-stream';
  const fileName = getFileNameFromDisposition(contentDisposition);

  return {
    blob,
    fileName,
    contentType,
  };
}

export async function importEventsFromCsv(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch(ENDPOINTS.eventsImportCsv, {
    method: 'POST',
    body: formData,
  });
}

export async function enrollInEvent(publicId) {
  const normalizedPublicId = String(publicId ?? '').trim();
  if (!normalizedPublicId) {
    throw new Error('Не удалось определить ID мероприятия для записи');
  }

  const data = await apiFetch(ENDPOINTS.eventEnroll(normalizedPublicId), {
    method: 'POST',
  });
  const payload = getEventPayload(data);
  const hasEventPayload = Boolean(
    payload?.publicId
      || payload?.id
      || payload?.title
      || payload?.titleOfEvent
      || payload?.eventDateTime
  );

  if (payload && typeof payload === 'object' && hasEventPayload) {
    return cacheEventDetails(normalizeEvent({
      publicId: normalizedPublicId,
      ...payload,
      alreadyParticipation: true,
    }));
  }

  return { publicId: normalizedPublicId, id: normalizedPublicId, alreadyParticipation: true };
}

export async function cancelEnrollInEvent(publicId) {
  const normalizedPublicId = String(publicId ?? '').trim();
  if (!normalizedPublicId) {
    throw new Error('Не удалось определить ID мероприятия для отмены записи');
  }

  const data = await apiFetch(ENDPOINTS.eventCancelEnroll(normalizedPublicId), {
    method: 'DELETE',
  });
  const payload = getEventPayload(data);
  const hasEventPayload = Boolean(
    payload?.publicId
      || payload?.id
      || payload?.title
      || payload?.titleOfEvent
      || payload?.eventDateTime
  );

  if (payload && typeof payload === 'object' && hasEventPayload) {
    return cacheEventDetails(normalizeEvent({
      publicId: normalizedPublicId,
      ...payload,
      alreadyParticipation: false,
    }));
  }

  return { publicId: normalizedPublicId, id: normalizedPublicId, alreadyParticipation: false };
}




