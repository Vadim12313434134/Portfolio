import { useState } from 'react';
import styles from '../MainPageStyle.module.css';

const AdminCreateEventModal = ({
  isTeacher,
  adminCreateFormOpen,
  onClose,
  newEventData,
  onChange,
  onSubmit,
  mode = 'create',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isTeacher || !adminCreateFormOpen) return null;

  const formatToEventDateTime = (dateString) => {
    if (!dateString) return '';
    return dateString.length === 16 ? `${dateString}:00` : dateString;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        title: newEventData.title,
        description: newEventData.description,
        eventDateTime: formatToEventDateTime(newEventData.date),
        location: newEventData.location?.trim() || '',
        maxPoints: Number(newEventData.maxPoints),
        direction: newEventData.direction,
        course: Number(newEventData.course),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.adminModalOverlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.adminModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-create-event-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.adminModalHeader}>
          <h2 id="admin-create-event-title" className={styles.adminModalTitle}>
            {mode === 'edit' ? 'Редактировать мероприятие' : 'Новое мероприятие'}
          </h2>
          <button
            type="button"
            className={styles.adminModalClose}
            onClick={onClose}
            aria-label="Закрыть"
          >
            x
          </button>
        </div>

        <form className={styles.adminForm} onSubmit={handleFormSubmit}>
          <input
            className={styles.adminInput}
            type="text"
            name="title"
            placeholder="Название мероприятия"
            value={newEventData.title || ''}
            onChange={onChange}
            required
          />

          <label className={styles.adminFieldLabel} htmlFor="event-datetime">
            Дата и время
          </label>
          <input
            className={styles.adminInput}
            type="datetime-local"
            id="event-datetime"
            name="date"
            value={newEventData.date || ''}
            onChange={onChange}
            required
          />
          <p className={styles.adminFieldHint}>
            В календаре справа выбирается колонка «Время».
          </p>

          <input
            className={styles.adminInput}
            type="text"
            name="location"
            placeholder="Локация"
            value={newEventData.location || ''}
            onChange={onChange}
            required
          />

          <input
            className={styles.adminInput}
            type="number"
            name="maxPoints"
            placeholder="Максимальное количество баллов"
            value={newEventData.maxPoints || ''}
            onChange={onChange}
            min="1"
            required
          />

          <select
            className={styles.adminInput}
            name="direction"
            value={newEventData.direction || ''}
            onChange={onChange}
            required
          >
            <option value="">Выберите направление</option>
            <option value="BACKEND">Backend-разработка</option>
            <option value="FRONTEND">Frontend-разработка</option>
            <option value="SYSTEM_ADMIN">Системное администрирование</option>
            <option value="DESIGNER">Дизайн</option>
            <option value="ENGLISH">Английский язык</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="INDEFINITE">Не определено</option>
          </select>

          <select
            className={styles.adminInput}
            name="course"
            value={newEventData.course || ''}
            onChange={onChange}
            required
          >
            <option value="">Выберите курс</option>
            <option value="1">1 курс</option>
            <option value="2">2 курс</option>
            <option value="3">3 курс</option>
            <option value="4">4 курс</option>
          </select>

          <textarea
            className={`${styles.adminInput} ${styles.adminTextarea}`}
            name="description"
            placeholder="Описание мероприятия"
            value={newEventData.description || ''}
            onChange={onChange}
            required
          />

          <button
            type="submit"
            className={styles.adminSubmitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (mode === 'edit' ? 'Сохранение...' : 'Создание...')
              : (mode === 'edit' ? 'Сохранить' : 'Создать мероприятие')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateEventModal;
