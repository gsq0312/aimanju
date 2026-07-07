import { useEffect, useState } from 'react'
import { groups as groupsApi } from '../api'

const GROUP_NAME_SEEDS = [
  '赛博武侠组',
  '唐朝奇遇组',
  '星际漫剧组',
  '长安异能组',
  '机甲侠客组',
  '山海异兽组',
  '月下江湖组',
  '霓虹修真组',
  '青铜神话组',
  '未来古风组',
  '百鬼夜行组',
  '云端少年组',
]

function randomGroupName() {
  return GROUP_NAME_SEEDS[Math.floor(Math.random() * GROUP_NAME_SEEDS.length)]
}

export default function ManjuGroupWidget({ onChanged }) {
  const [status, setStatus] = useState(null)
  const [groupName, setGroupName] = useState(() => randomGroupName())
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [workingId, setWorkingId] = useState('')

  const loadStatus = async () => {
    setLoading(true)
    try {
      const data = await groupsApi.status()
      setStatus(data)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '小组信息加载失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const refresh = async () => {
    await loadStatus()
    onChanged?.()
  }

  const handleCreate = async () => {
    const name = groupName.trim()
    if (!name) {
      setMessage({ type: 'error', text: '请先填写小组名称' })
      return
    }
    setWorkingId('create')
    setMessage({ type: '', text: '' })
    try {
      await groupsApi.create({ name })
      setGroupName(randomGroupName())
      setMessage({ type: 'success', text: '小组已创建' })
      await refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '创建失败' })
    } finally {
      setWorkingId('')
    }
  }

  const handleJoin = async (groupId) => {
    setWorkingId(`join-${groupId}`)
    setMessage({ type: '', text: '' })
    try {
      await groupsApi.join(groupId)
      setMessage({ type: 'success', text: '已加入小组' })
      await refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '加入失败' })
    } finally {
      setWorkingId('')
    }
  }

  const handleLeave = async () => {
    if (!window.confirm('确认退出当前小组吗？退出后可以重新加入其他小组。')) return
    setWorkingId('leave')
    setMessage({ type: '', text: '' })
    try {
      await groupsApi.leave()
      setMessage({ type: 'success', text: '已退出小组' })
      await refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error.message || '退出失败' })
    } finally {
      setWorkingId('')
    }
  }

  const myGroup = status?.my_group
  const groups = status?.groups || []

  return (
    <section className="manju-group-widget">
      <div className="manju-group-head">
        <div>
          <p>AI漫剧小组</p>
          <h2>{myGroup ? myGroup.name : '个人或小组都可以提交'}</h2>
        </div>
        <span>{loading ? '加载中' : myGroup ? '小组作品' : '个人作品可直接上墙'}</span>
      </div>

      {message.text && <div className={`manju-group-message ${message.type}`}>{message.text}</div>}

      {myGroup ? (
        <div className="manju-group-current">
          <div className="manju-group-members">
            {myGroup.members.map((member) => (
              <span key={member.user_id}>{member.name}{member.role === 'leader' ? ' · 组长' : ''}</span>
            ))}
          </div>
          <p>
            {myGroup.has_work
              ? '当前小组已有上墙作品，后续添加会继续显示在同一张小组作品卡片里。'
              : '你的小组还没有上墙作品，添加后作品墙会显示为小组作品。'}
          </p>
          <button type="button" className="manju-group-secondary" onClick={handleLeave} disabled={workingId === 'leave'}>
            {workingId === 'leave' ? '退出中...' : '退出小组'}
          </button>
        </div>
      ) : (
        <div className="manju-group-create">
          <p>不加入小组也可以直接添加个人作品；加入小组后，上墙会变成小组作品。</p>
          <div className="manju-group-create-row">
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="例如：第一组、爆款漫剧组"
            />
            <button type="button" onClick={handleCreate} disabled={workingId === 'create'}>
              {workingId === 'create' ? '创建中...' : '创建小组'}
            </button>
          </div>
          <div className="manju-group-toolbar">
            <button type="button" className="manju-group-refresh" onClick={refresh} disabled={loading}>
              {loading ? '刷新中...' : '刷新小组列表'}
            </button>
            <span>同学新建小组后，点刷新就能看到本班最新小组。</span>
          </div>
        </div>
      )}

      {!myGroup && groups.length > 0 && (
        <div className="manju-group-list">
          {groups.map((group) => (
            <article key={group.id} className="manju-group-item">
              <div>
                <strong>{group.name}</strong>
                <span className="manju-group-count">
                  {group.members.length}/{group.max_members || 4} 人
                </span>
                <span>{group.members.map((member) => member.name).join('、') || '暂无成员'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleJoin(group.id)}
                disabled={!group.can_join || workingId === `join-${group.id}`}
              >
                {group.can_join ? (workingId === `join-${group.id}` ? '加入中...' : '加入') : '已满'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
