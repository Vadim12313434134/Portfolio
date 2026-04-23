import { apiFetch } from '../apiClient';
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
export async function createEvent(token, payload) {
  const requestedStatus = normalizeEventStatus(payload.status, 'DRAFT');
  const data = await apiFetch(ENDPOINTS.events, {
    method: 'POST',
    token,
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
      const publishedEvent = await publishEvent(token, normalized.publicId);
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

export async function searchEvents(token, filters = {}, options = {}) {
  const data = await apiFetch(ENDPOINTS.eventsSearch, {
    method: 'POST',
    token,
    params: buildSearchParams(options),
    body: buildEventSearchBody(filters),
  });
  const events = getPagedContent(data).map((event) => mergeCachedEventDetails(normalizeEvent(event)));
  return enrichEventsWithDetails(token, events, fetchEventById);
}

export async function fetchEventsList(token) {
  const data = await apiFetch(ENDPOINTS.events, {
    method: 'GET',
    token,
  });
  return getPagedContent(data).map((event) => mergeCachedEventDetails(normalizeEvent(event)));
}

export async function fetchEvents(token, filters = {}, options = {}) {
  const normalizedFilters = cleanObject({
    statuses: ['PUBLISHED'],
    ...filters,
  });

  try {
    const publishedEvents = await searchEvents(token, normalizedFilters, options);
    return publishedEvents;
  } catch (error) {
    console.warn('Published events search failed:', error);
    return [];
  }
}

export async function fetchMyEvents(token, filters = {}, options = {}) {
  const data = await apiFetch(ENDPOINTS.myEventsSearch, {
    method: 'POST',
    token,
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

  return enrichEventsWithDetails(token, events, fetchEventById);
}

export async function fetchEventById(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventById(publicId), {
    method: 'GET',
    token,
  });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function updateEvent(token, publicId, payload) {
  const data = await apiFetch(ENDPOINTS.eventById(publicId), {
    method: 'PATCH',
    token,
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

export async function publishEvent(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventPublish(publicId), { method: 'PATCH', token });
  const eventData = getEventPayload(data);
  const status = eventData.Status ?? eventData.status ?? 'PUBLISHED';
  return cacheEventDetails({
    ...normalizeEvent({ publicId, ...eventData, status }),
    publicId,
    id: publicId,
    status: normalizeEventStatus(status, 'PUBLISHED'),
  });
}

export async function finishEvent(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventFinish(publicId), { method: 'PATCH', token });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function cancelEvent(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventCancel(publicId), { method: 'PATCH', token });
  return cacheEventDetails(normalizeEvent(getEventPayload(data)));
}

export async function enrollInEvent(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventEnroll(publicId), {
    method: 'POST',
    token,
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
      publicId,
      ...payload,
      alreadyParticipation: true,
    }));
  }

  return { publicId, id: publicId, alreadyParticipation: true };
}

export async function cancelEnrollInEvent(token, publicId) {
  const data = await apiFetch(ENDPOINTS.eventCancelEnroll(publicId), {
    method: 'DELETE',
    token,
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
      publicId,
      ...payload,
      alreadyParticipation: false,
    }));
  }

  return { publicId, id: publicId, alreadyParticipation: false };
}


