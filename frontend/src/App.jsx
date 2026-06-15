import { useEffect, useMemo, useState } from 'react'
import { Edit3, Images, LogOut, Plus, UserRound } from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { gallery as galleryApi, projects as projectApi } from './api'
import AiManjuStudio from './components/AiManjuStudio.jsx'

const emptyForm = {
  name: '',
  email: '',
  studentId: '',
  className: '',
  password: '',
  confirmPassword: '',
}

function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
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
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div>
          <h1>AI漫剧一键生成</h1>
          <p>新系统独立注册、独立保存作品、独立作品墙，不读取旧学生系统数据。</p>
        </div>
      </section>
      <form className="auth-panel" onSubmit={submit}>
        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>登录</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>注册</button>
        </div>

        {mode === 'register' && (
          <>
            <label>姓名<input value={form.name} onChange={(e) => update('name', e.target.value)} autoComplete="name" /></label>
            <label>邮箱<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} autoComplete="email" /></label>
            <label>学号<input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} /></label>
            <label>班级<input value={form.className} onChange={(e) => update('className', e.target.value)} placeholder="如：25级电商01班" /></label>
          </>
        )}

        {mode === 'login' && (
          <label>学号 / 邮箱<input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} autoComplete="username" /></label>
        )}
        <label>密码<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {mode === 'register' && (
          <label>确认密码<input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} autoComplete="new-password" /></label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="primary-btn" disabled={submitting}>{submitting ? '处理中...' : mode === 'login' ? '登录' : '注册并进入'}</button>
      </form>
    </main>
  )
}

function ProfilePanel({ onClose }) {
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
    <div className="modal-backdrop">
      <form className="profile-modal" onSubmit={save}>
        <h2>个人资料</h2>
        <label>姓名<input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label>邮箱<input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} /></label>
        <label>学号<input value={form.student_id} onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))} /></label>
        <label>班级<input value={form.class_name} onChange={(e) => setForm((prev) => ({ ...prev, class_name: e.target.value }))} /></label>
        {message && <p className="form-note">{message}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>关闭</button>
          <button className="primary-btn" disabled={saving}>{saving ? '保存中...' : '保存'}</button>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const { user, loading, logout } = useAuth()
  const [activeView, setActiveView] = useState('studio')
  const [projects, setProjects] = useState([])
  const [galleryItems, setGalleryItems] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

  const reloadProjects = async () => {
    if (!user) return
    const data = await projectApi.listManju().catch(() => [])
    setProjects(data || [])
  }

  const reloadGallery = async () => {
    const data = await galleryApi.list().catch(() => [])
    setGalleryItems(data || [])
  }

  useEffect(() => {
    if (!user) return
    reloadProjects()
    reloadGallery()
    const handler = () => {
      reloadProjects()
      reloadGallery()
    }
    window.addEventListener('ai-manju-projects-changed', handler)
    return () => window.removeEventListener('ai-manju-projects-changed', handler)
  }, [user])

  const studioKey = useMemo(() => selectedProject?.id || 'new', [selectedProject])

  if (loading) return <div className="app-loading">加载中...</div>
  if (!user) return <AuthScreen />

  return (
    <div className="app-shell">
      <aside className="app-side">
        <div className="brand-block">
          <strong>AI漫剧一键生成</strong>
          <span>{user.name} · {user.class_name || '未填班级'}</span>
        </div>
        <nav className="side-nav">
          <button className={activeView === 'studio' ? 'active' : ''} onClick={() => setActiveView('studio')}><Edit3 size={17} />创作台</button>
          <button className={activeView === 'gallery' ? 'active' : ''} onClick={() => setActiveView('gallery')}><Images size={17} />作品墙</button>
          <button onClick={() => setShowProfile(true)}><UserRound size={17} />个人资料</button>
        </nav>
        <section className="project-list">
          <div className="project-list-head">
            <span>我的作品</span>
            <button title="新建作品" onClick={() => { setSelectedProject(null); setActiveView('studio') }}><Plus size={16} /></button>
          </div>
          {projects.length === 0 && <p className="empty-text">还没有保存作品</p>}
          {projects.map((project) => (
            <button key={project.id} className={selectedProject?.id === project.id ? 'project-row active' : 'project-row'} onClick={() => { setSelectedProject(project); setActiveView('studio') }}>
              <strong>{project.title}</strong>
              <span>{new Date(project.updated_at).toLocaleString('zh-CN')}</span>
            </button>
          ))}
        </section>
        <button className="logout-btn" onClick={logout}><LogOut size={17} />退出登录</button>
      </aside>

      <main className="app-main">
        {activeView === 'studio' ? (
          <AiManjuStudio key={studioKey} projectId={selectedProject?.id || null} projectData={selectedProject || null} />
        ) : (
          <section className="gallery-page">
            <header>
              <h1>新系统作品墙</h1>
              <p>这里只展示在本系统注册和保存的 AI漫剧作品。</p>
            </header>
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <article className="gallery-card" key={item.id}>
                  <h2>{item.title}</h2>
                  <p>{item.author_name} · {item.class_name || '未填班级'}</p>
                  <span>{new Date(item.updated_at).toLocaleString('zh-CN')}</span>
                </article>
              ))}
              {galleryItems.length === 0 && <div className="gallery-empty">新系统还没有作品。</div>}
            </div>
          </section>
        )}
      </main>
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  )
}
