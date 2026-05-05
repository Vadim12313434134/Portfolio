import FiltersSection from './FiltersSection';
import EventsGrid from './EventsGrid';
import ApplicationsSection from './ApplicationsSection';

const MainPageEventsSection = ({
  filtersSectionProps,
  eventsGridProps,
  showApplications = false,
  userApplications = [],
  getStatusInfo,
}) => (
  <>
    <FiltersSection {...filtersSectionProps} />

    <EventsGrid {...eventsGridProps} />

    {showApplications && (
      <ApplicationsSection userApplications={userApplications} getStatusInfo={getStatusInfo} />
    )}
  </>
);

export default MainPageEventsSection;
