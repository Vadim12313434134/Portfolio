import { useEffect, useRef, useState } from 'react'
import { imageUrl } from '../config'
import './ImageSlider.css'

export default function ImageSlider({
  images = [],
  alt = '',
  large = false,
  stopPropagation = false,
}) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(null)

  useEffect(() => {
    setIndex(0)
  }, [images])

  if (!images.length) {
    return <div className={`slider slider--empty ${large ? 'slider--large' : ''}`} />
  }

  const go = (dir, e) => {
    if (stopPropagation && e) e.stopPropagation()
    if (e) e.preventDefault()
    setIndex((prev) => (prev + dir + images.length) % images.length)
  }

  const goTo = (i, e) => {
    if (stopPropagation && e) e.stopPropagation()
    if (e) e.preventDefault()
    setIndex(i)
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (stopPropagation) e.stopPropagation()
    setIndex((prev) =>
      delta < 0
        ? (prev + 1) % images.length
        : (prev - 1 + images.length) % images.length
    )
  }

  return (
    <div
      className={`slider ${large ? 'slider--large' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((img, i) => (
          <div className="slider__slide" key={`${img}-${i}`}>
            <img
              src={imageUrl(img)}
              alt={`${alt} ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="slider__nav slider__nav--prev"
            aria-label="Предыдущее фото"
            onClick={(e) => go(-1, e)}
          >
            ‹
          </button>
          <button
            type="button"
            className="slider__nav slider__nav--next"
            aria-label="Следующее фото"
            onClick={(e) => go(1, e)}
          >
            ›
          </button>
          <div className="slider__dots">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`slider__dot ${i === index ? 'is-active' : ''}`}
                aria-label={`Перейти к фото ${i + 1}`}
                onClick={(e) => goTo(i, e)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
