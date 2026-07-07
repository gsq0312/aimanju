import './AiManjuGuide.css'

const guideSections = [
  {
    step: '入口',
    title: '打开系统后先看这三个位置',
    image: 'aimanju-guide/01_overview.jpg',
    points: [
      '左侧是系统导航，可以进入创作工作台、作品墙和使用说明。',
      '上方 01-06 是主流程导航，可以点任意步骤查看。',
      '登录 / 注册在左下角，需要保存作品、查看自己的作品时再使用。',
      '主线先按 1-7 步完成作品，第 8 步查看作品墙。',
    ],
  },
  {
    step: '1',
    title: '一句话故事：先把冲突立住',
    image: 'aimanju-guide/02_story_action.jpg',
    points: [
      '先点“全部随机”，系统会随机选择题材世界、人物数量和典型场景。',
      '点“DeepSeek生成一句话故事”，右侧会生成一句话故事。',
      '学生也可以自己写，不一定必须使用 AI 的结果。',
      '完成标准：故事里要有明确人物、场景和冲突。',
    ],
  },
  {
    step: '2',
    title: '扩写梗概：按班级要求改总时长',
    image: 'aimanju-guide/03_synopsis.jpg',
    points: [
      '不要死认默认 4 分 30 秒，先看老师要求。',
      '3 分钟约 18 段，4 分 30 秒约 27 段，6 分钟约 36 段。',
      '生成梗概后，把文本里的总时长改成老师要求的时长。',
      '完成标准：故事梗概里的总时长和老师要求一致。',
    ],
  },
  {
    step: '3',
    title: '画面风格：复制画风提示词',
    image: 'aimanju-guide/04_style.jpg',
    points: [
      '左侧先选风格分类，中间点具体风格图片。',
      '选中后右侧会出现对应画风提示词。',
      '点“复制当前风格提示词”，后面生成角色图、首帧、尾帧时都要用。',
      '一部漫剧尽量保持同一个画风。',
    ],
  },
  {
    step: '4',
    title: '角色设定卡：生成设定，再去豆包做角色图',
    image: 'aimanju-guide/05_character.jpg',
    points: [
      '系统根据前面的故事、梗概和画风生成角色设定卡。',
      '角色设定卡是给豆包生成角色参考图用的文字。',
      '把角色提示词复制到豆包，生成角色图，再传回系统。',
      '完成标准：主要角色都有清楚、稳定的参考图。',
    ],
  },
  {
    step: '5',
    title: '分段提示词：改时长和段数',
    image: 'aimanju-guide/06_segments.jpg',
    points: [
      '默认逻辑是每 10 秒一段，段数要和老师要求对应。',
      '需要改提示词开头关于总时长、每段 10 秒、总段数的几句话。',
      '把修改后的大提示词复制到 DeepSeek 或豆包，让它把分段结果全部输出完。',
      '输出完以后，把完整结果复制回来，粘进系统。',
    ],
  },
  {
    step: '6',
    title: '首帧 / 尾帧：从分段结果里找提示词',
    image: 'aimanju-guide/06_segments.jpg',
    points: [
      '每一段都应该有首帧提示词和尾帧提示词。',
      '先复制首帧提示词到豆包生成首帧图。',
      '再复制尾帧提示词到豆包生成尾帧图。',
      '把生成好的首帧图、尾帧图贴回系统对应位置。',
    ],
  },
  {
    step: '7',
    title: '最终预览与保存：检查完整后再保存',
    image: 'aimanju-guide/07_preview_save.jpg',
    points: [
      '点“最终预览”，检查故事、梗概、画风、角色、分段提示词和首尾帧。',
      '发现时长、段数或角色不一致，就回到前面的步骤修改。',
      '确认没有问题后，点“保存作品”或“保存修改”。',
      '保存后，左侧“我的作品”里会出现这个作品。',
    ],
  },
  {
    step: '8',
    title: '作品墙：看自己和同学的作品',
    image: 'aimanju-guide/11_gallery.jpg',
    points: [
      '点“作品墙”进入展示页。',
      '先选择班级，只看本班或指定班级的作品。',
      '作品卡片会按学生或小组整理，卡片里列出添加上墙的作品。',
      '这里展示的是新系统添加上墙的数据，不读取旧学生系统的数据。',
    ],
  },
]

export default function AiManjuGuide() {
  return (
    <section className="ai-manju-guide">
      <header className="ai-manju-guide-hero">
        <span>GUIDE</span>
        <h2>AI漫剧一键生成使用说明</h2>
        <p>按顺序完成故事、梗概、画风、角色、分段、首尾帧和保存。登录注册入口在左下角。</p>
      </header>

      <div className="ai-manju-guide-flow">
        {guideSections.map((section) => (
          <a key={section.step} href={`#guide-${section.step}`}>
            <strong>{section.step}</strong>
            <span>{section.title}</span>
          </a>
        ))}
      </div>

      <div className="ai-manju-guide-sections">
        {guideSections.map((section) => (
          <article id={`guide-${section.step}`} className="ai-manju-guide-section" key={section.step}>
            <div className="ai-manju-guide-section-head">
              <span>{section.step}</span>
              <h3>{section.title}</h3>
            </div>
            <figure>
              <img src={section.image} alt={section.title} loading="lazy" />
            </figure>
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="ai-manju-guide-appendix">
        <article>
          <h3>附录：登录 / 注册</h3>
          <img src="aimanju-guide/08_register.jpg" alt="登录注册界面" loading="lazy" />
          <ul>
            <li>注册时填写姓名、邮箱、学号，班级从下拉列表里选择。</li>
            <li>新系统不需要收邮件，注册成功后会直接进入系统。</li>
            <li>学生填错班级时，可以登录后在左侧个人信息里点“改班级”。</li>
          </ul>
        </article>

        <article>
          <h3>附录：小组方法</h3>
          <img src="aimanju-guide/10_group_widget.jpg" alt="小组模块按钮说明" loading="lazy" />
          <ul>
            <li>不加入小组：直接做作品，添加上墙后作品墙显示个人作品卡片。</li>
            <li>自己建小组：输入小组名，点“创建小组”。</li>
            <li>加入别人小组：从同班小组列表点“加入”。</li>
            <li>小组上墙：作品墙显示小组作品卡片，并显示小组名和成员。</li>
          </ul>
        </article>
      </section>
    </section>
  )
}
