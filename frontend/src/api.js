const rawBasePath = import.meta.env.BASE_URL || '/'
const APP_BASE_PATH = rawBasePath.endsWith('/') ? rawBasePath.slice(0, -1) : rawBasePath
const ROOT_API_PREFIX = `${APP_BASE_PATH}/api/`.replace('//', '/')

function getToken() {
  return localStorage.getItem('aimanju_token')
}

export function resolveApiPath(path) {
  if (!path) return path
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  if (APP_BASE_PATH && path.startsWith('/api/')) return `${APP_BASE_PATH}${path}`
  return path
}

export function resolveApiAssetUrl(url) {
  if (!url) return ''
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  return resolveApiPath(url)
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
  const res = await fetch(resolveApiPath(path), { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('aimanju_token')
    throw new Error(await parseError(res, '请登录后使用'))
  }
  if (!res.ok) throw new Error(await parseError(res, '请求失败，请重试'))
  if (res.status === 204) return null
  return res.json()
}

export async function uploadForm(path, formData, method = 'POST') {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(resolveApiPath(path), { method, body: formData, headers })
  if (res.status === 401) {
    localStorage.removeItem('aimanju_token')
    throw new Error(await parseError(res, '请登录后使用'))
  }
  if (res.status === 413) throw new Error('图片太大，请换一张较小的图片，或先截图后再上传')
  if (!res.ok) throw new Error(await parseError(res, '上传失败，请重试'))
  return res.json()
}

export const auth = {
  login: (studentId, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ student_id: studentId, password }) }),
  registerOptions: () => request('/api/auth/register-options'),
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
  saveGroupFinal: (title, manjuData) =>
    request('/api/projects/manju/group-final', { method: 'POST', body: JSON.stringify({ title, manju_data: manjuData || {} }) }),
  getManju: (id) => request(`/api/projects/manju/${id}`),
  updateManju: (id, data) => request(`/api/projects/manju/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
}

export const gallery = {
  list: () => request('/api/manju/gallery'),
}

export const wallWorks = {
  my: () => request('/api/manju/wall-works/my'),
  create: (title, videoUrl, coverFile) => {
    const form = new FormData()
    form.append('title', title)
    form.append('video_url', videoUrl)
    if (coverFile) form.append('cover', coverFile)
    return uploadForm('/api/manju/wall-works', form)
  },
  update: (id, title, videoUrl, coverFile) => {
    const form = new FormData()
    form.append('title', title)
    form.append('video_url', videoUrl)
    if (coverFile) form.append('cover', coverFile)
    return uploadForm(`/api/manju/wall-works/${id}`, form, 'PUT')
  },
  delete: (id) => request(`/api/manju/wall-works/${id}`, { method: 'DELETE' }),
  like: (id) => request(`/api/manju/wall-works/${id}/like`, { method: 'PUT' }),
  unlike: (id) => request(`/api/manju/wall-works/${id}/like`, { method: 'DELETE' }),
  createComment: (id, content) => request(`/api/manju/wall-works/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  updateComment: (id, content) => request(`/api/manju/wall-comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  deleteComment: (id) => request(`/api/manju/wall-comments/${id}`, { method: 'DELETE' }),
  setLinkStatus: (id, expired) => request(`/api/manju/wall-works/${id}/link-status`, { method: 'PUT', body: JSON.stringify({ expired }) }),
}

export const groups = {
  status: () => request('/api/manju/groups/status'),
  create: (data) => request('/api/manju/groups', { method: 'POST', body: JSON.stringify(data) }),
  join: (groupId) => request(`/api/manju/groups/${groupId}/join`, { method: 'POST' }),
  transferLeader: (groupId, userId) => request(`/api/manju/groups/${groupId}/transfer-leader`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  leave: () => request('/api/manju/groups/leave', { method: 'POST' }),
}

export { ROOT_API_PREFIX }
