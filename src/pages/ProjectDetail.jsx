import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { photoLabel } from '../config'
import ImageSlider from '../components/ImageSlider'
import './ProjectDetail.css'

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .getProject(id)
      .then((data) => {
        if (alive) setProject(data)
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return <p className="detail__status">Загрузка…</p>
  }

  if (error || !project) {
    return (
      <div className="detail">
        <p className="detail__status detail__status--error">{error || 'Не найдено'}</p>
        <Link to="/" className="detail__back">
          ← К работам
        </Link>
      </div>
    )
  }

  const paragraphs = (project.description || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const photoCount = project.images?.length || 0

  return (
    <article className="detail fade-up">
      <Link to="/" className="detail__back">
        ← К работам
      </Link>

      <header className="detail__header">
        <p className="detail__label">Проект</p>
        <h1 className="detail__title">{project.title}</h1>
        <p className="detail__meta">{photoLabel(photoCount)}</p>
      </header>

      <div className="detail__media">
        <ImageSlider images={project.images} alt={project.title} large />
      </div>

      <div className="detail__content">
        {project.shortDescription && (
          <section className="detail__section">
            <h2 className="detail__section-title">Кратко</h2>
            <p className="detail__short">{project.shortDescription}</p>
          </section>
        )}

        {paragraphs.length > 0 && (
          <section className="detail__section">
            <h2 className="detail__section-title">Описание</h2>
            <div className="detail__body">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
