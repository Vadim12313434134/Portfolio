import { useCallback, useEffect, useState } from 'react';
import styles from './UsersPageStyle.module.css';
import AppSidebar from '../Common/AppSidebar';
import Toast from '../MainPage/components/Toast';
import Logo from '../MainPage/png/Logo.png';
import {
  activateStudyPeriod,
  archiveStudyPeriod,
  blockUserByLdapId,
  createGoal,
  createStudyPeriod,
  deleteStudyPeriod,
  fetchGoalByPublicId,
  fetchGoals,
  fetchStudyPeriodByName,
  fetchStudyPeriods,
  fetchUsers,
  updateStudyPeriod,
  unblockUserByLdapId,
} from '../../api/backendApi';

const getUserDisplayName = (user = {}) => {
  const fullName = String(user.fullName ?? '').trim();
  if (fullName) return fullName;

  const firstName = String(user.firstName ?? '').trim();
  const lastName = String(user.lastName ?? '').trim();
  const combined = `${firstName} ${lastName}`.trim();
  if (combined) return combined;

  return user.login || user.ldapId || 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ';
};

const toAccessLevelLabel = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'moderator') return 'РњРѕРґРµСЂР°С‚РѕСЂ';
  if (normalized === 'teacher' || normalized === 'prepod' || normalized === 'prof') return 'РџСЂРµРїРѕРґР°РІР°С‚РµР»СЊ';
  if (normalized === 'student' || normalized === 'user') return 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ';
  return normalized ? normalized.toUpperCase() : 'РќРµ СѓРєР°Р·Р°РЅРѕ';
};

const USERS_PAGE_SIZE = 20;

const getDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultPeriodForm = () => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  return {
    name: '',
    startDate: getDateInputValue(start),
    endDate: getDateInputValue(end),
  };
};

const getDefaultGoalForm = () => ({
  periodName: '',
  course: '1',
  targetPoints: '',
});

const formatPeriodDate = (value) => {
  if (!value) return 'вЂ”';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ru-RU');
};

const getPeriodStatusMeta = (status) => {
  const normalized = String(status ?? '').trim().toUpperCase();
  if (normalized === 'ACTIVE') return { label: 'РђРєС‚РёРІРµРЅ', className: styles.periodStatusActive };
  if (normalized === 'ARCHIVED' || normalized === 'ARCHIVE') {
    return { label: 'Р’ Р°СЂС…РёРІРµ', className: styles.periodStatusArchived };
  }
  if (normalized === 'FINISHED' || normalized === 'CLOSED') {
    return { label: 'Р—Р°РІРµСЂС€РµРЅ', className: styles.periodStatusFinished };
  }
  if (normalized === 'DRAFT' || normalized === 'PLANNED') {
    return { label: 'Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅ', className: styles.periodStatusPlanned };
  }
  return { label: normalized || 'РќРµ СѓРєР°Р·Р°РЅ', className: styles.periodStatusDefault };
};

const getGoalStatusMeta = (status) => {
  const normalized = String(status ?? '').trim().toUpperCase();
  if (normalized === 'ACTIVE') return { label: 'РђРєС‚РёРІРЅР°СЏ', className: styles.goalStatusActive };
  if (normalized === 'PLANNED') return { label: 'Р—Р°РїР»Р°РЅРёСЂРѕРІР°РЅР°', className: styles.goalStatusPlanned };
  if (normalized === 'ARCHIVED') return { label: 'Р’ Р°СЂС…РёРІРµ', className: styles.goalStatusArchived };
  return { label: normalized || 'РќРµ СѓРєР°Р·Р°РЅ', className: styles.goalStatusDefault };
};

const normalizePeriodName = (name) => String(name ?? '');
const hasPeriodName = (name) => normalizePeriodName(name).trim().length > 0;
const resolvePeriodNameFromPayload = (period, fallbackName) => {
  const periodName = normalizePeriodName(period?.name);
  return hasPeriodName(periodName) ? periodName : normalizePeriodName(fallbackName);
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageMeta, setPageMeta] = useState({
    number: 0,
    size: USERS_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });
  const [processingLdapId, setProcessingLdapId] = useState('');
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState(getDefaultPeriodForm);
  const [periods, setPeriods] = useState([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [periodSubmitting, setPeriodSubmitting] = useState(false);
  const [editingPeriodName, setEditingPeriodName] = useState('');
  const [periodEditForm, setPeriodEditForm] = useState({
    startDate: '',
    endDate: '',
  });
  const [processingPeriodName, setProcessingPeriodName] = useState('');
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState(getDefaultGoalForm);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalPeriodsOptions, setGoalPeriodsOptions] = useState([]);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState(null);
  const [loadingGoalPublicId, setLoadingGoalPublicId] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadUsers = useCallback(async () => {

    setLoading(true);
    try {
      const response = await fetchUsers({
        page: pageNumber,
        size: USERS_PAGE_SIZE,
        sortBy: 'blocked',
      });

      const totalPages = Number(response?.page?.totalPages ?? 0) || 0;
      if (totalPages > 0 && pageNumber > totalPages - 1) {
        setPageNumber(totalPages - 1);
        return;
      }

      setUsers(response?.users ?? []);
      setPageMeta({
        number: Number(response?.page?.number ?? pageNumber) || 0,
        size: Number(response?.page?.size ?? USERS_PAGE_SIZE) || USERS_PAGE_SIZE,
        totalElements: Number(response?.page?.totalElements ?? 0) || 0,
        totalPages,
      });
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№', 'error');
      setUsers([]);
      setPageMeta({
        number: pageNumber,
        size: USERS_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [pageNumber, showToast]);

  const loadPeriods = useCallback(async () => {

    setPeriodsLoading(true);
    try {
      const response = await fetchStudyPeriods();
      setPeriods(response?.periods ?? []);
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїРµСЂРёРѕРґС‹', 'error');
      setPeriods([]);
    } finally {
      setPeriodsLoading(false);
    }
  }, [showToast]);

  const loadGoalPeriodsOptions = useCallback(async () => {

    try {
      const response = await fetchStudyPeriods();

      const names = [...new Set((response?.periods ?? [])
        .map((period) => normalizePeriodName(period?.name))
        .filter((name) => hasPeriodName(name)))];

      setGoalPeriodsOptions(names);
      setGoalForm((prev) => {
        if (hasPeriodName(prev.periodName)) return prev;
        return {
          ...prev,
          periodName: names[0] ?? '',
        };
      });
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРїРёСЃРѕРє РїРµСЂРёРѕРґРѕРІ РґР»СЏ С†РµР»РµР№', 'error');
    }
  }, [showToast]);

  const loadGoals = useCallback(async () => {

    setGoalsLoading(true);
    try {
      const response = await fetchGoals();
      setGoals(response?.goals ?? []);
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С†РµР»Рё', 'error');
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!periodModalOpen) return;
    loadPeriods();
  }, [loadPeriods, periodModalOpen]);

  useEffect(() => {
    if (!goalModalOpen) return;
    loadGoalPeriodsOptions();
    loadGoals();
  }, [goalModalOpen, loadGoalPeriodsOptions, loadGoals]);

  const totalPagesSafe = Math.max(1, Number(pageMeta.totalPages) || 0);
  const currentPageSafe = Math.min(pageNumber, totalPagesSafe - 1);

  const handleToggleBlockUser = useCallback(async (user) => {
    const ldapId = String(user?.ldapId ?? '').trim();
    if (!ldapId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ ldapId РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ', 'error');
      return;
    }

    setProcessingLdapId(ldapId);
    try {
      if (user.blocked) {
        await unblockUserByLdapId(ldapId);
        showToast(`РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ ${ldapId} СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°РЅ`, 'success');
      } else {
        await blockUserByLdapId(ldapId);
        showToast(`РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ ${ldapId} Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ`, 'success');
      }
      await loadUsers();
    } catch (error) {
      showToast(
        error.message || (user.blocked
          ? 'РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ'
          : 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ'),
        'error',
      );
    } finally {
      setProcessingLdapId('');
    }
  }, [loadUsers, showToast]);

  const handleOpenPeriodModal = useCallback(() => {
    setPeriodModalOpen(true);
  }, []);

  const handleClosePeriodModal = useCallback(() => {
    setPeriodModalOpen(false);
    setPeriodForm(getDefaultPeriodForm());
    setEditingPeriodName('');
    setProcessingPeriodName('');
    setPeriodEditForm({ startDate: '', endDate: '' });
  }, []);

  const handlePeriodFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setPeriodForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCreatePeriod = useCallback(async (event) => {
    event.preventDefault();

    const name = String(periodForm.name ?? '').trim();
    const startDate = String(periodForm.startDate ?? '').trim();
    const endDate = String(periodForm.endDate ?? '').trim();

    if (!name) {
      showToast('Р’РІРµРґРёС‚Рµ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (!startDate || !endDate) {
      showToast('РЈРєР°Р¶РёС‚Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р° Рё РѕРєРѕРЅС‡Р°РЅРёСЏ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (startDate > endDate) {
      showToast('Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р°', 'error');
      return;
    }

    if (periodSubmitting) return;

    setPeriodSubmitting(true);
    try {
      await createStudyPeriod({ name, startDate, endDate });
      showToast('РџРµСЂРёРѕРґ СѓСЃРїРµС€РЅРѕ СЃРѕР·РґР°РЅ', 'success');
      setPeriodForm(getDefaultPeriodForm());
      await loadPeriods();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РїРµСЂРёРѕРґ', 'error');
    } finally {
      setPeriodSubmitting(false);
    }
  }, [loadPeriods, periodForm, periodSubmitting, showToast]);

  const handleStartEditPeriod = useCallback((period) => {
    const periodName = normalizePeriodName(period?.name);
    if (!hasPeriodName(periodName)) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    setEditingPeriodName(periodName);
    setPeriodEditForm({
      startDate: String(period?.startDate ?? '').trim(),
      endDate: String(period?.endDate ?? '').trim(),
    });
  }, [showToast]);

  const handleCancelEditPeriod = useCallback(() => {
    setEditingPeriodName('');
    setPeriodEditForm({ startDate: '', endDate: '' });
  }, []);

  const handlePeriodEditFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setPeriodEditForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSavePeriodEdit = useCallback(async () => {

    const periodName = normalizePeriodName(editingPeriodName);
    const startDate = String(periodEditForm.startDate ?? '').trim();
    const endDate = String(periodEditForm.endDate ?? '').trim();

    if (!hasPeriodName(periodName)) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (!startDate || !endDate) {
      showToast('РЈРєР°Р¶РёС‚Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р° Рё РѕРєРѕРЅС‡Р°РЅРёСЏ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (startDate > endDate) {
      showToast('Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ РЅР°С‡Р°Р»Р°', 'error');
      return;
    }

    if (processingPeriodName === periodName) return;

    setProcessingPeriodName(periodName);
    try {
      await updateStudyPeriod(periodName, { startDate, endDate });
      showToast(`РџРµСЂРёРѕРґ "${periodName}" РѕР±РЅРѕРІР»РµРЅ`, 'success');
      setEditingPeriodName('');
      setPeriodEditForm({ startDate: '', endDate: '' });
      await loadPeriods();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РїРµСЂРёРѕРґ', 'error');
    } finally {
      setProcessingPeriodName('');
    }
  }, [editingPeriodName, loadPeriods, periodEditForm, processingPeriodName, showToast]);

  const handleArchivePeriod = useCallback(async (periodNameRaw) => {

    const periodName = normalizePeriodName(periodNameRaw);
    if (!hasPeriodName(periodName)) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (processingPeriodName === periodName) return;

    setProcessingPeriodName(periodName);
    try {
      const resolvedPeriod = await fetchStudyPeriodByName(periodName);
      const resolvedName = resolvePeriodNameFromPayload(resolvedPeriod, periodName);
      await archiveStudyPeriod(resolvedName);
      showToast(`РџРµСЂРёРѕРґ "${resolvedName}" РїРµСЂРµРІРµРґРµРЅ РІ Р°СЂС…РёРІ`, 'success');
      await loadPeriods();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРµСЂРµРІРµСЃС‚Рё РїРµСЂРёРѕРґ РІ Р°СЂС…РёРІ', 'error');
    } finally {
      setProcessingPeriodName('');
    }
  }, [loadPeriods, processingPeriodName, showToast]);

  const handleActivatePeriod = useCallback(async (periodNameRaw) => {

    const periodName = normalizePeriodName(periodNameRaw);
    if (!hasPeriodName(periodName)) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (processingPeriodName === periodName) return;

    setProcessingPeriodName(periodName);
    try {
      const resolvedPeriod = await fetchStudyPeriodByName(periodName);
      const resolvedName = resolvePeriodNameFromPayload(resolvedPeriod, periodName);
      await activateStudyPeriod(resolvedName);
      showToast(`РџРµСЂРёРѕРґ "${resolvedName}" Р°РєС‚РёРІРёСЂРѕРІР°РЅ`, 'success');
      await loadPeriods();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р°РєС‚РёРІРёСЂРѕРІР°С‚СЊ РїРµСЂРёРѕРґ', 'error');
    } finally {
      setProcessingPeriodName('');
    }
  }, [loadPeriods, processingPeriodName, showToast]);

  const handleDeletePeriod = useCallback(async (periodNameRaw) => {

    const periodName = normalizePeriodName(periodNameRaw);
    if (!hasPeriodName(periodName)) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°', 'error');
      return;
    }

    if (!window.confirm(`РЈРґР°Р»РёС‚СЊ РїРµСЂРёРѕРґ "${periodName}"?`)) return;
    if (processingPeriodName === periodName) return;

    setProcessingPeriodName(periodName);
    try {
      const resolvedPeriod = await fetchStudyPeriodByName(periodName);
      const resolvedName = resolvePeriodNameFromPayload(resolvedPeriod, periodName);
      await deleteStudyPeriod(resolvedName);
      showToast(`РџРµСЂРёРѕРґ "${resolvedName}" СѓРґР°Р»РµРЅ`, 'success');

      if (editingPeriodName === periodName || editingPeriodName === resolvedName) {
        setEditingPeriodName('');
        setPeriodEditForm({ startDate: '', endDate: '' });
      }

      await loadPeriods();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїРµСЂРёРѕРґ', 'error');
    } finally {
      setProcessingPeriodName('');
    }
  }, [editingPeriodName, loadPeriods, processingPeriodName, showToast]);

  const handleOpenGoalModal = useCallback(() => {
    setGoalModalOpen(true);
  }, []);

  const handleCloseGoalModal = useCallback(() => {
    setGoalModalOpen(false);
    setGoalForm(getDefaultGoalForm());
    setSelectedGoalDetails(null);
    setLoadingGoalPublicId('');
  }, []);

  const handleGoalFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setGoalForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateGoal = useCallback(async (event) => {
    event.preventDefault();

    const periodName = String(goalForm.periodName ?? '').trim();
    const course = Number(goalForm.course);
    const targetPoints = Number(goalForm.targetPoints);

    if (!periodName) {
      showToast('Р’С‹Р±РµСЂРёС‚Рµ РїРµСЂРёРѕРґ РґР»СЏ С†РµР»Рё', 'error');
      return;
    }
    if (!Number.isInteger(course) || course <= 0) {
      showToast('РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ РЅРѕРјРµСЂ РєСѓСЂСЃР°', 'error');
      return;
    }
    if (!Number.isFinite(targetPoints) || targetPoints <= 0) {
      showToast('РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ Р±Р°Р»Р»РѕРІ', 'error');
      return;
    }

    if (goalSubmitting) return;

    setGoalSubmitting(true);
    try {
      const createdGoal = await createGoal({
        periodName,
        course,
        targetPoints,
      });
      showToast(`Р¦РµР»СЊ РґР»СЏ ${course} РєСѓСЂСЃР° СЃРѕР·РґР°РЅР°`, 'success');
      setGoalForm((prev) => ({
        ...prev,
        targetPoints: '',
      }));
      setSelectedGoalDetails(createdGoal);
      await loadGoals();
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ С†РµР»СЊ', 'error');
    } finally {
      setGoalSubmitting(false);
    }
  }, [goalForm, goalSubmitting, loadGoals, showToast]);

  const handleOpenGoalDetails = useCallback(async (publicIdRaw) => {

    const publicId = String(publicIdRaw ?? '').trim();
    if (!publicId) {
      showToast('РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ publicId С†РµР»Рё', 'error');
      return;
    }

    if (loadingGoalPublicId === publicId) return;

    setLoadingGoalPublicId(publicId);
    try {
      const details = await fetchGoalByPublicId(publicId);
      setSelectedGoalDetails(details);
    } catch (error) {
      showToast(error.message || 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ С†РµР»СЊ РїРѕ publicId', 'error');
    } finally {
      setLoadingGoalPublicId('');
    }
  }, [loadingGoalPublicId, showToast]);

  return (
    <div className={styles.appContainer}>
      <AppSidebar activePage="users" logoSrc={Logo} brandName="it-college" />

      <main className={styles.mainContent}>
        <section className={styles.headerCard}>
          <div>
            <h1 className={styles.title}>РЎРѕР·РґР°РЅРёРµ РїРµСЂРёРѕРґР° Рё С†РµР»РµР№</h1>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.periodActionButton} onClick={handleOpenPeriodModal}>
              РЎРѕР·РґР°С‚СЊ РїРµСЂРёРѕРґ
            </button>
            <button type="button" className={styles.goalActionButton} onClick={handleOpenGoalModal}>
              Р¦РµР»Рё РїРѕ РєСѓСЂСЃР°Рј
            </button>
          </div>
        </section>

        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>РЎРїРёСЃРѕРє РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№</h2>
            <span>Р’СЃРµРіРѕ: {pageMeta.totalElements}</span>
          </div>

          {loading ? (
            <p className={styles.stateText}>Р—Р°РіСЂСѓР·РєР° РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№...</p>
          ) : users.length === 0 ? (
            <p className={styles.stateText}>РџРѕР»СЊР·РѕРІР°С‚РµР»Рё РЅРµ РЅР°Р№РґРµРЅС‹.</p>
          ) : (
            <div className={styles.usersList}>
              {users.map((user) => {
                const ldapId = String(user.ldapId ?? '').trim();
                const isBlocked = Boolean(user.blocked);
                const isProcessing = processingLdapId === ldapId;

                return (
                  <article key={ldapId || user.login || getUserDisplayName(user)} className={styles.userCard}>
                    <div className={styles.userMain}>
                      <div className={styles.userNameRow}>
                        <h3 className={styles.userName}>{getUserDisplayName(user)}</h3>
                        <span className={`${styles.statusBadge} ${isBlocked ? styles.blocked : styles.active}`}>
                          {isBlocked ? 'Р—Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ' : 'РђРєС‚РёРІРµРЅ'}
                        </span>
                      </div>

                      <div className={styles.userMeta}>
                        <span><strong>ldapId:</strong> {ldapId || 'вЂ”'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`${isBlocked ? styles.unblockButton : styles.blockButton} ${isProcessing || !ldapId ? styles.disabledButton : ''}`}
                      disabled={isProcessing || !ldapId}
                      onClick={() => handleToggleBlockUser(user)}
                    >
                      {isProcessing
                        ? (isBlocked ? 'Р Р°Р·Р±Р»РѕРєРёСЂСѓРµРј...' : 'Р‘Р»РѕРєРёСЂСѓРµРј...')
                        : (isBlocked ? 'Р Р°Р·Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ' : 'Р—Р°Р±Р»РѕРєРёСЂРѕРІР°С‚СЊ')}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={loading || currentPageSafe <= 0}
              onClick={() => setPageNumber((prev) => Math.max(0, prev - 1))}
            >
              РќР°Р·Р°Рґ
            </button>
            <span className={styles.paginationSummary}>
              РЎС‚СЂР°РЅРёС†Р° {currentPageSafe + 1} РёР· {totalPagesSafe}
            </span>
            <button
              type="button"
              className={styles.paginationButton}
              disabled={loading || currentPageSafe >= totalPagesSafe - 1 || pageMeta.totalElements === 0}
              onClick={() => setPageNumber((prev) => prev + 1)}
            >
              Р’РїРµСЂРµРґ
            </button>
          </div>
        </section>
      </main>

      {periodModalOpen && (
        <div
          className={styles.periodModalOverlay}
          role="presentation"
          onClick={handleClosePeriodModal}
        >
          <div
            className={styles.periodModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-period-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.periodModalHeader}>
              <h2 id="create-period-modal-title">РЎРѕР·РґР°РЅРёРµ РїРµСЂРёРѕРґР°</h2>
              <button
                type="button"
                className={styles.periodModalClose}
                onClick={handleClosePeriodModal}
                aria-label="Р—Р°РєСЂС‹С‚СЊ"
              >
                x
              </button>
            </div>

            <form className={styles.periodForm} onSubmit={handleCreatePeriod}>
              <label className={styles.periodLabel}>
                РќР°Р·РІР°РЅРёРµ РїРµСЂРёРѕРґР°
                <input
                  className={styles.periodInput}
                  type="text"
                  name="name"
                  placeholder="РќР°РїСЂРёРјРµСЂ: РњР°Р№ 2026"
                  value={periodForm.name}
                  onChange={handlePeriodFormChange}
                  required
                />
              </label>

              <div className={styles.periodDateRow}>
                <label className={styles.periodLabel}>
                  Р”Р°С‚Р° РЅР°С‡Р°Р»Р°
                  <input
                    className={styles.periodInput}
                    type="date"
                    name="startDate"
                    value={periodForm.startDate}
                    onChange={handlePeriodFormChange}
                    required
                  />
                </label>

                <label className={styles.periodLabel}>
                  Р”Р°С‚Р° РѕРєРѕРЅС‡Р°РЅРёСЏ
                  <input
                    className={styles.periodInput}
                    type="date"
                    name="endDate"
                    value={periodForm.endDate}
                    onChange={handlePeriodFormChange}
                    required
                  />
                </label>
              </div>

              <div className={styles.periodFormActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleClosePeriodModal}>
                  РћС‚РјРµРЅР°
                </button>
                <button
                  type="submit"
                  className={styles.filterButton}
                  disabled={periodSubmitting}
                >
                  {periodSubmitting ? 'РЎРѕС…СЂР°РЅСЏРµРј...' : 'РЎРѕР·РґР°С‚СЊ РїРµСЂРёРѕРґ'}
                </button>
              </div>
            </form>

            <div className={styles.periodsSection}>
              <div className={styles.periodsHeader}>
                <h3>РЎРїРёСЃРѕРє РїРµСЂРёРѕРґРѕРІ</h3>
                <span>Р’СЃРµРіРѕ: {periods.length}</span>
              </div>

              {periodsLoading ? (
                <p className={styles.stateText}>Р—Р°РіСЂСѓР·РєР° РїРµСЂРёРѕРґРѕРІ...</p>
              ) : periods.length === 0 ? (
                <p className={styles.stateText}>РџРµСЂРёРѕРґС‹ РїРѕРєР° РЅРµ СЃРѕР·РґР°РЅС‹.</p>
              ) : (
                <div className={styles.periodsList}>
                  {periods.map((period) => {
                    const periodName = normalizePeriodName(period.name);
                    const periodKey = `${periodName}-${period.startDate}-${period.endDate}`;
                    const statusMeta = getPeriodStatusMeta(period.status);
                    const normalizedStatus = String(period.status ?? '').trim().toUpperCase();
                    const isActivePeriod = normalizedStatus === 'ACTIVE';
                    const isEditing = editingPeriodName === periodName;
                    const isProcessing = processingPeriodName === periodName;

                    return (
                      <article key={periodKey} className={styles.periodRow}>
                        <div className={styles.periodMain}>
                          <div className={styles.periodTopRow}>
                            <h4 className={styles.periodName}>{periodName || 'Р‘РµР· РЅР°Р·РІР°РЅРёСЏ'}</h4>
                            <span className={`${styles.periodStatus} ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className={styles.periodEditForm}>
                              <input
                                className={styles.periodInput}
                                type="date"
                                name="startDate"
                                value={periodEditForm.startDate}
                                onChange={handlePeriodEditFormChange}
                                disabled={isProcessing}
                              />
                              <input
                                className={styles.periodInput}
                                type="date"
                                name="endDate"
                                value={periodEditForm.endDate}
                                onChange={handlePeriodEditFormChange}
                                disabled={isProcessing}
                              />
                              <button
                                type="button"
                                className={styles.periodControlButton}
                                disabled={isProcessing}
                                onClick={handleSavePeriodEdit}
                              >
                                {isProcessing ? 'РЎРѕС…СЂР°РЅСЏРµРј...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
                              </button>
                              <button
                                type="button"
                                className={styles.periodControlButtonSecondary}
                                disabled={isProcessing}
                                onClick={handleCancelEditPeriod}
                              >
                                РћС‚РјРµРЅР°
                              </button>
                            </div>
                          ) : (
                            <p className={styles.periodDates}>
                              {formatPeriodDate(period.startDate)} - {formatPeriodDate(period.endDate)}
                            </p>
                          )}
                        </div>

                        <div className={styles.periodControls}>
                          <button
                            type="button"
                            className={styles.periodControlButtonSecondary}
                            disabled={isProcessing || isEditing || !hasPeriodName(periodName)}
                            onClick={() => handleStartEditPeriod(period)}
                          >
                            РР·РјРµРЅРёС‚СЊ
                          </button>
                          {isActivePeriod ? (
                            <button
                              type="button"
                              className={styles.periodControlButton}
                              disabled={isProcessing || isEditing || !hasPeriodName(periodName)}
                              onClick={() => handleArchivePeriod(periodName)}
                            >
                              {isProcessing ? 'РћР±РЅРѕРІР»СЏРµРј...' : 'Р’ Р°СЂС…РёРІ'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.periodControlButton}
                              disabled={isProcessing || isEditing || !hasPeriodName(periodName)}
                              onClick={() => handleActivatePeriod(periodName)}
                            >
                              {isProcessing ? 'РћР±РЅРѕРІР»СЏРµРј...' : 'РђРєС‚РёРІРёСЂРѕРІР°С‚СЊ'}
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.periodControlButtonDanger}
                            disabled={isProcessing || !hasPeriodName(periodName)}
                            onClick={() => handleDeletePeriod(periodName)}
                          >
                            {isProcessing ? 'РЈРґР°Р»СЏРµРј...' : 'РЈРґР°Р»РёС‚СЊ'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {goalModalOpen && (
        <div
          className={styles.goalModalOverlay}
          role="presentation"
          onClick={handleCloseGoalModal}
        >
          <div
            className={styles.goalModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-goal-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.goalModalHeader}>
              <h2 id="create-goal-modal-title">Р¦РµР»Рё РїРѕ Р±Р°Р»Р»Р°Рј</h2>
              <button
                type="button"
                className={styles.goalModalClose}
                onClick={handleCloseGoalModal}
                aria-label="Р—Р°РєСЂС‹С‚СЊ"
              >
                x
              </button>
            </div>

            <form className={styles.goalForm} onSubmit={handleCreateGoal}>
              <label className={styles.goalLabel}>
                РџРµСЂРёРѕРґ
                <select
                  className={styles.goalInput}
                  name="periodName"
                  value={goalForm.periodName}
                  onChange={handleGoalFormChange}
                  required
                >
                  <option value="">Р’С‹Р±РµСЂРёС‚Рµ РїРµСЂРёРѕРґ</option>
                  {goalPeriodsOptions.map((periodName) => (
                    <option key={`goal-period-form-${periodName}`} value={periodName}>
                      {periodName}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.goalCreateRow}>
                <label className={styles.goalLabel}>
                  РљСѓСЂСЃ
                  <select
                    className={styles.goalInput}
                    name="course"
                    value={goalForm.course}
                    onChange={handleGoalFormChange}
                    required
                  >
                    <option value="1">1 РєСѓСЂСЃ</option>
                    <option value="2">2 РєСѓСЂСЃ</option>
                    <option value="3">3 РєСѓСЂСЃ</option>
                    <option value="4">4 РєСѓСЂСЃ</option>
                  </select>
                </label>

                <label className={styles.goalLabel}>
                  Р¦РµР»СЊ РІ Р±Р°Р»Р»Р°С…
                  <input
                    className={styles.goalInput}
                    type="number"
                    name="targetPoints"
                    min="1"
                    value={goalForm.targetPoints}
                    onChange={handleGoalFormChange}
                    placeholder="РќР°РїСЂРёРјРµСЂ: 120"
                    required
                  />
                </label>
              </div>

              <div className={styles.goalFormActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleCloseGoalModal}>
                  РћС‚РјРµРЅР°
                </button>
                <button type="submit" className={styles.filterButton} disabled={goalSubmitting}>
                  {goalSubmitting ? 'РЎРѕС…СЂР°РЅСЏРµРј...' : 'РЎРѕР·РґР°С‚СЊ С†РµР»СЊ'}
                </button>
              </div>
            </form>

            <section className={styles.goalsSection}>
              <div className={styles.goalsHeader}>
                <h3>РЎРїРёСЃРѕРє С†РµР»РµР№</h3>
                <span>Р’СЃРµРіРѕ: {goals.length}</span>
              </div>

              {goalsLoading ? (
                <p className={styles.stateText}>Р—Р°РіСЂСѓР·РєР° С†РµР»РµР№...</p>
              ) : goals.length === 0 ? (
                <p className={styles.stateText}>Р¦РµР»Рё РїРѕРєР° РЅРµ СЃРѕР·РґР°РЅС‹.</p>
              ) : (
                <div className={styles.goalsList}>
                  {goals.map((goal) => {
                    const goalStatusMeta = getGoalStatusMeta(goal.periodStatus);
                    const publicId = String(goal.publicId ?? '').trim();
                    const isLoadingDetails = loadingGoalPublicId === publicId;

                    return (
                      <article key={publicId || `${goal.periodName}-${goal.courseNumber}`} className={styles.goalRow}>
                        <div className={styles.goalMain}>
                          <h4 className={styles.goalTitle}>
                            {goal.periodName || 'РџРµСЂРёРѕРґ РЅРµ СѓРєР°Р·Р°РЅ'} - {goal.courseNumber || 'вЂ”'} РєСѓСЂСЃ
                          </h4>
                          <p className={styles.goalMeta}>
                            Р¦РµР»СЊ: {goal.targetPoints || 0} Р±Р°Р»Р»РѕРІ
                          </p>
                        </div>
                        <div className={styles.goalActions}>
                          <span className={`${styles.goalStatus} ${goalStatusMeta.className}`}>
                            {goalStatusMeta.label}
                          </span>
                          <button
                            type="button"
                            className={styles.goalDetailsButton}
                            disabled={!publicId || isLoadingDetails}
                            onClick={() => handleOpenGoalDetails(publicId)}
                          >
                            {isLoadingDetails ? 'Р—Р°РіСЂСѓР·РєР°...' : 'РџРѕ publicId'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {selectedGoalDetails && (
                <div className={styles.goalDetailsCard}>
                  <h4>Р”РµС‚Р°Р»Рё С†РµР»Рё</h4>
                  <div className={styles.goalDetailsGrid}>
                    <span><strong>publicId:</strong> {selectedGoalDetails.publicId || 'вЂ”'}</span>
                    <span><strong>РџРµСЂРёРѕРґ:</strong> {selectedGoalDetails.periodName || 'вЂ”'}</span>
                    <span><strong>РЎС‚Р°С‚СѓСЃ РїРµСЂРёРѕРґР°:</strong> {selectedGoalDetails.periodStatus || 'вЂ”'}</span>
                    <span><strong>РљСѓСЂСЃ:</strong> {selectedGoalDetails.courseNumber || 'вЂ”'}</span>
                    <span><strong>Р¦РµР»СЊ РїРѕ Р±Р°Р»Р»Р°Рј:</strong> {selectedGoalDetails.targetPoints || 0}</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default UsersPage;


