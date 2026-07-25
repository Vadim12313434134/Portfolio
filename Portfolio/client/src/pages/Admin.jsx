import { useEffect, useMemo, useState } from 'react'
import { api, clearToken, getToken, setToken } from '../api/client'
import { imageUrl, MAX_IMAGES, photoLabel } from '../config'
import './Admin.css'

const emptyForm = {
  title: '',
  shortDescription: '',
  description: '',
}

export default function Admin() {
  const [token, setTokenState] = useState(getToken())
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [keptImages, setKeptImages] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const totalImages = keptImages.length + files.length
  const canAddMore = totalImages < MAX_IMAGES

  const filePreviews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  )

  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [filePreviews])

  const loadProjects = async () => {
    const data = await api.getProjects()
    setProjects(data)
  }

  useEffect(() => {
    if (!token) return
    loadProjects().catch((err) => setError(err.message))
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { token: nextToken } = await api.login(password)
      setToken(nextToken)
      setTokenState(nextToken)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    clearToken()
    setTokenState(null)
    resetForm()
  }

  const resetForm = () => {
    setForm(emptyForm)
    setFiles([])
    setEditingId(null)
    setKeptImages([])
    setMessage('')
    setError('')
  }

  const startEdit = (project) => {
    setEditingId(project.id)
    setForm({
      title: project.title,
      shortDescription: project.shortDescription || '',
      description: project.description || '',
    })
    setKeptImages(project.images || [])
    setFiles([])
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    if (!selected.length) return

    const room = MAX_IMAGES - keptImages.length - files.length
    if (room <= 0) {
      setError(`Максимум ${MAX_IMAGES} фото на проект`)
      return
    }

    setFiles((prev) => [...prev, ...selected.slice(0, room)])
    setError('')
  }

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeKeptImage = (name) => {
    setKeptImages((prev) => prev.filter((img) => img !== name))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!form.title.trim()) {
      setError('Укажите название')
      return
    }
    if (totalImages === 0) {
      setError('Добавьте хотя бы одно фото')
      return
    }
    if (totalImages > MAX_IMAGES) {
      setError(`Максимум ${MAX_IMAGES} фото`)
      return
    }

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('shortDescription', form.shortDescription.trim())
    fd.append('description', form.description.trim())
    files.forEach((file) => fd.append('images', file))

    setBusy(true)
    try {
      if (editingId) {
        fd.append('keepImages', JSON.stringify(keptImages))
        await api.updateProject(editingId, fd)
        setMessage('Проект обновлён')
      } else {
        await api.createProject(fd)
        setMessage('Проект опубликован')
      }
      resetForm()
      await loadProjects()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот проект?')) return
    setBusy(true)
    setError('')
    try {
      await api.deleteProject(id)
      if (editingId === id) resetForm()
      await loadProjects()
      setMessage('Проект удалён')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="admin fade-up">
        <h1 className="admin__title">Админ</h1>
        <p className="admin__lead">Войдите, чтобы публиковать и редактировать работы.</p>
        <form className="admin__login" onSubmit={handleLogin}>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="admin__error">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin fade-up">
      <div className="admin__top">
        <div>
          <h1 className="admin__title">
            {editingId ? 'Редактирование' : 'Новый проект'}
          </h1>
          <p className="admin__lead">До {MAX_IMAGES} фото на работу.</p>
        </div>
        <button type="button" className="admin__ghost" onClick={logout}>
          Выйти
        </button>
      </div>

      <form className="admin__form" onSubmit={handleSubmit}>
        <label>
          Название
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </label>

        <label>
          Краткое описание
          <input
            value={form.shortDescription}
            onChange={(e) =>
              setForm((f) => ({ ...f, shortDescription: e.target.value }))
            }
            placeholder="Показывается на карточке"
          />
        </label>

        <label>
          Полное описание
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Показывается на странице проекта"
          />
        </label>

        <div className="admin__upload">
          <div className="admin__upload-head">
            <span>
              Фото ({totalImages}/{MAX_IMAGES})
            </span>
            <label className={`admin__file-btn ${!canAddMore ? 'is-disabled' : ''}`}>
              Добавить фото
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={!canAddMore}
                onChange={onFilesChange}
              />
            </label>
          </div>

          <div className="admin__thumbs">
            {keptImages.map((name) => (
              <div className="admin__thumb" key={name}>
                <img src={imageUrl(name)} alt="" />
                <button type="button" onClick={() => removeKeptImage(name)}>
                  Убрать
                </button>
              </div>
            ))}
            {filePreviews.map((item, index) => (
              <div className="admin__thumb" key={item.url}>
                <img src={item.url} alt="" />
                <button type="button" onClick={() => removeNewFile(index)}>
                  Убрать
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="admin__error">{error}</p>}
        {message && <p className="admin__ok">{message}</p>}

        <div className="admin__actions">
          <button type="submit" disabled={busy}>
            {busy ? 'Сохранение…' : editingId ? 'Сохранить' : 'Опубликовать'}
          </button>
          {editingId && (
            <button type="button" className="admin__ghost" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <section className="admin__list">
        <h2>Опубликованные работы</h2>
        {projects.length === 0 && (
          <p className="admin__empty">Пока ничего не опубликовано.</p>
        )}
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <div className="admin__list-main">
                {project.images[0] && (
                  <img src={imageUrl(project.images[0])} alt="" />
                )}
                <div>
                  <strong>{project.title}</strong>
                  <span>{photoLabel(project.images.length)}</span>
                </div>
              </div>
              <div className="admin__list-actions">
                <button type="button" onClick={() => startEdit(project)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="admin__danger"
                  onClick={() => handleDelete(project.id)}
                  disabled={busy}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
