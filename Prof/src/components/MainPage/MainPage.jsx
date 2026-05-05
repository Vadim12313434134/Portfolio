import { useRef, useCallback } from 'react';
import styles from './MainPageStyle.module.css';
import Logo from './png/Logo.png';
import Slider from './Slider/Slider';
import AppSidebar from '../Common/AppSidebar';
import AdminCreateEventModal from './components/AdminCreateEventModal';
import MainPageStudentView from './components/MainPageStudentView';
import MainPageTeacherView from './components/MainPageTeacherView';
import Toast from './components/Toast';
import useMainPageData from './hooks/useMainPageData';

const MainPage = () => {
  const mainContentRef = useRef(null);

  const scrollToTop = useCallback(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const {
    goal,
    hasTargetGoal,
    progressPeriodName,
    goalReached,
    toast,
    isTeacherOrAdmin,
    userPoints,
    periodPoints,
    remainingPoints,
    progressPercent,
    sliderEvents,
    filters,
    eventsSection,
    adminModal,
  } = useMainPageData({ onScrollToTop: scrollToTop });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'DRAFT':
        return { text: 'Черновик', className: styles.statusDraft, icon: '○' };
      case 'PUBLISHED':
        return { text: 'Опубликовано', className: styles.statusPublished, icon: '✓' };
      case 'FINISHED':
        return { text: 'Завершено', className: styles.statusFinished, icon: '■' };
      case 'CANCELLED':
        return { text: 'Отменено', className: styles.statusCancelled, icon: '×' };
      case 'pending':
        return { text: 'На проверке', className: styles.statusPending, icon: '⏳' };
      case 'approved':
        return { text: 'Одобрено', className: styles.statusApproved, icon: '✓' };
      case 'rejected':
        return { text: 'Отклонено', className: styles.statusRejected, icon: '✕' };
      case 'draft':
        return { text: 'Черновик отчета', className: styles.statusDraft, icon: '○' };
      case 'submitted':
        return { text: 'Отчет на проверке', className: styles.statusPending, icon: '⏳' };
      case 'accepted':
        return { text: 'Отчет принят', className: styles.statusApproved, icon: '✓' };
      case 'refused':
        return { text: 'Отчет отклонен', className: styles.statusRejected, icon: '✕' };
      default:
        return null;
    }
  };

  const filtersSectionProps = {
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    selectedDirection: filters.selectedDirection,
    setSelectedDirection: filters.setSelectedDirection,
    selectedCourse: filters.selectedCourse,
    setSelectedCourse: filters.setSelectedCourse,
    selectedDate: filters.selectedDate,
    setSelectedDate: filters.setSelectedDate,
    directions: filters.directions,
    courses: filters.courses,
    clearFilters: filters.clearFilters,
  };

  const eventsGridProps = {
    filteredEvents: eventsSection.visibleEvents,
    eventsCount: eventsSection.eventsCount,
    getStatusInfo,
    handleRegisterWithToast: eventsSection.handleRegisterWithToast,
    scrollToTop,
    isAdmin: isTeacherOrAdmin,
    onEditEvent: eventsSection.handleOpenEditForm,
    onPublishEvent: eventsSection.handlePublishEvent,
    onFinishEvent: eventsSection.handleFinishEvent,
    onCancelEvent: eventsSection.handleCancelEvent,
    onDeleteEvent: eventsSection.handleDeleteEvent,
    canManageEvent: eventsSection.canManageEvent,
    viewMode: eventsSection.viewMode,
    onViewModeChange: eventsSection.setViewMode,
    currentPage: eventsSection.currentPage,
    totalPages: eventsSection.totalPages,
    pageSize: eventsSection.pageSize,
    onPageChange: eventsSection.handlePageChange,
  };

  return (
    <div className={styles.appContainer}>
      <AppSidebar activePage="main" logoSrc={Logo} brandName="it-college" />

      <main ref={mainContentRef} className={styles.mainContent}>
        <div className={styles.headerActions}></div>

        <Slider
          events={sliderEvents}
          onRegister={eventsSection.handleRegisterWithToast}
          isAdmin={isTeacherOrAdmin}
        />

        {isTeacherOrAdmin ? (
          <MainPageTeacherView
            onOpenCreateForm={adminModal.onOpen}
            onDownloadEventsTemplate={eventsSection.handleDownloadEventsTemplate}
            onImportEventsCsv={eventsSection.handleImportEventsCsv}
            filtersSectionProps={filtersSectionProps}
            eventsGridProps={eventsGridProps}
            getStatusInfo={getStatusInfo}
          />
        ) : (
          <MainPageStudentView
            userPoints={userPoints}
            periodPoints={periodPoints}
            goal={goal}
            hasTargetGoal={hasTargetGoal}
            periodName={progressPeriodName}
            goalReached={goalReached}
            remainingPoints={remainingPoints}
            progressPercent={progressPercent}
            filtersSectionProps={filtersSectionProps}
            eventsGridProps={eventsGridProps}
          />
        )}
      </main>

      <AdminCreateEventModal
        isTeacher={adminModal.isTeacher}
        adminCreateFormOpen={adminModal.adminCreateFormOpen}
        onClose={adminModal.onClose}
        newEventData={adminModal.newEventData}
        onChange={adminModal.onChange}
        onSubmit={adminModal.onSubmit}
        mode={adminModal.mode}
      />

      <Toast toast={toast} />
    </div>
  );
};

export default MainPage;
