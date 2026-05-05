import { apiFetch } from '../apiClient';
import { enrollInEvent, fetchEvents } from './events';
import { fetchCurrentUserSummary } from './users';
import {
  ENDPOINTS,
  MY_REPORT_STATUSES,
  MY_REPORT_STATUS_PRIORITY,
  REVIEW_REPORT_STATUSES,
  REVIEW_REPORT_STATUS_PRIORITY,
  buildSearchParams,
  cleanObject,
  getPagedContent,
  getParticipationRecordPayload,
  normalizeParticipationRecord,
  normalizeReportStatus,
  pickPublicId,
  toNumberOrNull,
} from './shared';
export async function createReport(eventPublicId, payload = {}) {
  const reportLink = payload.reportLink ?? payload.link ?? payload.reportText;
  const data = await apiFetch(ENDPOINTS.participationRecords(eventPublicId), {
    method: 'POST',
    body: cleanObject({
      reportLink,
    }),
  });
  return normalizeParticipationRecord(getParticipationRecordPayload(data), {
    eventPublicId,
    ...payload,
    reportLink,
    status: 'draft',
    points: 0,
    awardedPoints: 0,
  });
}

export async function updateReport(eventPublicId, publicId, payload = {}) {
  const reportLink = payload.reportLink ?? payload.link ?? payload.reportText;

  if (!publicId) {
    throw new Error('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a \u043e\u0442\u0447\u0435\u0442\u0430');
  }

  const data = await apiFetch(ENDPOINTS.participationRecord(eventPublicId, publicId), {
    method: 'PATCH',
    body: cleanObject({
      reportLink,
    }),
  });
  return normalizeParticipationRecord(getParticipationRecordPayload(data), {
    eventPublicId,
    publicId,
    ...payload,
    reportLink,
    status: 'draft',
    points: 0,
    awardedPoints: 0,
  });
}

export async function fetchMyParticipationRecords(eventPublicId, filters = {}, options = {}) {
  const statuses = filters.statuses ?? MY_REPORT_STATUSES;
  const normalizedStatuses = Array.isArray(statuses) ? statuses : [statuses];
  const fallbackStatus = normalizedStatuses.length === 1 ? normalizedStatuses[0] : filters.status;

  const data = await apiFetch(ENDPOINTS.participationRecordsForMe(eventPublicId), {
    method: 'POST',
    params: buildSearchParams(options),
    body: cleanObject({
      eventPublicId: filters.eventPublicId ?? eventPublicId,
      statuses: normalizedStatuses,
      studentId: toNumberOrNull(filters.studentId),
      createdByTeacherId: toNumberOrNull(filters.createdByTeacherId),
    }),
  });

  return getPagedContent(data).map((record) => normalizeParticipationRecord(record, {
    eventPublicId,
    eventTitle: filters.eventTitle,
    eventPoints: filters.eventPoints,
    status: fallbackStatus,
    teacherName: filters.teacherName,
  }));
}

export async function fetchMyRegisteredEvents(filters = {}, options = {}) {
  const publicEvents = await fetchEvents(filters, options);
  const enrolledEvents = publicEvents.filter((event) => event.alreadyParticipation === true);
  const statusPriority = MY_REPORT_STATUS_PRIORITY.reduce((priority, status, index) => ({
    ...priority,
    [normalizeReportStatus(status)]: index,
  }), {});
  const getRecordKey = (record = {}) => [
    record.publicId || '',
    record.eventPublicId || '',
    record.studentId || record.studentName || '',
    record.reportLink || '',
  ].join('|');

  return Promise.all(enrolledEvents.map(async (event) => {
    const eventPublicId = event.publicId || event.id;
    if (!eventPublicId) return event;

    try {
      const recordsByStatus = await fetchMyParticipationRecords(eventPublicId, {
        eventPublicId,
        eventTitle: event.title,
        eventPoints: event.maxPoints || event.points,
        statuses: MY_REPORT_STATUS_PRIORITY,
        teacherName: event.teacherName || event.teacher,
      }, options);
      const dedupedRecords = new Map();
      recordsByStatus.forEach((record) => {
        const key = getRecordKey(record);
        if (!dedupedRecords.has(key)) {
          dedupedRecords.set(key, record);
        }
      });

      const sortedRecords = [...dedupedRecords.values()].sort((left, right) => {
        const leftPriority = statusPriority[left.status] ?? Number.MAX_SAFE_INTEGER;
        const rightPriority = statusPriority[right.status] ?? Number.MAX_SAFE_INTEGER;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;

        const leftPoints = Number(left.awardedPoints ?? 0) || 0;
        const rightPoints = Number(right.awardedPoints ?? 0) || 0;
        if (leftPoints !== rightPoints) return rightPoints - leftPoints;

        const leftUpdatedAt = Date.parse(left.updatedAt ?? left.createdAt ?? '') || 0;
        const rightUpdatedAt = Date.parse(right.updatedAt ?? right.createdAt ?? '') || 0;
        return rightUpdatedAt - leftUpdatedAt;
      });
      const record = sortedRecords.find((item) => item.reportLink || item.status !== 'draft') ?? sortedRecords[0];

      if (!record) {
        return {
          ...event,
          eventPublicId,
          reportStatus: 'draft',
          reportLink: '',
          awardedPoints: 0,
        };
      }

      const hasSavedReport = Boolean(record.reportLink || record.status !== 'draft');

      return {
        ...event,
        reportPublicId: hasSavedReport ? record.publicId : '',
        eventPublicId,
        reportStatus: record.status,
        reportLink: record.reportLink,
        reportSubmitted: Boolean(record.reportLink && record.status !== 'draft'),
        awardedPoints: record.awardedPoints,
      };
    } catch (error) {
      console.warn('My participation records search failed:', error);
      return {
        ...event,
        eventPublicId,
        reportStatus: 'draft',
        reportLink: '',
        awardedPoints: 0,
      };
    }
  }));
}

export async function submitReport(eventPublicId, publicId) {
  if (!publicId) {
    throw new Error('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u0442\u0447\u0435\u0442 \u0434\u043b\u044f \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438');
  }

  const data = await apiFetch(ENDPOINTS.participationRecordSubmit(eventPublicId, publicId), {
    method: 'PATCH',
  });
  return {
    ...normalizeParticipationRecord(getParticipationRecordPayload(data), {
      eventPublicId,
      publicId,
      status: 'submitted',
      points: 0,
      awardedPoints: 0,
    }),
    status: 'submitted',
  };
}

export async function returnReportToDraft(eventPublicId, publicId) {
  if (!publicId) {
    throw new Error('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u0442\u0447\u0435\u0442 \u0434\u043b\u044f \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430 \u0432 \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a');
  }

  const data = await apiFetch(ENDPOINTS.participationRecordReturnToDraft(eventPublicId, publicId), {
    method: 'PATCH',
  });
  return {
    ...normalizeParticipationRecord(getParticipationRecordPayload(data), {
      eventPublicId,
      publicId,
      status: 'draft',
      points: 0,
      awardedPoints: 0,
    }),
    status: 'draft',
  };
}

export async function refuseReport(eventPublicId, publicId) {
  if (!publicId) {
    throw new Error('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u0442\u0447\u0435\u0442 \u0434\u043b\u044f \u043e\u0442\u043a\u0430\u0437\u0430');
  }

  const data = await apiFetch(ENDPOINTS.participationRecordRefuse(eventPublicId, publicId), {
    method: 'PATCH',
  });
  return {
    ...normalizeParticipationRecord(getParticipationRecordPayload(data), {
      eventPublicId,
      publicId,
      status: 'refused',
      points: 0,
      awardedPoints: 0,
    }),
    status: 'refused',
  };
}

export async function acceptReport(eventPublicId, publicId, payload = {}) {
  if (!publicId) {
    throw new Error('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u0442\u0447\u0435\u0442 \u0434\u043b\u044f \u043f\u0440\u0438\u043d\u044f\u0442\u0438\u044f');
  }

  const points = payload.points ?? payload.awardedPoints;
  const normalizedPoints = Number(points);

  if (!Number.isInteger(normalizedPoints) || normalizedPoints <= 0) {
    throw new Error('\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0446\u0435\u043b\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0431\u0430\u043b\u043b\u043e\u0432 \u0431\u043e\u043b\u044c\u0448\u0435 0');
  }

  const data = await apiFetch(ENDPOINTS.participationRecordAccept(eventPublicId, publicId), {
    method: 'PATCH',
    body: cleanObject({
      points: normalizedPoints,
    }),
  });
  const recordPayload = getParticipationRecordPayload(data);
  const acceptedRecord = normalizeParticipationRecord(recordPayload, {
    eventPublicId,
    publicId,
    status: 'accepted',
    points: normalizedPoints,
    awardedPoints: normalizedPoints,
  });
  const awardedPoints = acceptedRecord.awardedPoints;

  return {
    ...acceptedRecord,
    status: 'accepted',
    points: awardedPoints,
    awardedPoints,
  };
}

export async function fetchMyApplications() {
  const events = await fetchMyRegisteredEvents();
  return events
    .filter((event) => event.reportPublicId || event.reportLink)
    .map((event) => ({
      id: event.reportPublicId || event.publicId || event.id,
      publicId: event.reportPublicId,
      eventPublicId: event.eventPublicId || event.publicId || event.id,
      eventTitle: event.title,
      appliedDate: event.date,
      points: event.maxPoints || event.points || 0,
      awardedPoints: event.awardedPoints,
      status: event.reportStatus || 'draft',
      reportLink: event.reportLink || '',
    }));
}

export async function fetchMyPoints(fallback = 0) {
  try {
    const summary = await fetchCurrentUserSummary();
    return Number(summary.totalPoints ?? fallback ?? 0) || 0;
  } catch (error) {
    console.warn('Failed to load user summary points:', error);
    return Number(fallback ?? 0) || 0;
  }
}

export async function registerForEvent(eventPublicId) {
  return enrollInEvent(eventPublicId);
}

export async function saveEventReportDraft(payload = {}) {
  const eventPublicId = payload.eventPublicId;
  const publicId = payload.forceCreate ? '' : (payload.publicId ?? payload.reportPublicId);
  const reportLink = payload.reportLink ?? payload.link ?? payload.reportText;

  if (!eventPublicId) {
    throw new Error('Не удалось определить мероприятие для отчета');
  }

  if (!reportLink) {
    throw new Error('Укажите ссылку на отчет');
  }

  return publicId
    ? await updateReport(eventPublicId, publicId, {
        ...payload,
        publicId,
        reportLink,
      })
    : await createReport(eventPublicId, {
        ...payload,
        eventPublicId,
        reportLink,
      });
}

export async function submitEventReport(payload = {}) {
  const eventPublicId = payload.eventPublicId;
  const payloadPublicId = payload.forceCreate ? '' : (payload.publicId ?? payload.reportPublicId);
  const reportLink = payload.reportLink ?? payload.link ?? payload.reportText;

  if (!eventPublicId) {
    throw new Error('Не удалось определить мероприятие для отчета');
  }

  if (!reportLink && !payloadPublicId) {
    throw new Error('Укажите ссылку на отчет');
  }

  const report = reportLink
    ? await saveEventReportDraft({
        ...payload,
        eventPublicId,
        publicId: payloadPublicId,
        forceCreate: payload.forceCreate,
        reportLink,
      })
    : {
        eventPublicId,
        publicId: payloadPublicId,
      };
  const publicId = report.publicId || payloadPublicId;

  if (!publicId) {
    throw new Error('Бэк не прислал ID отчета');
  }

  return submitReport(eventPublicId, publicId);
}

export async function fetchParticipationRecordsForMyEvent(eventPublicId, filters = {}, options = {}) {
  const statuses = filters.statuses ?? REVIEW_REPORT_STATUSES;
  const normalizedStatuses = Array.isArray(statuses) ? statuses : [statuses];
  const fallbackStatus = normalizedStatuses.length === 1 ? normalizedStatuses[0] : filters.status;

  const data = await apiFetch(ENDPOINTS.participationRecordsForMyEvents(eventPublicId), {
    method: 'POST',
    params: buildSearchParams(options),
    body: cleanObject({
      eventPublicId: filters.eventPublicId ?? eventPublicId,
      statuses: normalizedStatuses,
      studentId: toNumberOrNull(filters.studentId),
      createdByTeacherId: toNumberOrNull(filters.createdByTeacherId),
    }),
  });

  return getPagedContent(data)
    .map((record) => normalizeParticipationRecord(record, {
      eventPublicId,
      eventTitle: filters.eventTitle,
      eventPoints: filters.eventPoints,
      status: fallbackStatus,
      teacherName: filters.teacherName,
    }))
    .filter((record) => record.reportLink);
}

const getReviewRecordDedupeKey = (record = {}) => [
  record.publicId || '',
  record.eventPublicId || '',
  record.studentId || record.studentName || '',
  record.reportLink || '',
].join('|');

const dedupeReviewRecords = (records = []) => {
  const deduped = new Map();

  records.forEach((record) => {
    const key = getReviewRecordDedupeKey(record);
    if (!deduped.has(key)) {
      deduped.set(key, record);
    }
  });

  return [...deduped.values()];
};

export async function fetchAdminPendingReports(eventsOrFilters = [], options = {}) {
  const events = Array.isArray(eventsOrFilters) ? eventsOrFilters : [];
  const filters = Array.isArray(eventsOrFilters) ? {} : eventsOrFilters;

  if (events.length > 0) {
    const requestedStatuses = filters.statuses ?? REVIEW_REPORT_STATUS_PRIORITY;
    const normalizedStatuses = Array.isArray(requestedStatuses) ? requestedStatuses : [requestedStatuses];
    const recordsByEvent = await Promise.all(events
      .filter((event) => event.publicId || event.id)
      .map((event) =>
        fetchParticipationRecordsForMyEvent(event.publicId || event.id, {
          ...filters,
          eventTitle: event.title,
          eventPoints: event.maxPoints || event.points,
          statuses: normalizedStatuses,
          teacherName: event.teacherName || event.teacher,
        }, options),
      ));

    return dedupeReviewRecords(recordsByEvent.flat());
  }

  if (filters.eventPublicId) {
    const requestedStatuses = filters.statuses ?? REVIEW_REPORT_STATUS_PRIORITY;
    const normalizedStatuses = Array.isArray(requestedStatuses) ? requestedStatuses : [requestedStatuses];
    const recordsByStatus = await fetchParticipationRecordsForMyEvent(filters.eventPublicId, {
      ...filters,
      statuses: normalizedStatuses,
    }, options);

    return dedupeReviewRecords(recordsByStatus);
  }

  return [];
}

export async function reviewReport(submissionOrPublicId, nextStatus, eventPublicIdArg, payload = {}) {
  const submission = typeof submissionOrPublicId === 'object' ? submissionOrPublicId : {};
  const eventPublicId = pickPublicId([
    submission.eventPublicId,
    submission.EventPublicId,
    submission.eventPublicID,
    submission.EventPublicID,
    eventPublicIdArg,
  ]);
  const publicIdCandidates = [
    submission.publicId,
    submission.PublicId,
    submission.publicID,
    submission.PublicID,
  ];

  if (typeof submissionOrPublicId !== 'object') {
    publicIdCandidates.push(submissionOrPublicId);
  }

  const publicId = pickPublicId([
    ...publicIdCandidates,
  ]);

  if (!eventPublicId || !publicId) {
    throw new Error('Не удалось определить отчет для проверки');
  }

  const normalizedStatus = normalizeReportStatus(nextStatus);
  if (normalizedStatus === 'accepted') {
    return acceptReport(eventPublicId, publicId, payload);
  }

  if (normalizedStatus === 'refused') {
    return refuseReport(eventPublicId, publicId);
  }

  if (normalizedStatus === 'draft') {
    return returnReportToDraft(eventPublicId, publicId);
  }

  return submitReport(eventPublicId, publicId);
}


