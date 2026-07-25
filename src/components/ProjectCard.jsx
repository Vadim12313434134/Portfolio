import { Link } from 'react-router-dom'
import ImageSlider from './ImageSlider'
import './ProjectCard.css'

export default function ProjectCard({ project, index = 0 }) {
  return (
    <Link
      to={`/project/${project.id}`}
      className="project-card fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      <ImageSlider
        images={project.images}
        alt={project.title}
        stopPropagation
      />
      <div className="project-card__body">
        <h2 className="project-card__title">{project.title}</h2>
        {project.shortDescription && (
          <p className="project-card__desc">{project.shortDescription}</p>
        )}
      </div>
    </Link>
  )
}
