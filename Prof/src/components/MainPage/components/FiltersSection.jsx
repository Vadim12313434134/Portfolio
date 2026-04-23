import styles from '../MainPageStyle.module.css';
import { getDirectionLabel } from '../../../api/backendApi';

const FiltersSection = ({
  searchTerm,
  setSearchTerm,
  selectedDirection,
  setSelectedDirection,
  selectedCourse,
  setSelectedCourse,
  selectedDate,
  setSelectedDate,
  directions,
  courses,
  clearFilters,
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedDirection !== 'all' ||
    selectedCourse !== 'all' ||
    selectedDate !== '';

  return (
    <div className={styles.searchFilterSection}>
      <div className={styles.searchBar}>
        <svg
          className={styles.searchIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Поиск по названию, описанию, преподавателю..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filters}>
        <select
          value={selectedDirection}
          onChange={(e) => setSelectedDirection(e.target.value)}
          className={styles.filterSelect}
        >
          {directions.map((dir) => (
            <option key={dir} value={dir}>
              {dir === 'all' ? 'Все направления' : getDirectionLabel(dir)}
            </option>
          ))}
        </select>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className={styles.filterSelect}
        >
          {courses.map((course) => (
            <option key={course} value={course}>
              {course === 'all' ? 'Все курсы' : `${course} курс`}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.filterSelect}
          aria-label="Фильтр по дате мероприятия"
        />

        {hasActiveFilters && (
          <button onClick={clearFilters} className={styles.clearFiltersBtn}>
            ✕ Сбросить
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltersSection;
