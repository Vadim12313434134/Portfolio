import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const PORT = process.env.PORT || 3001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'portfolio-secret'
const MAX_IMAGES = 10

const dataPath = path.join(__dirname, 'data', 'projects.json')
const uploadsDir = path.join(__dirname, 'uploads')
const clientDist = path.join(rootDir, 'client', 'dist')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { files: MAX_IMAGES, fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'))
    }
  },
})

function readProjects() {
  try {
    const raw = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeProjects(projects) {
  fs.writeFileSync(dataPath, JSON.stringify(projects, null, 2), 'utf8')
}

function createToken() {
  return crypto
    .createHmac('sha256', ADMIN_TOKEN_SECRET)
    .update(`admin:${ADMIN_PASSWORD}`)
    .digest('hex')
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || token !== createToken()) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

function deleteImageFiles(filenames = []) {
  for (const name of filenames) {
    const filePath = path.join(uploadsDir, name)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

app.post('/api/login', (req, res) => {
  const { password } = req.body || {}
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  res.json({ token: createToken() })
})

app.get('/api/projects', (_req, res) => {
  const projects = readProjects().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
  res.json(projects)
})

app.get('/api/projects/:id', (req, res) => {
  const project = readProjects().find((p) => p.id === req.params.id)
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }
  res.json(project)
})

app.post('/api/projects', requireAuth, upload.array('images', MAX_IMAGES), (req, res) => {
  try {
    const { title, shortDescription, description } = req.body
    if (!title?.trim()) {
      deleteImageFiles((req.files || []).map((f) => f.filename))
      return res.status(400).json({ error: 'Title is required' })
    }

    const images = (req.files || []).map((f) => f.filename)
    if (images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' })
    }
    if (images.length > MAX_IMAGES) {
      deleteImageFiles(images)
      return res.status(400).json({ error: `Maximum ${MAX_IMAGES} images allowed` })
    }

    const project = {
      id: uuidv4(),
      title: title.trim(),
      shortDescription: (shortDescription || '').trim(),
      description: (description || '').trim(),
      images,
      createdAt: new Date().toISOString(),
    }

    const projects = readProjects()
    projects.push(project)
    writeProjects(projects)
    res.status(201).json(project)
  } catch (err) {
    deleteImageFiles((req.files || []).map((f) => f.filename))
    res.status(500).json({ error: err.message || 'Failed to create project' })
  }
})

app.put('/api/projects/:id', requireAuth, upload.array('images', MAX_IMAGES), (req, res) => {
  try {
    const projects = readProjects()
    const index = projects.findIndex((p) => p.id === req.params.id)
    if (index === -1) {
      deleteImageFiles((req.files || []).map((f) => f.filename))
      return res.status(404).json({ error: 'Project not found' })
    }

    const existing = projects[index]
    const { title, shortDescription, description, keepImages } = req.body

    let kept = []
    if (keepImages) {
      try {
        kept = JSON.parse(keepImages)
      } catch {
        kept = []
      }
    }

    kept = kept.filter((name) => existing.images.includes(name))
    const newImages = (req.files || []).map((f) => f.filename)
    const images = [...kept, ...newImages]

    if (images.length === 0) {
      deleteImageFiles(newImages)
      return res.status(400).json({ error: 'At least one image is required' })
    }
    if (images.length > MAX_IMAGES) {
      deleteImageFiles(newImages)
      return res.status(400).json({ error: `Maximum ${MAX_IMAGES} images allowed` })
    }

    const removed = existing.images.filter((name) => !kept.includes(name))
    deleteImageFiles(removed)

    const updated = {
      ...existing,
      title: title?.trim() || existing.title,
      shortDescription:
        shortDescription !== undefined
          ? shortDescription.trim()
          : existing.shortDescription,
      description:
        description !== undefined ? description.trim() : existing.description,
      images,
    }

    projects[index] = updated
    writeProjects(projects)
    res.json(updated)
  } catch (err) {
    deleteImageFiles((req.files || []).map((f) => f.filename))
    res.status(500).json({ error: err.message || 'Failed to update project' })
  }
})

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  const projects = readProjects()
  const index = projects.findIndex((p) => p.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' })
  }

  const [removed] = projects.splice(index, 1)
  deleteImageFiles(removed.images || [])
  writeProjects(projects)
  res.json({ ok: true })
})

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload error' })
  }
  res.status(500).json({ error: 'Server error' })
})

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Portfolio server running on http://localhost:${PORT}`)
})
