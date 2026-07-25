import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { BRAND_NAME, BRAND_TAGLINE } from '../config'
import ProjectCard from '../components/ProjectCard'
import './Home.css'

export default function Home() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .getProjects()
      .then((data) => {
        if (alive) setProjects(data)
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
  }, [])

  return (
    <div className="home">
      <section className="home__hero fade-up">
        <p className="home__eyebrow">Портфолио</p>
        <h1 className="home__brand">{BRAND_NAME}</h1>
        <p className="home__tagline">{BRAND_TAGLINE}</p>
      </section>

      {loading && <p className="home__status">Загрузка работ…</p>}
      {error && <p className="home__status home__status--error">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="home__status">
          Пока нет работ. Добавьте первую в разделе «Админ».
        </p>
      )}

      <section className="home__grid">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </section>
    </div>
  )
}
