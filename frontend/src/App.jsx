import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { auth as authApi, gallery as galleryApi, groups as groupsApi, projects as projectApi, resolveApiAssetUrl, wallWorks as wallWorksApi } from './api'
import AiManjuGuide from './components/AiManjuGuide.jsx'
import AiManjuStudio from './components/AiManjuStudio.jsx'
import ExcellentWorks from './components/ExcellentWorks.jsx'
import ManjuGroupWidget from './components/ManjuGroupWidget.jsx'

const emptyForm = {
  name: '',
  email: '',
  studentId: '',
  className: '',
  password: '',
  confirmPassword: '',
}

const WALL_COVER_MAX_EDGE = 640
const WALL_COVER_TARGET_BYTES = 220 * 1024
const SUPPORTED_WALL_COVER_EXTENSIONS = /\.(jpe?g|jfif|png|webp|gif)$/i

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function extractFirstUrl(value) {
  const match = String(value || '').match(/https?:\/\/[^\s<>'"，。；、]+/i)
  return match ? match[0].replace(/[).,，。；;、！!？?】\]]+$/, '') : ''
}

function wallLinkNote(work) {
  if (work.link_status === 'invalid') return { type: 'error', text: work.link_message || '链接疑似失效' }
  if (work.link_status === 'normalized') return { type: 'warn', text: work.link_message || '已自动提取作品链接' }
  return null
}

function isSupportedWallCover(file) {
  if (!file) return true
  return /^image\/(jpeg|png|webp|gif)$/i.test(file.type || '') || SUPPORTED_WALL_COVER_EXTENSIONS.test(file.name || '')
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('这张图片浏览器不能识别，请换 JPG / PNG / WebP，或先截图后上传'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('图片压缩失败，请换一张图片再试'))
    }, type, quality)
  })
}

async function prepareWallCover(file) {
  if (!file) return null
  if (!isSupportedWallCover(file)) {
    throw new Error('封面只支持 JPG、PNG、WebP、GIF。手机 HEIC 图片请先截图或转成 JPG 再上传')
  }
  const image = await loadImageFile(file)
  const scale = Math.min(1, WALL_COVER_MAX_EDGE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height))
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#fffef5'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  let blob = await canvasToBlob(canvas, 'image/jpeg', 0.74)
  if (blob.size > WALL_COVER_TARGET_BYTES) blob = await canvasToBlob(canvas, 'image/jpeg', 0.62)
  if (blob.size > WALL_COVER_TARGET_BYTES) blob = await canvasToBlob(canvas, 'image/jpeg', 0.5)
  if (blob.size > WALL_COVER_TARGET_BYTES) blob = await canvasToBlob(canvas, 'image/jpeg', 0.42)
  return new File([blob], `${(file.name || 'wall-cover').replace(/\.[^.]+$/, '')}-compressed.jpg`, { type: 'image/jpeg' })
}

function AuthDialog({ initialMode, onClose, classOptions }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState(initialMode || 'login')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(form.studentId || form.email, form.password)
      } else {
        if (!form.name.trim()) throw new Error('请填写姓名')
        if (!form.email.trim()) throw new Error('请填写邮箱')
        if (!form.studentId.trim()) throw new Error('请填写学号')
        if (!form.className.trim()) throw new Error('请填写班级')
        if (form.password.length < 6) throw new Error('密码至少 6 位')
        if (form.password !== form.confirmPassword) throw new Error('两次密码不一致')
        await register(form)
      }
      onClose()
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="manju-modal-backdrop" onMouseDown={onClose}>
      <form className="manju-auth-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="manju-auth-head">
          <div>
            <span>ACCOUNT</span>
            <h2>{mode === 'login' ? '登录系统' : '注册账号'}</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>

        <div className="manju-auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>登录</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>注册</button>
        </div>

        {mode === 'register' && (
          <>
            <label>姓名<input value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" /></label>
            <label>邮箱<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" /></label>
            <label>学号<input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} /></label>
            <label>班级
              <select value={form.className} onChange={(e) => update('className', e.target.value)}>
                <option value="">请选择班级</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </label>
          </>
        )}

        {mode === 'login' && (
          <label>学号 / 邮箱<input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} autoComplete="username" /></label>
        )}
        <label>密码<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {mode === 'register' && (
          <label>确认密码<input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} autoComplete="new-password" /></label>
        )}
        {error && <p className="manju-form-error">{error}</p>}
        <button className="manju-submit-btn" disabled={submitting}>{submitting ? '处理中...' : mode === 'login' ? '登录' : '注册并进入'}</button>
      </form>
    </div>
  )
}

function AccountPanel({ onClose, classOptions }) {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    student_id: user?.student_id || '',
    class_name: user?.class_name || '',
  })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateProfile(form)
      setMessage('已保存')
    } catch (err) {
      setMessage(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="manju-modal-backdrop" onMouseDown={onClose}>
      <form className="manju-account-dialog" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}>
        <div className="manju-auth-head">
          <div>
            <span>CLASS</span>
            <h2>修改姓名和班级</h2>
          </div>
          <button type="button" onClick={onClose}>关闭</button>
        </div>
        <label>姓名<input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label>邮箱<input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} /></label>
        <label>学号<input value={form.student_id} onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))} /></label>
        <label>班级
          <select value={form.class_name} onChange={(e) => setForm((prev) => ({ ...prev, class_name: e.target.value }))}>
            <option value="">请选择班级</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </label>
        {message && <p className="manju-form-note">{message}</p>}
        <button className="manju-submit-btn" disabled={saving}>{saving ? '保存中...' : '保存修改'}</button>
      </form>
    </div>
  )
}

function LoginRequired({ onLogin, onRegister }) {
  return (
    <section className="manju-login-required">
      <span>作品墙</span>
      <h2>登录后查看作品墙和自己的作品</h2>
      <p>创作页面可以先打开查看；需要保存作品、查看我的作品和作品墙时，再从左下角登录或注册。</p>
      <div>
        <button type="button" onClick={onLogin}>登录</button>
        <button type="button" onClick={onRegister}>注册</button>
      </div>
    </section>
  )
}

export default function App() {
  const { user, loading, logout } = useAuth()
  const [activeView, setActiveView] = useState('studio')
  const [projects, setProjects] = useState([])
  const [galleryItems, setGalleryItems] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [showAuth, setShowAuth] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [activeClass, setActiveClass] = useState('')
  const [registerClassOptions, setRegisterClassOptions] = useState([])
  const [wallWorkItems, setWallWorkItems] = useState([])
  const [wallTitle, setWallTitle] = useState('')
  const [wallUrl, setWallUrl] = useState('')
  const [wallCover, setWallCover] = useState(null)
  const [wallSubmitting, setWallSubmitting] = useState(false)
  const [wallMessage, setWallMessage] = useState('')
  const [wallError, setWallError] = useState('')
  const [editingWallWork, setEditingWallWork] = useState(null)
  const [groupStatus, setGroupStatus] = useState(null)
  const [galleryMessage, setGalleryMessage] = useState('')
  const [galleryError, setGalleryError] = useState('')
  const [commentEditor, setCommentEditor] = useState(null)
  const [feedbackWorkingId, setFeedbackWorkingId] = useState('')

  const openAuth = (mode) => {
    setAuthMode(mode)
    setShowAuth(true)
  }

  const reloadProjects = async () => {
    if (!user) {
      setProjects([])
      return
    }
    const data = await projectApi.listManju().catch(() => [])
    setProjects(data || [])
  }

  const reloadGallery = async () => {
    if (!user) {
      setGalleryItems([])
      return
    }
    const data = await galleryApi.list().catch(() => [])
    setGalleryItems(data || [])
  }

  const reloadWallWorks = async () => {
    if (!user) {
      setWallWorkItems([])
      return
    }
    const data = await wallWorksApi.my().catch(() => [])
    setWallWorkItems(data || [])
  }

  const reloadGroupStatus = async () => {
    if (!user) {
      setGroupStatus(null)
      return null
    }
    const data = await groupsApi.status().catch(() => null)
    setGroupStatus(data)
    return data
  }

  useEffect(() => {
    reloadProjects()
    reloadGallery()
    reloadWallWorks()
    reloadGroupStatus()
    const handler = (event) => {
      const savedProject = event?.detail?.project
      if (savedProject?.id) {
        setProjects((prev) => [savedProject, ...prev.filter((project) => project.id !== savedProject.id)])
        setSelectedProject(savedProject)
      }
      reloadProjects()
      reloadGallery()
      reloadWallWorks()
      reloadGroupStatus()
    }
    window.addEventListener('ai-manju-projects-changed', handler)
    return () => window.removeEventListener('ai-manju-projects-changed', handler)
  }, [user?.id])

  useEffect(() => {
    authApi.registerOptions()
      .then((data) => setRegisterClassOptions(data?.classes || []))
      .catch(() => setRegisterClassOptions([]))
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelector('.manju-main')?.scrollTo?.(0, 0)
      window.scrollTo(0, 0)
    })
  }, [activeView])

  const classOptions = useMemo(
    () => Array.from(new Set([...(registerClassOptions || []), ...(galleryItems || []).map((item) => item.class_name).filter(Boolean)])),
    [galleryItems, registerClassOptions]
  )

  useEffect(() => {
    if (!classOptions.length) {
      setActiveClass('')
      return
    }
    if (activeClass && classOptions.includes(activeClass)) return
    setActiveClass(user?.class_name && classOptions.includes(user.class_name) ? user.class_name : classOptions[0])
  }, [activeClass, classOptions, user?.class_name])

  const galleryCards = useMemo(() => {
    const source = activeClass ? galleryItems.filter((item) => item.class_name === activeClass) : galleryItems
    const map = new Map()
    source.forEach((item) => {
      const isGroup = item.card_type === 'group' && item.group_id
      const key = isGroup ? `group-${item.group_id}` : `student-${item.student_id || item.author_name || item.id}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          card_type: isGroup ? 'group' : 'individual',
          title: isGroup ? item.group_name || '未命名小组' : item.author_name || '未命名学生',
          subtitle: isGroup
            ? `成员：${(item.group_members || []).join('、') || item.author_name || '暂无成员'}`
            : `${item.class_name || '未填班级'}${item.student_id ? ` · ${item.student_id}` : ''}`,
          works: [],
        })
      }
      map.get(key).works.push(item)
    })
    return Array.from(map.values()).map((card) => ({
      ...card,
      works: card.works.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)),
    }))
  }, [activeClass, galleryItems])

  const wallUrlNote = useMemo(() => {
    const raw = wallUrl.trim()
    if (!raw) return ''
    const extracted = extractFirstUrl(raw)
    if (!extracted) return '没有识别到 http/https 链接，请粘贴作品分享链接。'
    if (extracted !== raw) return `检测到分享文案，提交时会自动使用：${extracted}`
    return ''
  }, [wallUrl])

  const studioKey = useMemo(() => selectedProject?.id || selectedProject?.resetToken || 'new', [selectedProject])
  const myGroup = groupStatus?.my_group || null
  const myGroupMember = myGroup?.members?.find((member) => member.user_id === user?.id) || null
  const isGroupMember = Boolean(myGroup)
  const isGroupLeader = myGroupMember?.role === 'leader'
  const canSubmitWallWork = !isGroupMember || isGroupLeader
  const canUseWallForm = canSubmitWallWork || Boolean(editingWallWork?.can_manage)
  const isTeacher = user?.role === 'teacher'

  const handleGroupChanged = () => {
    reloadProjects()
    reloadGallery()
    reloadWallWorks()
    reloadGroupStatus()
  }

  const createDraft = () => {
    setSelectedProject({
      resetToken: Date.now(),
      title: '未保存AI漫剧',
    })
    setActiveView('studio')
  }

  const openWallSubmit = () => {
    setWallMessage('')
    setWallError(canSubmitWallWork ? '' : '请组长统一提交小组作品')
    setEditingWallWork(null)
    setWallTitle('')
    setWallUrl('')
    setWallCover(null)
    setActiveView('wallSubmit')
  }

  const openWallEdit = (work) => {
    setWallMessage('')
    setWallError('')
    setEditingWallWork(work)
    setWallTitle(work.title || '')
    setWallUrl(work.original_video_url || work.video_url || '')
    setWallCover(null)
    setActiveView('wallSubmit')
  }

  const submitWallWork = async (event) => {
    event.preventDefault()
    setWallMessage('')
    setWallError('')
    const title = wallTitle.trim()
    const videoUrl = wallUrl.trim()
    if (!title || !videoUrl) {
      setWallError('请填写作品名称和作品链接。')
      return
    }
    setWallSubmitting(true)
    try {
      if (wallCover) setWallMessage('正在压缩并上传封面，请稍等...')
      const coverFile = await prepareWallCover(wallCover)
      if (editingWallWork?.id) {
        await wallWorksApi.update(editingWallWork.id, title, videoUrl, coverFile)
      } else {
        await wallWorksApi.create(title, videoUrl, coverFile)
      }
      setEditingWallWork(null)
      setWallTitle('')
      setWallUrl('')
      setWallCover(null)
      setWallMessage(editingWallWork?.id ? '作品已更新。' : '已添加到作品墙。')
      await reloadWallWorks()
      await reloadGallery()
      if (user?.class_name) setActiveClass(user.class_name)
      setActiveView('gallery')
    } catch (error) {
      setWallError(error.message || '添加失败，请重试。')
    } finally {
      setWallSubmitting(false)
    }
  }

  const deleteWallWork = async (work) => {
    if (!work?.id) return
    const ok = window.confirm(`确定删除「${work.title || '这个作品'}」吗？删除后作品墙不再显示。`)
    if (!ok) return
    setWallError('')
    setWallMessage('')
    try {
      await wallWorksApi.delete(work.id)
      await reloadWallWorks()
      await reloadGallery()
      setWallMessage('作品已删除。')
    } catch (error) {
      setWallError(error.message || '删除失败，请重试。')
    }
  }

  const reloadGalleryWithMessage = async (message) => {
    await reloadGallery()
    setGalleryMessage(message)
  }

  const toggleWallLike = async (work) => {
    if (!work?.id) return
    setGalleryError('')
    setGalleryMessage('')
    setFeedbackWorkingId(`like-${work.id}`)
    try {
      if (work.liked_by_me) {
        await wallWorksApi.unlike(work.id)
        await reloadGalleryWithMessage('已取消点赞。')
      } else {
        await wallWorksApi.like(work.id)
        await reloadGalleryWithMessage(isTeacher ? '已教师点赞。' : '已点赞。')
      }
    } catch (error) {
      setGalleryError(error.message || '点赞失败，请重试。')
    } finally {
      setFeedbackWorkingId('')
    }
  }

  const openCommentEditor = (work, comment = null) => {
    setGalleryError('')
    setGalleryMessage('')
    setCommentEditor({ workId: work.id, commentId: comment?.id || null, content: comment?.content || '' })
  }

  const saveTeacherComment = async (work) => {
    const content = commentEditor?.content?.trim() || ''
    if (!content) {
      setGalleryError('请填写教师评语。')
      return
    }
    setGalleryError('')
    setGalleryMessage('')
    setFeedbackWorkingId(`comment-${work.id}`)
    try {
      if (commentEditor.commentId) {
        await wallWorksApi.updateComment(commentEditor.commentId, content)
        await reloadGalleryWithMessage('教师评语已更新。')
      } else {
        await wallWorksApi.createComment(work.id, content)
        await reloadGalleryWithMessage('教师评语已发布。')
      }
      setCommentEditor(null)
    } catch (error) {
      setGalleryError(error.message || '保存教师评语失败。')
    } finally {
      setFeedbackWorkingId('')
    }
  }

  const deleteTeacherComment = async (comment) => {
    if (!window.confirm('确定删除这条教师评语吗？')) return
    setGalleryError('')
    setGalleryMessage('')
    setFeedbackWorkingId(`delete-comment-${comment.id}`)
    try {
      await wallWorksApi.deleteComment(comment.id)
      await reloadGalleryWithMessage('教师评语已删除。')
    } catch (error) {
      setGalleryError(error.message || '删除教师评语失败。')
    } finally {
      setFeedbackWorkingId('')
    }
  }

  const toggleTeacherLinkStatus = async (work) => {
    const expired = work.teacher_link_status !== 'expired'
    const prompt = expired ? '标记后会在作品下显示“教师标记：链接已失效”。确认继续吗？' : '确认撤销链接失效标记吗？'
    if (!window.confirm(prompt)) return
    setGalleryError('')
    setGalleryMessage('')
    setFeedbackWorkingId(`link-${work.id}`)
    try {
      await wallWorksApi.setLinkStatus(work.id, expired)
      await reloadGalleryWithMessage(expired ? '已标记链接失效。' : '已恢复为未标记状态。')
    } catch (error) {
      setGalleryError(error.message || '更新链接状态失败。')
    } finally {
      setFeedbackWorkingId('')
    }
  }

  const handleLogout = () => {
    logout()
    setSelectedProject(null)
    setProjects([])
    setGalleryItems([])
    setActiveView('studio')
  }

  if (loading) return <div className="manju-portal-loading">加载中...</div>

  return (
    <div className="manju-portal">
      <aside className="manju-side">
        <div className="manju-brand">
          <span>AI MANJU</span>
          <h1>AI漫剧一键生成</h1>
        </div>

        {user ? (
          <div className="manju-user">
            <strong>{user.name || user.email || user.student_id}</strong>
            <span>{user.class_name || '未填班级'} · {user.student_id}</span>
            <button type="button" onClick={() => setShowAccount(true)}>改班级</button>
          </div>
        ) : (
          <div className="manju-user manju-user-public">
            <strong>未登录</strong>
            <span>可先查看创作台，需要保存时再登录</span>
          </div>
        )}

        <div className="manju-nav">
          <button className={activeView === 'studio' ? 'active' : ''} onClick={() => setActiveView('studio')}>
            创作工作台
          </button>
          <button className={activeView === 'gallery' ? 'active' : ''} onClick={() => setActiveView('gallery')}>
            小作品墙
          </button>
          <button className={activeView === 'excellent' ? 'active' : ''} onClick={() => setActiveView('excellent')}>
            优秀作品欣赏
          </button>
        </div>

        <div className="manju-project-head">
          <h2>我的 / 小组作品</h2>
          <button type="button" onClick={user ? createDraft : () => openAuth('login')}>新建</button>
        </div>

        <div className="manju-project-list">
          {!user && <div className="manju-project-empty">登录后显示保存过的作品</div>}
          {user && projects.length === 0 && <div className="manju-project-empty">还没有保存作品</div>}
          {projects.map((project) => (
            <button
              type="button"
              key={project.id}
              className={selectedProject?.id === project.id ? 'active' : ''}
              onClick={() => {
                setSelectedProject(project)
                setActiveView('studio')
              }}
            >
              <strong>{project.scope === 'group' ? `【小组最终稿】${project.title}` : project.title}</strong>
              <span>{project.scope === 'group' ? `${project.group_name || '小组'} · ` : '个人草稿 · '}{formatDate(project.updated_at)}</span>
            </button>
          ))}
        </div>

        {user && (
          <>
            <div className="manju-wall-head">
              <h2>我的上墙</h2>
              <button
                type="button"
                className={!canSubmitWallWork ? 'is-locked' : ''}
                onClick={openWallSubmit}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={`manju-wall-submit-shortcut ${!canSubmitWallWork ? 'is-locked' : ''}`}
              onClick={openWallSubmit}
            >
              <strong>{canSubmitWallWork ? '添加上墙作品' : '组长统一上墙'}</strong>
              <span>{canSubmitWallWork ? '名称 / 链接 / 封面' : '组员把最终链接交给组长'}</span>
            </button>
            {wallWorkItems.length > 0 && (
              <div className="manju-wall-mini-list">
                {wallWorkItems.slice(0, 3).map((work) => (
                  <div key={work.id} className="manju-wall-mini-item">
                    <a href={work.video_url || '#'} target="_blank" rel="noreferrer">{work.title}</a>
                    {work.can_manage && (
                      <div className="manju-wall-mini-actions">
                        <button type="button" onClick={() => openWallEdit(work)}>编辑</button>
                        <button type="button" className="danger" onClick={() => deleteWallWork(work)}>删除</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="manju-side-bottom">
          <button
            type="button"
            className={`manju-guide-bottom ${activeView === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveView('guide')}
          >
            使用说明
          </button>
          {user ? (
            <button type="button" className="manju-logout" onClick={handleLogout}>退出登录</button>
          ) : (
            <div className="manju-auth-shortcuts">
              <button type="button" onClick={() => openAuth('login')}>登录</button>
              <button type="button" onClick={() => openAuth('register')}>注册</button>
            </div>
          )}
        </div>
      </aside>

      <main className="manju-main">
        {activeView === 'studio' ? (
          <>
            {user && <ManjuGroupWidget onChanged={handleGroupChanged} />}
            <AiManjuStudio
              key={studioKey}
              projectId={selectedProject?.id || null}
              projectData={selectedProject?.id ? selectedProject : null}
              isGroupMember={isGroupMember}
              isGroupLeader={isGroupLeader}
              groupName={myGroup?.name || ''}
            />
          </>
        ) : activeView === 'guide' ? (
          <AiManjuGuide />
        ) : activeView === 'excellent' ? (
          <ExcellentWorks />
        ) : activeView === 'wallSubmit' && user ? (
          <section className="manju-wall-submit">
            <ManjuGroupWidget onChanged={handleGroupChanged} />
            <div className="manju-wall-submit-panel">
              <div className="manju-wall-submit-head">
                <div>
                  <span>ADD TO WALL</span>
                  <h2>{editingWallWork ? '编辑上墙作品' : '添加上墙作品'}</h2>
                </div>
                <button type="button" onClick={() => setActiveView('gallery')}>看作品墙</button>
              </div>

              {!canUseWallForm ? (
                <div className="manju-wall-leader-only">
                  <strong>请组长统一提交小组作品</strong>
                  <p>组员可以继续各自创作，选出最终视频后，把作品链接、标题和封面交给组长添加到作品墙。</p>
                  <button type="button" onClick={() => setActiveView('studio')}>返回创作</button>
                </div>
              ) : (
              <form className="manju-wall-form" onSubmit={submitWallWork}>
                <label>
                  <span>作品名称</span>
                  <input
                    value={wallTitle}
                    onChange={(event) => setWallTitle(event.target.value)}
                    placeholder="例如：城市奇遇第一集"
                    maxLength={80}
                  />
                </label>
                <label>
                  <span>作品链接</span>
                  <input
                    value={wallUrl}
                    onChange={(event) => setWallUrl(event.target.value)}
                    placeholder="可粘贴抖音 / B站 / 快手 / 小红书分享链接或整段分享文案"
                    inputMode="url"
                  />
                </label>
                {wallUrlNote && <p className={`manju-wall-link-note ${extractFirstUrl(wallUrl) ? '' : 'error'}`}>{wallUrlNote}</p>}
                <label>
                  <span>作品封面</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.jfif,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null
                      setWallError('')
                      if (file && !isSupportedWallCover(file)) {
                        setWallCover(null)
                        event.target.value = ''
                        setWallError('封面只支持 JPG、PNG、WebP、GIF。手机 HEIC 图片请先截图或转成 JPG 再上传')
                        return
                      }
                      setWallCover(file)
                    }}
                  />
                </label>
                {editingWallWork?.cover_url && !wallCover && <p className="manju-wall-file-name">不重新选择封面时，将保留原封面。</p>}
                {wallCover && <p className="manju-wall-file-name">{wallCover.name}，提交时会自动压缩成小封面。</p>}
                {wallError && <p className="manju-wall-error">{wallError}</p>}
                {wallMessage && <p className="manju-wall-message">{wallMessage}</p>}
                <div className="manju-wall-actions">
                  <button type="button" onClick={() => setActiveView('studio')}>返回创作</button>
                  <button type="submit" disabled={wallSubmitting}>
                    {wallSubmitting ? '保存中...' : editingWallWork ? '保存修改' : '添加上墙'}
                  </button>
                </div>
              </form>
              )}
            </div>
          </section>
        ) : !user ? (
          <LoginRequired onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} />
        ) : (
          <section className="manju-gallery">
            <div className="manju-gallery-head">
              <div>
                <h2>AI漫剧作品墙</h2>
                <p>按班级查看作品；个人做就显示个人作品，加入小组后保存就显示小组作品。</p>
              </div>
              <div className="manju-class-cards" aria-label="选择班级">
                {classOptions.map((className) => (
                  <button
                    key={className}
                    type="button"
                    className={activeClass === className ? 'active' : ''}
                    onClick={() => setActiveClass(className)}
                  >
                    <strong>{className}</strong>
                    <span>{new Set(galleryItems.filter((item) => item.class_name === className).map((item) => item.group_id ? `group-${item.group_id}` : `student-${item.student_id || item.author_name}`)).size} 张卡片</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="manju-gallery-grid">
              {galleryCards.map((card) => (
                <article key={card.key} className={`manju-gallery-card ${card.card_type === 'group' ? 'group' : 'individual'}`}>
                  <div className="manju-gallery-body">
                    <div className="manju-gallery-owner">
                      <span>{card.card_type === 'group' ? '小组作品' : '个人作品'}</span>
                      <h3>{card.title}</h3>
                      <p>{card.subtitle}</p>
                    </div>
                    <div className="manju-gallery-work-list">
                      {card.works.map((work, index) => {
                        const note = wallLinkNote(work)
                        return (
                          <article key={work.id} className={`manju-gallery-work-item ${work.link_status === 'invalid' ? 'is-invalid' : ''} ${work.teacher_link_status === 'expired' ? 'is-teacher-expired' : ''}`}>
                            <a className="manju-gallery-work-open" href={work.video_url || '#'} target="_blank" rel="noreferrer">
                              <div className="manju-gallery-work-cover">
                                {work.cover_url ? (
                                  <img src={resolveApiAssetUrl(work.cover_url)} alt={work.title || 'cover'} loading="lazy" />
                                ) : (
                                  <span>AI漫剧</span>
                                )}
                              </div>
                              <div>
                                <strong>{work.title || `作品 ${index + 1}`}</strong>
                                <span>{work.item_number || 'AI漫剧'} · 提交：{formatDateTime(work.created_at) || formatDate(work.created_at)}</span>
                                {note && (
                                  <small className={`manju-gallery-link-note ${note.type}`}>
                                    {note.text}
                                  </small>
                                )}
                                {work.teacher_link_status === 'expired' && (
                                  <small className="manju-gallery-link-note teacher-expired">教师标记：链接已失效</small>
                                )}
                              </div>
                            </a>
                            <div className="manju-gallery-feedback-bar">
                              {isTeacher ? (
                                <>
                                  <span>同学点赞 {work.student_like_count || 0}</span>
                                  <button
                                    type="button"
                                    className={work.liked_by_me ? 'is-active' : ''}
                                    onClick={() => toggleWallLike(work)}
                                    disabled={feedbackWorkingId === `like-${work.id}`}
                                  >
                                    {work.liked_by_me ? '已教师点赞' : '教师点赞'} {work.teacher_like_count || 0}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={work.liked_by_me ? 'is-active' : ''}
                                    onClick={() => toggleWallLike(work)}
                                    disabled={feedbackWorkingId === `like-${work.id}`}
                                  >
                                    {work.liked_by_me ? '已点赞' : '同学点赞'} {work.student_like_count || 0}
                                  </button>
                                  <span>教师点赞 {work.teacher_like_count || 0}</span>
                                </>
                              )}
                            </div>
                            {(work.comments || []).length > 0 && (
                              <div className="manju-gallery-teacher-comments">
                                {work.comments.map((comment) => (
                                  <div key={comment.id} className="manju-gallery-teacher-comment">
                                    <div>
                                      <strong>教师评语</strong>
                                      <span>{formatDateTime(comment.updated_at) || formatDate(comment.updated_at)}</span>
                                    </div>
                                    <p>{comment.content}</p>
                                    {isTeacher && comment.can_manage && (
                                      <div className="manju-gallery-comment-actions">
                                        <button type="button" onClick={() => openCommentEditor(work, comment)}>编辑评语</button>
                                        <button type="button" className="danger" onClick={() => deleteTeacherComment(comment)} disabled={feedbackWorkingId === `delete-comment-${comment.id}`}>删除评语</button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {isTeacher && (
                              <div className="manju-gallery-teacher-tools">
                                {commentEditor?.workId === work.id ? (
                                  <>
                                    <textarea
                                      value={commentEditor.content}
                                      onChange={(event) => setCommentEditor((current) => ({ ...current, content: event.target.value }))}
                                      placeholder="填写教师评语"
                                      maxLength={1000}
                                    />
                                    <div>
                                      <button type="button" onClick={() => setCommentEditor(null)}>取消</button>
                                      <button type="button" onClick={() => saveTeacherComment(work)} disabled={feedbackWorkingId === `comment-${work.id}`}>
                                        {commentEditor.commentId ? '保存评语' : '发布评语'}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <button type="button" onClick={() => openCommentEditor(work)}>写教师评语</button>
                                )}
                                <button
                                  type="button"
                                  className={work.teacher_link_status === 'expired' ? 'danger' : ''}
                                  onClick={() => toggleTeacherLinkStatus(work)}
                                  disabled={feedbackWorkingId === `link-${work.id}`}
                                >
                                  {work.teacher_link_status === 'expired' ? '恢复有效' : '标记链接失效'}
                                </button>
                              </div>
                            )}
                            {work.can_manage && (
                              <div className="manju-gallery-work-actions">
                                <a href={work.video_url || '#'} target="_blank" rel="noreferrer">打开</a>
                                <button type="button" onClick={() => openWallEdit(work)}>编辑</button>
                                <button type="button" className="danger" onClick={() => deleteWallWork(work)}>删除</button>
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </div>
                </article>
              ))}
              {galleryCards.length === 0 && <div className="manju-gallery-empty">新系统还没有可展示的 AI漫剧作品。</div>}
            </div>
            {galleryError && <p className="manju-gallery-feedback-message error">{galleryError}</p>}
            {galleryMessage && <p className="manju-gallery-feedback-message">{galleryMessage}</p>}
          </section>
        )}
      </main>

      {showAuth && <AuthDialog initialMode={authMode} classOptions={registerClassOptions} onClose={() => setShowAuth(false)} />}
      {showAccount && <AccountPanel classOptions={registerClassOptions} onClose={() => setShowAccount(false)} />}
    </div>
  )
}
