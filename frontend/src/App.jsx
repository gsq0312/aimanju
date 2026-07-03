import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { auth as authApi, gallery as galleryApi, projects as projectApi, resolveApiAssetUrl, wallWorks as wallWorksApi } from './api'
import AiManjuGuide from './components/AiManjuGuide.jsx'
import AiManjuStudio from './components/AiManjuStudio.jsx'
import ManjuGroupWidget from './components/ManjuGroupWidget.jsx'

const emptyForm = {
  name: '',
  email: '',
  studentId: '',
  className: '',
  password: '',
  confirmPassword: '',
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
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

  useEffect(() => {
    reloadProjects()
    reloadGallery()
    reloadWallWorks()
    const handler = (event) => {
      const savedProject = event?.detail?.project
      if (savedProject?.id) {
        setProjects((prev) => [savedProject, ...prev.filter((project) => project.id !== savedProject.id)])
        setSelectedProject(savedProject)
      }
      reloadProjects()
      reloadGallery()
      reloadWallWorks()
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

  const studioKey = useMemo(() => selectedProject?.id || selectedProject?.resetToken || 'new', [selectedProject])

  const createDraft = () => {
    setSelectedProject({
      resetToken: Date.now(),
      title: '未保存AI漫剧',
    })
    setActiveView('studio')
  }

  const openWallSubmit = () => {
    setWallMessage('')
    setWallError('')
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
      await wallWorksApi.create(title, videoUrl, wallCover)
      setWallTitle('')
      setWallUrl('')
      setWallCover(null)
      setWallMessage('已添加到作品墙。')
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
              <strong>{project.scope === 'group' ? `【${project.group_name || '小组'}】${project.title}` : project.title}</strong>
              <span>{project.scope === 'group' ? '小组 · ' : ''}{formatDate(project.updated_at)}</span>
            </button>
          ))}
        </div>

        {user && (
          <>
            <div className="manju-wall-head">
              <h2>我的上墙</h2>
              <button type="button" onClick={openWallSubmit}>+</button>
            </div>
            <button type="button" className="manju-wall-submit-shortcut" onClick={openWallSubmit}>
              <strong>添加上墙作品</strong>
              <span>名称 / 链接 / 封面</span>
            </button>
            {wallWorkItems.length > 0 && (
              <div className="manju-wall-mini-list">
                {wallWorkItems.slice(0, 3).map((work) => (
                  <a key={work.id} href={work.video_url} target="_blank" rel="noreferrer">{work.title}</a>
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
            {user && <ManjuGroupWidget onChanged={() => { reloadProjects(); reloadGallery() }} />}
            <AiManjuStudio key={studioKey} projectId={selectedProject?.id || null} projectData={selectedProject?.id ? selectedProject : null} />
          </>
        ) : activeView === 'guide' ? (
          <AiManjuGuide />
        ) : activeView === 'wallSubmit' && user ? (
          <section className="manju-wall-submit">
            <ManjuGroupWidget onChanged={() => { reloadProjects(); reloadGallery(); reloadWallWorks() }} />
            <div className="manju-wall-submit-panel">
              <div className="manju-wall-submit-head">
                <div>
                  <span>ADD TO WALL</span>
                  <h2>添加上墙作品</h2>
                </div>
                <button type="button" onClick={() => setActiveView('gallery')}>看作品墙</button>
              </div>

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
                    placeholder="https://..."
                    inputMode="url"
                  />
                </label>
                <label>
                  <span>作品封面</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setWallCover(event.target.files?.[0] || null)}
                  />
                </label>
                {wallCover && <p className="manju-wall-file-name">{wallCover.name}</p>}
                {wallError && <p className="manju-wall-error">{wallError}</p>}
                {wallMessage && <p className="manju-wall-message">{wallMessage}</p>}
                <div className="manju-wall-actions">
                  <button type="button" onClick={() => setActiveView('studio')}>返回创作</button>
                  <button type="submit" disabled={wallSubmitting}>
                    {wallSubmitting ? '添加中...' : '添加上墙'}
                  </button>
                </div>
              </form>
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
                      {card.works.map((work, index) => (
                        <a key={work.id} href={work.video_url} target="_blank" rel="noreferrer" className="manju-gallery-work-item">
                          <div className="manju-gallery-work-cover">
                            {work.cover_url ? (
                              <img src={resolveApiAssetUrl(work.cover_url)} alt={work.title || 'cover'} loading="lazy" />
                            ) : (
                              <span>AI漫剧</span>
                            )}
                          </div>
                          <div>
                            <strong>{work.title || `作品 ${index + 1}`}</strong>
                            <span>{work.item_number || 'AI漫剧'} · {formatDate(work.updated_at)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
              {galleryCards.length === 0 && <div className="manju-gallery-empty">新系统还没有可展示的 AI漫剧作品。</div>}
            </div>
          </section>
        )}
      </main>

      {showAuth && <AuthDialog initialMode={authMode} classOptions={registerClassOptions} onClose={() => setShowAuth(false)} />}
      {showAccount && <AccountPanel classOptions={registerClassOptions} onClose={() => setShowAccount(false)} />}
    </div>
  )
}
