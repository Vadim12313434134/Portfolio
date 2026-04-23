import React, { useState } from 'react';
import styles from './SliderStyle.module.css';
import { getDirectionLabel } from '../../../api/backendApi';

const Slider = ({ events, onRegister, isAdmin = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (events.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className={styles.sliderSection}>
      <h2>Ближайшие мероприятия:</h2>
      <div className={styles.sliderContainer}>
        <button className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`} onClick={prevSlide}>
          ‹
        </button>

        <div className={styles.sliderWrapper}>
          <div
            className={styles.sliderTrack}
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {events.map((event) => (
              <div key={event.reactKey || event.id} className={styles.slideCard}>
                <div className={styles.slideContent}>
                  <div className={styles.slideHeader}>
                    <h3 className={styles.slideTitle}>{event.title}</h3>
                    <span className={styles.slidePointsBadge}>+{event.points} баллов</span>
                  </div>

                  <div className={styles.slideDetails}>
                    <div className={styles.slideDetail}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>{event.displayDate || event.date || 'Дата не указана'}</span>
                    </div>
                    <div className={styles.slideDetail}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
                        <circle cx="12" cy="9" r="3"></circle>
                      </svg>
                      <span>{event.displayLocation || event.location || 'Место не указано'}</span>
                    </div>
                    <div className={styles.slideDetail}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16"></path>
                        <path d="M4 12h16"></path>
                        <path d="M4 17h10"></path>
                      </svg>
                      <span>{event.displayDirection || getDirectionLabel(event.direction)}</span>
                    </div>
                  </div>

                  <div className={styles.slideTeacher}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{event.teacher}</span>
                  </div>

                  <p className={styles.slideDescription}>{event.description}</p>

                  {!isAdmin && event.isRegistered && (
                    <div className={`${styles.slideStatus} ${styles.statusPending}`}>
                      <span>✓</span>
                      <span>Вы записаны на мероприятие</span>
                    </div>
                  )}

                  {!isAdmin && (
                    <button
                      className={`${styles.slideRegisterBtn} ${event.isRegistered ? styles.slideRegisteredBtn : ''}`}
                      onClick={() => onRegister(event.eventPublicId || event.publicId || event.id, event.title)}
                    >
                      {event.isRegistered ? 'Отменить запись' : 'Записаться'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={`${styles.sliderArrow} ${styles.sliderArrowRight}`} onClick={nextSlide}>
          ›
        </button>
      </div>

      <div className={styles.sliderDots}>
        {events.map((_, index) => (
          <button
            key={index}
            className={`${styles.sliderDot} ${currentSlide === index ? styles.sliderDotActive : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
