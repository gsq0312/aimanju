const ROOT_API_PREFIX = '/api/'

function getToken() {
  return localStorage.getItem('aimanju_token')
}

export function resolveApiPath(path) {
  return path
}

export function resolveApiAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  return url
}

async function parseError(res, fallback) {
  const data = await res.json().catch(() => null)
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg || JSON.stringify(item)).join('；')
  return data.message || data.error || fallback
}

export async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('aimanju_token')
    throw new Error(await parseError(res, '请登录后使用'))
  }
  if (!res.ok) throw new Error(await parseError(res, '请求失败，请重试'))
  if (res.status === 204) return null
  return res.json()
}

export async function uploadForm(path, formData) {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { method: 'POST', body: formData, headers })
  if (res.status === 401) {
    localStorage.removeItem('aimanju_token')
    throw new Error(await parseError(res, '请登录后使用'))
  }
  if (!res.ok) throw new Error(await parseError(res, '上传失败，请重试'))
  return res.json()
}

export const auth = {
  login: (studentId, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ student_id: studentId, password }) }),
  register: (email, password, name, _emailCode, studentId, className) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, student_id: studentId, class_name: className }),
    }),
  me: () => request('/api/auth/me'),
  updateSettings: (data) => request('/api/auth/settings', { method: 'PUT', body: JSON.stringify(data) }),
}

export const ai = {
  getUsage: () => request('/api/ai/usage'),
}

export const projects = {
  listManju: () => request('/api/projects/manju'),
  createManju: (title, manjuData) =>
    request('/api/projects/manju', { method: 'POST', body: JSON.stringify({ title, manju_data: manjuData || {} }) }),
  getManju: (id) => request(`/api/projects/manju/${id}`),
  updateManju: (id, data) => request(`/api/projects/manju/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
}

export const gallery = {
  list: () => request('/api/manju/gallery'),
}

export { ROOT_API_PREFIX }
