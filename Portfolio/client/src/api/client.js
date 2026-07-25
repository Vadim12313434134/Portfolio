const TOKEN_KEY = 'portfolio_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export const api = {
  login(password) {
    return request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
  },

  getProjects() {
    return request('/api/projects')
  },

  getProject(id) {
    return request(`/api/projects/${id}`)
  },

  createProject(formData) {
    return request('/api/projects', {
      method: 'POST',
      body: formData,
    })
  },

  updateProject(id, formData) {
    return request(`/api/projects/${id}`, {
      method: 'PUT',
      body: formData,
    })
  },

  deleteProject(id) {
    return request(`/api/projects/${id}`, {
      method: 'DELETE',
    })
  },
}
