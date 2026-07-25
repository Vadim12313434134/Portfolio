import 'dotenv/config'
import http from 'http'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const PORT = Number(process.env.PORT || 3001)
const HOST = process.env.HOST || '0.0.0.0'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'portfolio-secret'
const MAX_IMAGES = 10
const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const dataDir = path.join(__dirname, 'data')
const dataPath = path.join(dataDir, 'projects.json')
const uploadsDir = path.join(__dirname, 'uploads')
const distDir = path.join(rootDir, 'dist')

for (const dir of [uploadsDir, dataDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, '[]', 'utf8')
}

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

function getAuthToken(req) {
  const header = req.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

function requireAuth(req) {
  const token = getAuthToken(req)
  return Boolean(token && token === createToken())
}

function deleteImageFiles(filenames = []) {
  for (const name of filenames) {
    const filePath = path.join(uploadsDir, name)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
}

function parseJsonArray(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function resolveSafePath(baseDir, relativePath) {
  const normalizedBase = path.resolve(baseDir)
  const resolvedPath = path.resolve(baseDir, relativePath)
  const basePrefix = `${normalizedBase}${path.sep}`
  if (resolvedPath !== normalizedBase && !resolvedPath.startsWith(basePrefix)) {
    return null
  }
  return resolvedPath
}

function contentTypeForFile(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.ico':
      return 'image/x-icon'
    case '.map':
      return 'application/octet-stream'
    default:
      return 'application/octet-stream'
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    ...corsHeaders,
    ...headers,
  })
  res.end(body)
}

function sendJson(res, statusCode, data) {
  send(res, statusCode, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
  })
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  send(res, statusCode, text, {
    'Content-Type': contentType,
  })
}

function streamFile(res, filePath, statusCode = 200) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(res, 404, 'Not found')
      return
    }

    res.writeHead(statusCode, {
      ...corsHeaders,
      'Content-Type': contentTypeForFile(filePath),
      'Content-Length': stats.size,
    })

    const stream = fs.createReadStream(filePath)
    stream.on('error', () => {
      if (!res.headersSent) {
        sendText(res, 500, 'File read error')
      } else {
        res.destroy()
      }
    })
    stream.pipe(res)
  })
}

function isUploadedFile(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.name === 'string' &&
    typeof value.size === 'number'
  )
}

function getFileExtension(fileName, mimeType) {
  const originalExtension = path.extname(fileName || '').toLowerCase()
  if (originalExtension) {
    return originalExtension === '.jpeg' ? '.jpg' : originalExtension
  }

  switch (mimeType) {
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return '.jpg'
  }
}

async function saveUploadedFiles(files) {
  const savedFiles = []

  try {
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error('Only JPEG, PNG, WebP and GIF images are allowed')
      }
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error('Each image must be 8 MB or smaller')
      }

      const extension = getFileExtension(file.name, file.type)
      const filename = `${crypto.randomUUID()}${extension}`
      const filePath = path.join(uploadsDir, filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)
      savedFiles.push(filename)
    }
  } catch (error) {
    deleteImageFiles(savedFiles)
    throw error
  }

  return savedFiles
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return {}
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  if (!rawBody.trim()) {
    return {}
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    throw new Error('Invalid JSON body')
  }
}

async function readFormData(req) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const request = new Request(requestUrl, {
    method: req.method || 'POST',
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: 'half',
  })
  return request.formData()
}

function serveUploadFile(res, requestPath) {
  const relativePath = decodeURIComponent(requestPath.replace(/^\/uploads\/?/, ''))
  if (!relativePath) {
    sendText(res, 404, 'Not found')
    return true
  }

  const filePath = resolveSafePath(uploadsDir, relativePath)
  if (!filePath || !fs.existsSync(filePath)) {
    sendText(res, 404, 'Not found')
    return true
  }

  streamFile(res, filePath)
  return true
}

function serveFrontendAsset(res, requestPath) {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    return false
  }

  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\//, '')
  const filePath = resolveSafePath(distDir, relativePath)
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    streamFile(res, filePath)
    return true
  }

  streamFile(res, path.join(distDir, 'index.html'))
  return true
}

async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') {
    sendText(res, 204, '')
    return
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      dist: fs.existsSync(path.join(distDir, 'index.html')),
    })
    return
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const body = await readJsonBody(req)
    const password = body?.password
    if (password !== ADMIN_PASSWORD) {
      sendJson(res, 401, { error: 'Invalid password' })
      return
    }
    sendJson(res, 200, { token: createToken() })
    return
  }

  if (pathname === '/api/projects' && req.method === 'GET') {
    const projects = readProjects().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
    sendJson(res, 200, projects)
    return
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/)
  if (projectMatch && req.method === 'GET') {
    const projectId = decodeURIComponent(projectMatch[1])
    const project = readProjects().find((item) => item.id === projectId)
    if (!project) {
      sendJson(res, 404, { error: 'Project not found' })
      return
    }
    sendJson(res, 200, project)
    return
  }

  if (pathname === '/api/projects' && req.method === 'POST') {
    if (!requireAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    let formData
    try {
      formData = await readFormData(req)
    } catch {
      sendJson(res, 400, { error: 'Upload error' })
      return
    }

    try {
      const title = String(formData.get('title') || '').trim()
      const shortDescription = String(formData.get('shortDescription') || '').trim()
      const description = String(formData.get('description') || '').trim()
      const uploadedFiles = formData.getAll('images').filter(isUploadedFile)

      if (!title) {
        sendJson(res, 400, { error: 'Title is required' })
        return
      }
      if (uploadedFiles.length === 0) {
        sendJson(res, 400, { error: 'At least one image is required' })
        return
      }
      if (uploadedFiles.length > MAX_IMAGES) {
        sendJson(res, 400, { error: `Maximum ${MAX_IMAGES} images allowed` })
        return
      }

      const images = await saveUploadedFiles(uploadedFiles)
      const project = {
        id: crypto.randomUUID(),
        title,
        shortDescription,
        description,
        images,
        createdAt: new Date().toISOString(),
      }

      const projects = readProjects()
      projects.push(project)
      writeProjects(projects)
      sendJson(res, 201, project)
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Failed to create project' })
    }
    return
  }

  if (projectMatch && req.method === 'PUT') {
    if (!requireAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    const projectId = decodeURIComponent(projectMatch[1])
    const projects = readProjects()
    const projectIndex = projects.findIndex((item) => item.id === projectId)
    if (projectIndex === -1) {
      sendJson(res, 404, { error: 'Project not found' })
      return
    }

    let formData
    try {
      formData = await readFormData(req)
    } catch {
      sendJson(res, 400, { error: 'Upload error' })
      return
    }

    try {
      const existing = projects[projectIndex]
      const title = String(formData.get('title') || '').trim()
      const shortDescription = formData.get('shortDescription')
      const description = formData.get('description')
      const keepImages = parseJsonArray(String(formData.get('keepImages') || ''))
      const uploadedFiles = formData.getAll('images').filter(isUploadedFile)

      const keptImages = keepImages.filter((name) => existing.images.includes(name))
      const newImages = await saveUploadedFiles(uploadedFiles)
      const images = [...keptImages, ...newImages]

      if (images.length === 0) {
        deleteImageFiles(newImages)
        sendJson(res, 400, { error: 'At least one image is required' })
        return
      }
      if (images.length > MAX_IMAGES) {
        deleteImageFiles(newImages)
        sendJson(res, 400, { error: `Maximum ${MAX_IMAGES} images allowed` })
        return
      }

      const removedImages = existing.images.filter((name) => !keptImages.includes(name))
      deleteImageFiles(removedImages)

      const updatedProject = {
        ...existing,
        title: title || existing.title,
        shortDescription:
          shortDescription !== null && shortDescription !== undefined
            ? String(shortDescription).trim()
            : existing.shortDescription,
        description:
          description !== null && description !== undefined
            ? String(description).trim()
            : existing.description,
        images,
      }

      projects[projectIndex] = updatedProject
      writeProjects(projects)
      sendJson(res, 200, updatedProject)
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Failed to update project' })
    }
    return
  }

  if (projectMatch && req.method === 'DELETE') {
    if (!requireAuth(req)) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    const projectId = decodeURIComponent(projectMatch[1])
    const projects = readProjects()
    const projectIndex = projects.findIndex((item) => item.id === projectId)
    if (projectIndex === -1) {
      sendJson(res, 404, { error: 'Project not found' })
      return
    }

    const [removedProject] = projects.splice(projectIndex, 1)
    deleteImageFiles(removedProject.images || [])
    writeProjects(projects)
    sendJson(res, 200, { ok: true })
    return
  }

  sendJson(res, 404, { error: 'Not found' })
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = decodeURIComponent(requestUrl.pathname)

  if (req.method === 'OPTIONS') {
    sendText(res, 204, '')
    return
  }

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname)
    return
  }

  if (pathname.startsWith('/uploads/')) {
    if (!serveUploadFile(res, pathname)) {
      sendText(res, 404, 'Not found')
    }
    return
  }

  if (serveFrontendAsset(res, pathname)) {
    return
  }

  if (pathname === '/') {
    sendText(
      res,
      500,
      '<h1>Build not found</h1><p>No dist directory found. Build the frontend before starting the server.</p>',
      'text/html; charset=utf-8'
    )
    return
  }

  sendText(res, 404, 'Not found')
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error)
    if (!res.headersSent) {
      sendJson(res, 500, { error: error.message || 'Server error' })
    } else {
      res.destroy()
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`Portfolio server running on http://${HOST}:${PORT}`)
})
