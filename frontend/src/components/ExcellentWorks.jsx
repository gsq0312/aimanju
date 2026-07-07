import { useMemo, useState } from 'react'
import { excellentWorkCategories, excellentWorks } from '../data/excellentWorks.js'

export default function ExcellentWorks() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const categories = useMemo(() => ['全部', ...excellentWorkCategories], [])
  const visibleWorks = useMemo(
    () => activeCategory === '全部' ? excellentWorks : excellentWorks.filter((work) => work.category === activeCategory),
    [activeCategory]
  )

  return (
    <section className="excellent-works">
      <header className="excellent-works-head">
        <div>
          <span>SHOWCASE</span>
          <h2>优秀作品欣赏</h2>
          <p>精选 AI 短剧、动画、音乐 MV 和创作流程案例，课堂演示时可直接打开观看。</p>
        </div>
        <strong>{visibleWorks.length} 个案例</strong>
      </header>

      <div className="excellent-works-tabs" aria-label="筛选优秀作品">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="excellent-works-grid">
        {visibleWorks.map((work, index) => (
          <article className="excellent-work-card" key={work.id}>
            <a className="excellent-work-cover" href={work.url} target="_blank" rel="noreferrer">
              <img src={work.cover} alt={work.title} loading="lazy" />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </a>
            <div className="excellent-work-body">
              <div className="excellent-work-meta">
                <span>{work.category}</span>
                {work.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h3>{work.title}</h3>
              <a className="excellent-work-link" href={work.url} target="_blank" rel="noreferrer">
                打开抖音
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
