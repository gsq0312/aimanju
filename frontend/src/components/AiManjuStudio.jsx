import { useEffect, useMemo, useState } from 'react';
import { ai, projects as projectApi, resolveApiAssetUrl, resolveApiPath, uploadForm } from '../api';

import { useWorkspace } from '../contexts/WorkspaceContext';
import { STYLE_DATA } from '../data/styleData';
import './AiManjuStudio.css';

const STORAGE_KEY = 'ai-manju-studio-draft-v3';
const STORAGE_KEY_FALLBACKS = [STORAGE_KEY, 'ai-manju-studio-draft-v2'];
const PUBLIC_ASSET_BASE = import.meta.env.BASE_URL || '/';
const getStyleReferenceImage = (styleKey, extension = 'jpeg') =>
  `${PUBLIC_ASSET_BASE}assets/style-images/${styleKey}/reference.${extension}`;

const GENRE_WORLD_SETS = [
{
  key: 'urban-power',
  name: '都市异能',
  locations: [
  '地铁末班车', '高架桥下', '老小区天台', '医院急诊走廊', '无人便利店', '写字楼消防通道',
  '直播公司会议室', '地下停车场', '网约车后座', '城市天台', '24小时洗衣店', '旧仓库',
  '心理咨询室', '公寓监控室', '商场中庭', '城中村出租屋', '夜班便利店', '数据机房',
  '警局询问室外', '河边步道']

},
{
  key: 'campus-youth',
  name: '校园青春',
  locations: [
  '高三教室', '操场看台', '食堂二楼', '图书馆自习区', '广播站', '实验楼走廊',
  '美术教室', '天台门口', '校门口便利店', '篮球馆', '医务室', '社团活动室',
  '考试考场', '毕业典礼后台', '旧教学楼楼梯间', '校史馆', '雨夜公交站', '宿舍楼下',
  '家长会现场', '空教室窗边']

},
{
  key: 'xianxia-cultivation',
  name: '仙侠修真',
  locations: [
  '宗门试炼台', '灵泉禁地', '剑冢深处', '天灯祭广场', '妖市入口', '药王谷竹楼',
  '悬空栈道', '寒潭石桥', '锁妖塔底层', '掌门闭关室', '灵舟甲板', '山门牌坊',
  '秘境裂缝', '符箓铺', '观星台', '幻境花海', '问心阵中央', '飞瀑洞府',
  '月下竹林', '古战场遗迹']

},
{
  key: 'fantasy-continent',
  name: '玄幻大陆',
  locations: [
  '觉醒广场', '斗技擂台', '家族议事堂', '灵兽山谷', '黑石矿洞', '拍卖行二楼',
  '古碑试炼场', '边境要塞', '学院演武场', '禁忌森林', '丹药铺后堂', '天阶石梯',
  '王城城门', '荒原祭坛', '地下遗迹', '佣兵酒馆', '传送阵前', '皇室宴厅',
  '宗族祠堂', '天雷崖']

},
{
  key: 'wuxia-rivers',
  name: '武侠江湖',
  locations: [
  '破庙雨夜', '镖局大厅', '客栈二楼', '青石长街', '悬崖木桥', '武林大会擂台',
  '山寨议事厅', '渡口小船', '茶棚路边', '刀剑铺', '密林竹阵', '荒村祠堂',
  '赌坊暗门', '药铺后院', '古墓甬道', '寺院藏经阁', '雪夜山道', '湖心亭',
  '官道驿站', '盐帮码头']

},
{
  key: 'ancient-romance',
  name: '古言权谋',
  locations: [
  '宫门外长阶', '御花园偏亭', '侯府正厅', '书房密室', '花朝宴席', '绣楼窗下',
  '茶楼雅间', '祠堂后院', '寺庙偏殿', '贡院门口', '驿馆客房', '灯会街口',
  '王府侧门', '药铺后堂', '画舫船舱', '城门瓮城', '刑部外巷', '旧宅库房',
  '雨巷石桥', '密诏藏阁']

},
{
  key: 'suspense-folk',
  name: '悬疑民俗',
  locations: [
  '老宅祠堂', '荒村戏台', '河神庙门口', '夜半棺材铺', '废弃学校', '山路客栈',
  '殡仪馆走廊', '纸扎铺后间', '古井旁', '镇医院旧楼', '民俗博物馆库房', '雨夜祠堂',
  '封门村口', '地下墓道入口', '戏班后台', '旧照相馆暗房', '祭祀广场', '山神洞口',
  '老桥桥洞', '废弃矿井']

},
{
  key: 'apocalypse-survival',
  name: '末世生存',
  locations: [
  '废弃超市', '地下避难所', '荒城医院', '断桥检查站', '净水厂控制室', '旧校园营地',
  '风沙车队', '广播塔顶层', '变异森林边缘', '补给仓库', '防空洞入口', '废弃游乐园',
  '幸存者交易集市', '地下轨道站', '裂谷吊桥', '旧高速服务区', '屋顶菜园', '隔离墙外',
  '废土修车厂', '临时医疗帐篷']

},
{
  key: 'sci-fi-stellar',
  name: '科幻星际',
  locations: [
  '星舰舰桥', '太空港候船厅', '火星殖民舱', '月面矿区', '环形空间站', '冷冻休眠舱',
  '机甲维修库', '行星议会大厅', '宇宙电梯平台', '异星遗迹入口', '星际法庭', '深空通讯室',
  '训练模拟舱', '逃生艇舱门', '生态穹顶农场', '黑洞观测站', '货运飞船走廊', '边境哨站',
  '能源核心室', '外星市场']

},
{
  key: 'game-instance',
  name: '游戏副本',
  locations: [
  '新手村广场', '副本传送门', 'Boss房门口', '公会大厅', '装备强化铺', '竞技场看台',
  '任务公告栏', '迷宫岔路口', '安全区边缘', '掉落宝箱旁', '复活点', '隐藏商店',
  '排行榜石碑', '野外营地', '限时活动入口', '玩家交易集市', '系统审判大厅', '赛季结算台',
  '虚拟直播间', 'BUG裂缝前']

},
{
  key: 'quick-transmigration',
  name: '快穿系统',
  locations: [
  '系统白房间', '任务结算空间', '古代侯府后院', '校园天台', '娱乐圈片场', '豪门宴会厅',
  '末世避难所', '仙门试炼台', '星际学院', '宫斗寝殿', '霸总办公室', '电竞训练室',
  '民国照相馆', '狼人古堡', '悬疑密室', '年代供销社', '直播间后台', '病房窗边',
  '副本倒计时大厅', '记忆回放空间']

},
{
  key: 'entertainment-circle',
  name: '娱乐圈逆袭',
  locations: [
  '选秀后台', '摄影棚绿幕前', '剧组化妆间', '红毯入口', '经纪公司会议室', '录音棚',
  '直播间控台', '粉丝见面会现场', '试镜房外', '综艺观察室', '酒店走廊', '片场雨棚',
  '颁奖礼侧台', '公关危机会议室', '练习室镜墙', '机场贵宾通道', '热搜大屏前', '杂志拍摄棚',
  '艺人保姆车', '导演监视器旁']

},
{
  key: 'wealthy-business',
  name: '豪门商战',
  locations: [
  '董事会会议室', '豪宅旋转楼梯', '慈善晚宴厅', '律师事务所', '私人医院病房', '银行金库外',
  '股东大会现场', '顶层办公室', '婚礼宴会厅', '别墅花园', '拍卖会包厢', '商业酒会角落',
  '家族祠堂', '遗嘱宣读室', '私人会所包间', '地下停车场', '奢侈品店VIP室', '海边码头',
  '集团数据中心', '财务审计室']

},
{
  key: 'period-realism',
  name: '年代现实',
  locations: [
  '老厂区车间', '供销社柜台', '职工宿舍楼', '村口小卖部', '县城照相馆', '火车站月台',
  '乡镇卫生院', '粮站仓库', '集体食堂', '广播站', '拖拉机修理铺', '河边码头',
  '家属院楼下', '夜校教室', '老电影院门口', '菜市场摊位', '邮局柜台', '村委会办公室',
  '小镇理发店', '农贸集市']

}];


const STORY_TYPES = [
{ key: 'revenge', name: '反击逆袭', tension: '被轻视的人被逼到墙角后，突然亮出真正底牌', opening: '所有人都以为主角已经输了' },
{ key: 'identity', name: '身份反转', tension: '最不起眼的人，恰恰是改变局面的人', opening: '表面身份和真实身份之间形成巨大落差' },
{ key: 'misunderstanding', name: '误会拉扯', tension: '人物在误会里越来越远，直到一个细节刺破伪装', opening: '开场先给观众一个误判' },
{ key: 'rescue', name: '极限营救', tension: '主角必须在有限时间里救下最重要的人或事', opening: '一上来就把时钟拨到最紧' },
{ key: 'growth', name: '成长和解', tension: '主角在一次撕裂式冲突里看见自己真正想守护的东西', opening: '先呈现一个嘴硬又倔强的当下' },
{ key: 'control', name: '控制与逃离', tension: '主角试图挣脱某种关系、规则或命运安排', opening: '先让压迫感落到很具体的日常动作上' },
{ key: 'alliance', name: '被迫结盟', tension: '两个互相看不顺眼的人只能一起完成任务', opening: '开场就制造彼此敌意' },
{ key: 'mystery', name: '悬疑追真相', tension: '主角每靠近答案一步，代价就更大一点', opening: '先抛出一个极不正常的现象' },
{ key: 'double', name: '真假替身', tension: '观众以为是本人，其实身份、记忆或立场早已被替换', opening: '先让一个熟悉的人做出完全反常的举动' },
{ key: 'countdown', name: '时间倒计时', tension: '所有选择都被一个倒计时逼着往前冲', opening: '开场就给出一个无法拖延的最后期限' }];


const COURSE_TOTAL_SECONDS = 270;
const COURSE_SEGMENT_SECONDS = 10;
const COURSE_TOTAL_SEGMENTS = 27;
const COURSE_TOTAL_ROLES = 3;

const FLOW_STEPS = [
{ key: 'story', label: '01', short: '一句话故事', title: '先把一句话故事定下来', desc: 'AI生成也行，手写也行。先把冲突立住。' },
{ key: 'synopsis', label: '02', short: '扩写梗概', title: '扩成 4 分 30 秒的总梗概', desc: '这一步先做完整故事，再拆成连续分段。' },
{ key: 'style', label: '03', short: '画面风格', title: '整条漫剧先统一风格', desc: '先定视觉语言，后面的提示词才不会跑偏。' },
{ key: 'characters', label: '04', short: '角色设定卡', title: '先把角色设定卡定下来', desc: '角色卡就是后面做首帧、尾帧和视频一致性的核心锚点。' },
{ key: 'prompts', label: '05', short: '分段提示词', title: '按 10 秒一段生成 27 组提示词', desc: '剧情、首尾帧、运镜、配乐、台词、剧本都放在这里。' },
{ key: 'preview', label: '06', short: '最终预览', title: '把要喂给豆包的内容一次看全', desc: '这里会把剧情、风格、角色、首尾帧和 27 段提示词整理成最终总汇。' }];






























function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickCharacterCount() {
  return 1 + Math.floor(Math.random() * COURSE_TOTAL_ROLES);
}

function makeCharacterSlots(count) {
  return Array(Math.max(1, Math.min(COURSE_TOTAL_ROLES, count))).fill('主要人物');
}

function findEraByName(name) {
  return GENRE_WORLD_SETS.find((item) => item.name === name) || GENRE_WORLD_SETS[0];
}

function normalizeSavedImageLinks(links) {
  if (!Array.isArray(links)) return Array(COURSE_TOTAL_ROLES).fill('');
  return Array.from({ length: COURSE_TOTAL_ROLES }).map((_, index) => {
    const value = links[index] || '';
    return value.startsWith('data:image/') ? '' : value;
  });
}

function makeEmptySegmentFrames() {
  return Array.from({ length: COURSE_TOTAL_SEGMENTS }).map(() => ({ start: '', end: '' }));
}

function normalizeSavedSegmentFrames(frames) {
  const emptyFrames = makeEmptySegmentFrames();
  if (!Array.isArray(frames)) return emptyFrames;
  return emptyFrames.map((item, index) => {
    const raw = frames[index] || {};
    const start = String(raw.start || '');
    const end = String(raw.end || '');
    return {
      start: start.startsWith('data:image/') ? '' : start,
      end: end.startsWith('data:image/') ? '' : end
    };
  });
}

function canPreviewImageLink(value) {
  return /^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('/api/uploads/');
}

function clampCategoryIndex(index) {
  return Math.max(0, Math.min(STYLE_DATA.length - 1, index));
}

function parseSegmentBlocks(rawText) {
  const matches = Array.from(rawText.matchAll(/###SEGMENT\s+(\d+)\s*\n([\s\S]*?)###END/g));
  return matches.map((match) => {
    const index = Number(match[1]);
    const body = match[2];
    const fields = {};

    body.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('：') && !trimmed.includes(':')) return;
      const parts = trimmed.split(/[:：]/);
      const [label, ...rest] = parts;
      fields[label.trim()] = rest.join('：').trim();
    });

    return {
      id: `segment-${index}`,
      title: fields['标题'] || `第 ${index} 段`,
      timeRange: fields['时间段'] || '',
      summary: fields['剧情说明'] || '',
      startPrompt: fields['首帧提示词'] || '',
      startSource: fields['首帧来源'] || '',
      endPrompt: fields['尾帧提示词'] || '',
      cameraPrompt: fields['运镜提示词'] || '',
      musicPrompt: fields['配乐提示词'] || '',
      voicePrompt: fields['台词/配音提示词'] || '',
      scriptPrompt: fields['剧本提示词'] || '',
      segmentPhase: fields['分段阶段'] || fields['作品阶段'] || '',
      cast: fields['出场角色'] || fields['角色出场'] || fields['本段角色'] || ''
    };
  });
}

function parseCharacterBlocks(rawText) {
  const matches = Array.from(rawText.matchAll(/###CHARACTER\s+(\d+)\s*\n([\s\S]*?)###END/g));
  return matches.map((match) => {
    const index = Number(match[1]);
    const body = match[2];
    const fields = {};

    body.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('：') && !trimmed.includes(':')) return;
      const parts = trimmed.split(/[:：]/);
      const [label, ...rest] = parts;
      fields[label.trim()] = rest.join('：').trim();
    });

    return {
      id: `character-${index}`,
      title: fields['角色名称'] || `角色 ${index}`,
      roleLabel: fields['角色定位'] || '',
      summary: fields['人物简介'] || '',
      anchor: fields['不变锚点'] || '',
      frontPrompt: fields['正面提示词'] || '',
      sidePrompt: fields['侧面提示词'] || '',
      backPrompt: fields['背面提示词'] || '',
      expressionPrompt: fields['表情提示词'] || '',
      accessoryPrompt: fields['配饰提示词'] || '',
      sheetPrompt: fields['角色设定总提示词'] || ''
    };
  });
}

function buildChineseStylePrompt(styleInfo) {
  if (!styleInfo) return '';
  return `${styleInfo.name}风格，${styleInfo.description}，画面统一、角色造型稳定、场景氛围明确，适合 AI 漫剧叙事，强调镜头感、情绪感和竖屏短剧构图。`;
}

function normalizeMatchText(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function splitRoleCastText(value) {
  return String(value || '').
  split(/[、，,\/|+;；\s]+/).
  map((item) => item.trim()).
  filter(Boolean);
}

function inferSegmentRoleStates(segment, characterCards) {
  const segmentText = normalizeMatchText([
  segment.cast,
  segment.summary,
  segment.startPrompt,
  segment.endPrompt,
  segment.cameraPrompt,
  segment.musicPrompt,
  segment.voicePrompt,
  segment.scriptPrompt].
  filter(Boolean).join(' '));
  const castTokens = splitRoleCastText(segment.cast).map(normalizeMatchText);

  return characterCards.slice(0, COURSE_TOTAL_ROLES).map((card) => {
    const tokens = [card.title, card.roleLabel].
    filter(Boolean).
    map(normalizeMatchText);
    const matchedByCast = castTokens.some((token) => token && tokens.some((item) => item.includes(token) || token.includes(item)));
    const matchedByText = tokens.some((token) => token && segmentText.includes(token));
    return matchedByCast || matchedByText;
  });
}

function buildCharacterCardsPrompt({
  story,
  synopsis,
  character,
  characterCount = COURSE_TOTAL_ROLES,
  time,
  location,
  storyTypeName,
  storyTypeTension,
  styleName,
  stylePromptZh,
  stylePromptTemplate
}) {
  if (!synopsis || !styleName) return '';

  return `你是一名角色设定美术指导。现在要优先根据 AI 漫剧的故事梗概提炼并输出 ${characterCount} 张可直接用于生图的角色设定卡 / character sheet / turnaround sheet；一句话故事只作为可选辅助，不要把它当成主依据。

基础信息：
- 故事梗概（主依据）：${synopsis}
- 一句话故事（辅助参考）：${story || '（未填写）'}
- 人物种子：${character}
- 目标角色数量：${characterCount}
- 题材世界：${time}
- 典型场景：${location}
- 故事类型：${storyTypeName}
- 核心张力：${storyTypeTension}
- 画面风格名称：${styleName}
- 中文风格提示词：${stylePromptZh}

创作要求：
1. 先从故事里提炼 ${characterCount} 个最重要的角色，优先覆盖主角、关键对手/推动者、关键关系角色；不要超过目标角色数量。
2. 每个角色都要输出同一角色的参考设定，不要把不同角色混成一个。
3. 每张卡都要输出成一张完整的角色设定拼图，必须是单张图，不要拆成多张独立图片。
4. 每张卡都要包含：角色名称、角色定位、人物简介、不变锚点、正面提示词、侧面提示词、背面提示词、表情提示词、配饰提示词、角色设定总提示词。
5. 所有提示词必须用中文写，方便学生直接阅读和修改；不要整段输出英文。
6. 角色设定图要适合用于生图和后续视频参考：白底或纯色背景、平面棚拍光、清晰轮廓、比例一致、中性站姿。
7. 必须明确正面、侧面、背面、表情表、配饰特写，并且强调这些内容都要合在同一张图里展示，不能拆开成多张图；同一角色的发型、服装、配饰、体型保持稳定。
8. 角色设定总提示词必须是一段可直接复制到豆包生图的中文提示词，并明确“只生成一张完整的角色设定卡图，不要输出多张独立图片”。
9. 不要写真人脸，不要引用明星，不要输出故事长文，只写可直接用于生成角色卡的内容。
10. 严格按以下格式输出 ${characterCount} 个块，每个块之间空一行，不要输出任何额外解释：

###CHARACTER 1
角色名称：...
角色定位：...
人物简介：...
不变锚点：...
正面提示词：...
侧面提示词：...
背面提示词：...
表情提示词：...
配饰提示词：...
角色设定总提示词：...
###END

###CHARACTER 2
...
###END

###CHARACTER 3
...
###END`;
}

function buildExternalSegmentPrompt({
  story,
  synopsis,
  character,
  characterCardsText,
  time,
  location,
  storyTypeName,
  storyTypeTension,
  styleName,
  stylePromptTemplate,
  stylePromptZh
}) {
  if (!story || !synopsis || !styleName) return '';

  return `你是一名专门给 AI 短剧拆分分镜提示词的导演兼编剧。现在要把一个 4 分 30 秒的 AI 漫剧作品，拆成按 10 秒一段的分段提示词。

基础信息：
- 一句话故事：${story}
- 故事梗概：${synopsis}
- 人物：${character}
- 题材世界：${time}
- 典型场景：${location}
- 故事类型：${storyTypeName}
- 核心张力：${storyTypeTension}
- 画面风格名称：${styleName}
- 中文风格提示词：${stylePromptZh}
- 英文风格提示词模板：${stylePromptTemplate}
- 角色设定卡：
${characterCardsText || '（暂未填写角色设定卡）'}
- 总时长：270 秒
- 需要拆分段数：27 段

角色使用要求：
1. 第 1 段需要生成“首帧图”和“尾帧图”；第 2-27 段的首帧直接承接上一段尾帧，不再重新生成首帧图。
2. 若某段只有 1 个角色出场，只引用对应角色卡；若多角色同框，按实际出场角色引用多张角色卡。
3. 第 1 段写“首帧提示词”和“尾帧提示词”；第 2-27 段写“首帧来源：承接上一段尾帧”以及“尾帧提示词”。
4. 角色的一致性以角色设定卡为准，重点保持发型、服装、配饰、体型、色彩和气质稳定。
5. 每段额外写一行“出场角色：”，把这一段实际出现的人物按角色名称列出来，便于最终预览点亮角色格。
6. 不要写真实名人、明星脸、真人肖像，只写原创角色设定。

请严格按以下格式输出，每一段之间空一行，不要输出任何额外解释：

###SEGMENT 1
分段阶段：开场与钩子
标题：第1段
时间段：00:00 - 00:10
剧情说明：...
出场角色：...
首帧提示词：...
尾帧提示词：...
运镜提示词：...
配乐提示词：...
台词/配音提示词：...
剧本提示词：...
###END

###SEGMENT 2
分段阶段：开场与钩子
标题：第2段
时间段：00:10 - 00:20
剧情说明：...
出场角色：...
首帧来源：承接上一段尾帧，不重新生成首帧图
尾帧提示词：...
运镜提示词：...
配乐提示词：...
台词/配音提示词：...
剧本提示词：...
###END

格式要求：
1. 必须输出 27 个段落，每段都以 ###SEGMENT 开头，以 ###END 结尾。
2. 时间段必须连续，且每段 10 秒。
3. 第 1-9 段偏开场铺垫，第 10-18 段偏冲突升级，第 19-27 段偏高潮收束。
4. 第 1 段必须写“首帧提示词”和“尾帧提示词”；第 2-27 段不要写“首帧提示词”，只写“首帧来源：承接上一段尾帧，不重新生成首帧图”和“尾帧提示词”。
5. 每段都必须写“分段阶段、标题、时间段、剧情说明、出场角色、运镜提示词、配乐提示词、台词/配音提示词、剧本提示词”。
6. 所有画面提示词都要延续给定的画面风格模板。
7. 节奏要有开场钩子、冲突升级、反转或揭示、高潮、尾钩。
8. 语言直接可执行，适合学生拿去继续做图、做视频、做配音。`;
}

function buildCharacterCardsBundle(characterCards, rawText) {
  if (characterCards.length === 0) return rawText.trim();
  return characterCards.map((card, index) =>
  `###CHARACTER ${index + 1}
角色名称：${card.title}
角色定位：${card.roleLabel}
人物简介：${card.summary}
不变锚点：${card.anchor}
正面提示词：${card.frontPrompt}
侧面提示词：${card.sidePrompt}
背面提示词：${card.backPrompt}
表情提示词：${card.expressionPrompt}
配饰提示词：${card.accessoryPrompt}
角色设定总提示词：${card.sheetPrompt}
###END`
  ).join('\n\n');
}

function buildCharacterImageBundle(characterCards, characterImageLinks) {
  return characterImageLinks.
  map((link, index) => ({
    link: link.trim(),
    title: characterCards[index]?.title || `角色 ${index + 1}`
  })).
  filter((item) => item.link).
  map((item, index) => `角色图 ${index + 1}｜${item.title}：已上传`).
  join('\n');
}

function buildSegmentCharacterImageBundle(characterCards, characterImageLinks, roleStates) {
  const activeItems = characterCards.
  map((card, index) => ({
    card,
    link: characterImageLinks[index]?.trim() || '',
    active: roleStates[index]
  })).
  filter((item) => item.active && item.link);

  return activeItems.
  map((item, index) => `角色图 ${index + 1}｜${item.card.title}：已上传`).
  join('\n');
}

function buildSegmentCharacterInstruction(characterCards, roleStates, activeCount) {
  const activeItems = characterCards.
  slice(0, activeCount).
  map((card, index) => ({
    title: card?.title || `角色 ${index + 1}`,
    active: roleStates[index]
  })).
  filter((item) => item.active);

  const items = activeItems.length ?
  activeItems :
  characterCards.slice(0, activeCount).map((card, index) => ({ title: card?.title || `角色 ${index + 1}` }));

  if (!items.length) return '请上传本段出场角色的角色设定卡图片。';
  return `请上传下方亮起的角色设定卡图片：${items.map((item) => item.title).join('、')}。`;
}

function buildSegmentBundle(segments) {
  return segments.map((segment, index) =>
  `###SEGMENT ${index + 1}
分段阶段：${segment.segmentPhase || ''}
标题：${segment.title}
时间段：${segment.timeRange}
剧情说明：${segment.summary}
出场角色：${segment.cast || ''}
${index === 0 ? `首帧提示词：${segment.startPrompt}` : `首帧来源：${segment.startSource || '承接上一段尾帧，不重新生成首帧图'}`}
尾帧提示词：${segment.endPrompt}
运镜提示词：${segment.cameraPrompt}
配乐提示词：${segment.musicPrompt}
台词/配音提示词：${segment.voicePrompt}
剧本提示词：${segment.scriptPrompt}
###END`
  ).join('\n\n');
}

function buildSegmentFrameBundle(segmentFrameLinks) {
  return segmentFrameLinks.
  map((frame, index) => {
    const start = frame?.start?.trim();
    const end = frame?.end?.trim();
    if (!start && !end) return '';
    const startLabel = index === 0 ? '首帧图已上传' : '首帧承接上一段尾帧';
    return `第 ${index + 1} 段：${start ? startLabel : '首帧未上传/未承接'}；${end ? '尾帧图已上传' : '尾帧图未上传'}`;
  }).
  filter(Boolean).
  join('\n');
}

function buildFinalPreviewBundle({
  story,
  synopsis,
  styleName,
  stylePromptZh,
  stylePromptTemplate,
  characterCards,
  characterCardsText,
  characterImageLinks,
  segmentFrameLinks,
  segments,
  promptStreamText
}) {
  const characterBundle = buildCharacterCardsBundle(characterCards, characterCardsText);
  const characterImageBundle = buildCharacterImageBundle(characterCards, characterImageLinks);
  const segmentFrameBundle = buildSegmentFrameBundle(segmentFrameLinks);
  const segmentBundle = buildSegmentBundle(segments);
  return `AI漫剧最终预览包

一、剧情总览
故事梗概：${synopsis || '（未填写）'}
一句话故事（辅助）：${story || '（未填写）'}

二、画面风格
风格名称：${styleName || '（未选择）'}
中文风格提示词：${stylePromptZh || '（未填写）'}
英文风格提示词模板：${stylePromptTemplate || '（未填写）'}

三、角色设定卡
${characterBundle || '（未生成角色设定卡）'}

四、角色参考图
${characterImageBundle || '（未上传角色参考图）'}

五、首尾帧参考图
${segmentFrameBundle || '（未上传首尾帧参考图）'}

六、27 段分段提示词
${segmentBundle || promptStreamText.trim() || '（未生成分段提示词）'}

七、给豆包的最终使用方式
1. 先按角色设定卡生成或上传角色参考图。
2. 再按每段的首帧、尾帧提示词生成参考图。
3. 最后把对应首帧图和尾帧图交给豆包生成 10 秒视频。`;
}

function createEmptyDraft() {
  return {
    selectedCharacter: '2个主要人物',
    selectedCharacters: makeCharacterSlots(2),
    selectedTime: GENRE_WORLD_SETS[0].name,
    selectedLocation: GENRE_WORLD_SETS[0].locations[0],
    selectedStoryTypeKey: STORY_TYPES[0].key,
    manualStory: '',
    generatedStory: '',
    storySource: 'generated',
    synopsis: '',
    selectedCategory: 0,
    selectedStyle: { category: STYLE_DATA[0].key, subcategory: STYLE_DATA[0].children[0].key },
    durationSeconds: COURSE_TOTAL_SECONDS,
    characterCardsText: '',
    characterImageLinks: Array(COURSE_TOTAL_ROLES).fill(''),
    segmentFrameLinks: makeEmptySegmentFrames(),
    segments: [],
    promptStreamText: '',
    currentStep: 0
  };
}

function normalizeDraft(rawDraft = {}) {
  const fallback = createEmptyDraft();
  const saved = { ...fallback, ...rawDraft };
  const savedEra = findEraByName(saved.selectedTime);
  const savedCharacterCount = Array.isArray(saved.selectedCharacters) && saved.selectedCharacters.length ?
  saved.selectedCharacters.slice(0, COURSE_TOTAL_ROLES).length :
  2;
  const savedPromptStreamText = String(saved.promptStreamText || '');
  return {
    ...saved,
    selectedCharacter: `${savedCharacterCount}个主要人物`,
    selectedCharacters: makeCharacterSlots(savedCharacterCount),
    selectedTime: savedEra.name,
    selectedLocation: savedEra.locations.includes(saved.selectedLocation) ? saved.selectedLocation : savedEra.locations[0],
    durationSeconds: COURSE_TOTAL_SECONDS,
    characterImageLinks: normalizeSavedImageLinks(saved.characterImageLinks),
    segmentFrameLinks: normalizeSavedSegmentFrames(saved.segmentFrameLinks),
    segments: parseSegmentBlocks(savedPromptStreamText),
    currentStep: Math.max(0, Math.min(5, saved.currentStep ?? 0)),
    selectedCategory: clampCategoryIndex(saved.selectedCategory ?? 0),
    selectedStyle: saved.selectedStyle || fallback.selectedStyle,
    promptStreamText: savedPromptStreamText
  };
}

function getInitialDraft() {
  const withStory = {
    ...createEmptyDraft()
  };

  if (typeof window === 'undefined') return withStory;

  try {
    const saved = STORAGE_KEY_FALLBACKS.
    map((key) => window.localStorage.getItem(key)).
    map((value) => {
      try {
        return JSON.parse(value || 'null');
      } catch {
        return null;
      }
    }).
    find(Boolean);
    if (!saved) return withStory;
    return normalizeDraft(saved);
  } catch (error) {
    console.error('读取 AI 漫剧草稿失败:', error);
    return withStory;
  }
}

export default function AiManjuStudio({ projectId = null, projectData = null }) {
  const { switchToAiManjuStudio } = useWorkspace();

  const initialDraft = getInitialDraft();
  const [selectedCharacters, setSelectedCharacters] = useState(initialDraft.selectedCharacters);
  const [selectedTime, setSelectedTime] = useState(initialDraft.selectedTime);
  const [selectedLocation, setSelectedLocation] = useState(initialDraft.selectedLocation);
  const [selectedStoryTypeKey, setSelectedStoryTypeKey] = useState(initialDraft.selectedStoryTypeKey);
  const [manualStory, setManualStory] = useState(initialDraft.manualStory);
  const [generatedStory, setGeneratedStory] = useState(initialDraft.generatedStory);
  const [storySource, setStorySource] = useState(initialDraft.storySource);
  const [synopsis, setSynopsis] = useState(initialDraft.synopsis);
  const [selectedCategory, setSelectedCategory] = useState(initialDraft.selectedCategory);
  const [selectedStyle, setSelectedStyle] = useState(initialDraft.selectedStyle);
  const [durationSeconds] = useState(initialDraft.durationSeconds);
  const [characterCardsText, setCharacterCardsText] = useState(initialDraft.characterCardsText);
  const [characterImageLinks, setCharacterImageLinks] = useState(normalizeSavedImageLinks(initialDraft.characterImageLinks));
  const [characterImagePreviews, setCharacterImagePreviews] = useState(Array(COURSE_TOTAL_ROLES).fill(''));
  const [characterCards, setCharacterCards] = useState([]);
  const [characterCardsLoading, setCharacterCardsLoading] = useState(false);
  const [characterCardsError, setCharacterCardsError] = useState('');
  const [characterImageUploadErrors, setCharacterImageUploadErrors] = useState(Array(COURSE_TOTAL_ROLES).fill(''));
  const [segmentFrameLinks, setSegmentFrameLinks] = useState(normalizeSavedSegmentFrames(initialDraft.segmentFrameLinks));
  const [segmentFrameUploadErrors, setSegmentFrameUploadErrors] = useState(makeEmptySegmentFrames());
  const [segments, setSegments] = useState(initialDraft.segments);
  const [currentStep, setCurrentStep] = useState(initialDraft.currentStep);
  const [copiedKey, setCopiedKey] = useState('');
  const [aiUsage, setAiUsage] = useState(null);
  const [aiStoryLoading, setAiStoryLoading] = useState(false);
  const [aiStoryError, setAiStoryError] = useState('');
  const [synopsisLoading, setSynopsisLoading] = useState(false);
  const [synopsisError, setSynopsisError] = useState('');
  const [promptsError, setPromptsError] = useState('');
  const [promptStreamText, setPromptStreamText] = useState(initialDraft.promptStreamText);
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentProjectTitle, setCurrentProjectTitle] = useState(projectData?.title || '');
  const [saveTitle, setSaveTitle] = useState(projectData?.title || '');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectSaveError, setProjectSaveError] = useState('');
  const [projectLoadedKey, setProjectLoadedKey] = useState('');

  const scrollStudioIntoView = () => {
    const workspaceContainer = document.querySelector('.workspace-container');
    if (workspaceContainer?.scrollTo) {
      workspaceContainer.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const selectedStoryType = useMemo(
    () => STORY_TYPES.find((item) => item.key === selectedStoryTypeKey) || STORY_TYPES[0],
    [selectedStoryTypeKey]
  );

  const selectedStyleInfo = useMemo(() => {
    const category = STYLE_DATA.find((item) => item.key === selectedStyle?.category);
    return category?.children.find((item) => item.key === selectedStyle?.subcategory) || null;
  }, [selectedStyle]);
  const selectedStylePromptZh = useMemo(() => buildChineseStylePrompt(selectedStyleInfo), [selectedStyleInfo]);
  const selectedEra = useMemo(() => findEraByName(selectedTime), [selectedTime]);
  const availableLocations = selectedEra.locations;
  const activeCharacterCount = Math.max(1, Math.min(COURSE_TOTAL_ROLES, selectedCharacters.length));
  const selectedCharacter = useMemo(
    () => `${activeCharacterCount}个主要人物`,
    [activeCharacterCount]
  );
  const previewRoleCards = useMemo(
    () => characterCards.slice(0, activeCharacterCount),
    [characterCards, activeCharacterCount]
  );
  const activeStoryLine = storySource === 'manual' ? manualStory.trim() : generatedStory.trim();
  const previewStoryLine = activeStoryLine;
  const characterCardsPrompt = useMemo(() => buildCharacterCardsPrompt({
    story: previewStoryLine,
    synopsis: synopsis.trim(),
    character: selectedCharacter,
    characterCount: activeCharacterCount,
    time: selectedTime,
    location: selectedLocation,
    storyTypeName: selectedStoryType.name,
    storyTypeTension: selectedStoryType.tension,
    styleName: selectedStyleInfo?.name || '',
    stylePromptZh: selectedStylePromptZh,
    stylePromptTemplate: selectedStyleInfo?.promptTemplate || ''
  }), [
  previewStoryLine,
  synopsis,
  selectedCharacter,
  activeCharacterCount,
  selectedTime,
  selectedLocation,
  selectedStoryType.name,
  selectedStoryType.tension,
  selectedStyleInfo,
  selectedStylePromptZh]
  );
  const finalPreviewBundle = useMemo(() => buildFinalPreviewBundle({
    story: previewStoryLine,
    synopsis: synopsis.trim(),
    styleName: selectedStyleInfo?.name || '',
    stylePromptZh: selectedStylePromptZh,
    stylePromptTemplate: selectedStyleInfo?.promptTemplate || '',
    characterCards,
    characterCardsText,
    characterImageLinks,
    segmentFrameLinks,
    segments,
    promptStreamText
  }), [
  previewStoryLine,
  synopsis,
  selectedStyleInfo,
  selectedStylePromptZh,
  characterCards,
  characterCardsText,
  characterImageLinks,
  segmentFrameLinks,
  segments,
  promptStreamText]
  );
  const currentCategory = STYLE_DATA[selectedCategory];
  const flowStepText = (step, field) => step[field];
  const genreText = (name) => name;
  const storyTypeText = (item) => item.name;
  const storyTensionText = (item) => item.tension;
  const characterCountText = (count) => `${count} 个主要人物`;
  const parsedCharacterText = () =>
  `已解析 ${characterCards.length} / ${activeCharacterCount} 张角色卡。`;


  const parsedSegmentText = () =>
  `已解析 ${segments.length} / ${COURSE_TOTAL_SEGMENTS} 组分段提示词。`;


  const segmentGenerationPrompt = useMemo(() => buildExternalSegmentPrompt({
    story: previewStoryLine,
    synopsis: synopsis.trim(),
    character: selectedCharacter,
    characterCardsText,
    time: selectedTime,
    location: selectedLocation,
    storyTypeName: selectedStoryType.name,
    storyTypeTension: selectedStoryType.tension,
    styleName: selectedStyleInfo?.name || '',
    stylePromptTemplate: selectedStyleInfo?.promptTemplate || '',
    stylePromptZh: selectedStylePromptZh
  }), [
  previewStoryLine,
  synopsis,
  selectedCharacter,
  selectedTime,
  selectedLocation,
  selectedStoryType.name,
  selectedStoryType.tension,
  selectedStyleInfo,
  selectedStylePromptZh,
  characterCardsText]
  );

  const applyDraftToState = (rawDraft = {}) => {
    const draft = normalizeDraft(rawDraft);
    setSelectedCharacters(draft.selectedCharacters);
    setSelectedTime(draft.selectedTime);
    setSelectedLocation(draft.selectedLocation);
    setSelectedStoryTypeKey(draft.selectedStoryTypeKey);
    setManualStory(draft.manualStory);
    setGeneratedStory(draft.generatedStory);
    setStorySource(draft.storySource);
    setSynopsis(draft.synopsis);
    setSelectedCategory(draft.selectedCategory);
    setSelectedStyle(draft.selectedStyle);
    setCharacterCardsText(draft.characterCardsText);
    setCharacterImageLinks(normalizeSavedImageLinks(draft.characterImageLinks));
    setCharacterImagePreviews(Array(COURSE_TOTAL_ROLES).fill(''));
    setCharacterImageUploadErrors(Array(COURSE_TOTAL_ROLES).fill(''));
    setSegmentFrameLinks(normalizeSavedSegmentFrames(draft.segmentFrameLinks));
    setSegmentFrameUploadErrors(makeEmptySegmentFrames());
    setPromptStreamText(draft.promptStreamText);
    setSegments(draft.segments);
    setCurrentStep(draft.currentStep);
    setPromptsError('');
    setProjectSaveError('');
  };

  const buildCurrentManjuData = () => ({
    schemaVersion: 1,
    selectedCharacters,
    selectedTime,
    selectedLocation,
    selectedStoryTypeKey,
    manualStory,
    generatedStory,
    storySource,
    synopsis,
    selectedCategory,
    selectedStyle,
    characterCardsText,
    characterImageLinks: normalizeSavedImageLinks(characterImageLinks),
    segmentFrameLinks: normalizeSavedSegmentFrames(segmentFrameLinks),
    promptStreamText,
    currentStep,
    finalPreviewBundle
  });

  const getDefaultProjectTitle = () => {
    const storyTitle = previewStoryLine.replace(/\s+/g, '').slice(0, 18);
    return storyTitle ? `AI漫剧｜${storyTitle}` : '未命名AI漫剧';
  };

  useEffect(() => {
    if (!availableLocations.includes(selectedLocation)) {
      setSelectedLocation(availableLocations[0]);
    }
  }, [availableLocations, selectedLocation]);

  useEffect(() => {
    const loadProjectDraft = async () => {
      if (projectData?.isNewManjuDraft) {
        const nextKey = `new-${projectData.resetToken || 'draft'}`;
        if (projectLoadedKey === nextKey) return;
        applyDraftToState(createEmptyDraft());
        setCurrentProjectId(null);
        setCurrentProjectTitle('');
        setSaveTitle('');
        setProjectLoadedKey(nextKey);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {


          // Ignore localStorage failures.
        }return;}

      if (!projectId) {
        setCurrentProjectId(null);
        setCurrentProjectTitle('');
        setSaveTitle('');
        return;
      }
      const nextKey = `project-${projectId}-${projectData?.updated_at || ''}`;
      if (projectLoadedKey === nextKey) return;

      try {
        const fullProject = projectData?.manju_data ? projectData : await projectApi.getManju(projectId);
        applyDraftToState(fullProject.manju_data || {});
        setCurrentProjectId(fullProject.id);
        setCurrentProjectTitle(fullProject.title || '');
        setSaveTitle(fullProject.title || '');
        setProjectLoadedKey(nextKey);
      } catch (error) {
        setProjectSaveError(error.message || '加载 AI漫剧作品失败');
      }
    };

    loadProjectDraft();
  }, [projectId, projectData?.id, projectData?.resetToken, projectData?.updated_at, projectLoadedKey]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedCharacters,
        selectedTime,
        selectedLocation,
        selectedStoryTypeKey,
        manualStory,
        generatedStory,
        storySource,
        synopsis,
        selectedCategory,
        selectedStyle,
        characterCardsText,
        characterImageLinks: normalizeSavedImageLinks(characterImageLinks),
        segmentFrameLinks: normalizeSavedSegmentFrames(segmentFrameLinks),
        promptStreamText,
        currentStep
      }));
    } catch (error) {
      console.warn('AI 漫剧草稿过大，已跳过本次本地缓存。', error);
    }
  }, [
  selectedCharacter, selectedCharacters, selectedTime, selectedLocation, selectedStoryTypeKey,
  manualStory, generatedStory, storySource, synopsis, selectedCategory, selectedStyle,
  durationSeconds, characterCardsText, characterImageLinks, segmentFrameLinks, segments, promptStreamText, currentStep]
  );

  useEffect(() => {
    if (!characterCardsText.trim()) {
      setCharacterCards([]);
      return;
    }
    setCharacterCards(parseCharacterBlocks(characterCardsText));
  }, [characterCardsText]);

  useEffect(() => {
    if (!promptStreamText.trim()) {
      setSegments([]);
      return;
    }
    setSegments(parseSegmentBlocks(promptStreamText));
  }, [promptStreamText]);

  useEffect(() => {
    ai.getUsage().
    then((usage) => setAiUsage(usage)).
    catch(() => setAiUsage(null));
  }, []);

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1600);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const updateUsageFromHeaders = (headers) => {
    const remaining = headers.get('X-Remaining');
    const weeklyLimit = headers.get('X-Weekly-Limit');
    const usedThisWeek = headers.get('X-Used-This-Week');
    if (remaining == null || weeklyLimit == null) return;

    setAiUsage({
      remaining: Number(remaining),
      weekly_limit: Number(weeklyLimit),
      used_this_week: usedThisWeek == null ? null : Number(usedThisWeek)
    });
  };

  const streamDeepSeekText = async (path, payload, onText) => {
    const token = localStorage.getItem('aimanju_token') || localStorage.getItem('token');
    const response = await fetch(resolveApiPath(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'DeepSeek 调用失败' }));
      throw new Error(error.detail || 'DeepSeek 调用失败');
    }

    updateUsageFromHeaders(response.headers);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('流式读取失败');

    const decoder = new TextDecoder();
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;

        const data = JSON.parse(raw);
        if (data.error) throw new Error(data.error);
        if (data.text) onText(data.text);
      }
    }
  };

  const randomizeStorySeeds = () => {
    const nextEra = pickRandom(GENRE_WORLD_SETS);
    const nextLocation = pickRandom(nextEra.locations);
    const nextStoryType = pickRandom(STORY_TYPES);
    setSelectedCharacters(makeCharacterSlots(pickCharacterCount()));
    setSelectedTime(nextEra.name);
    setSelectedLocation(nextLocation);
    setSelectedStoryTypeKey(nextStoryType.key);
  };

  const randomizeCharacters = () => {
    setSelectedCharacters(makeCharacterSlots(pickCharacterCount()));
  };

  const updateCharacterCount = (count) => {
    setSelectedCharacters(makeCharacterSlots(count));
  };

  const generateAiStory = async () => {
    setAiStoryLoading(true);
    setAiStoryError('');
    setGeneratedStory('');
    setStorySource('generated');
    try {
      await streamDeepSeekText('/api/ai/manju/stream-one-line-story', {
        character: selectedCharacter,
        time: selectedTime,
        location: selectedLocation,
        story_type_key: selectedStoryType.key
      }, (text) => {
        setGeneratedStory((prev) => prev + text);
      });
    } catch (error) {
      setAiStoryError(error.message || 'DeepSeek 生成失败，请稍后重试');
    } finally {
      setAiStoryLoading(false);
    }
  };

  const confirmStorySelection = () => {
    const selectedText = storySource === 'manual' ? manualStory.trim() : generatedStory.trim();
    if (!selectedText) {
      setAiStoryError('先写一句话故事，或者先让 AI 生成一句话故事。');
      return;
    }
    setAiStoryError('');
    setCurrentStep(1);
  };

  const generateSynopsis = async () => {
    if (!previewStoryLine) {
      setSynopsisError('先确定一句话故事，再来扩写梗概。');
      return '';
    }

    setSynopsisLoading(true);
    setSynopsisError('');
    setSynopsis('');

    try {
      await streamDeepSeekText('/api/ai/manju/stream-synopsis', {
        story: previewStoryLine,
        character: selectedCharacter,
        time: selectedTime,
        location: selectedLocation,
        story_type_key: selectedStoryType.key
      }, (text) => {
        setSynopsis((prev) => prev + text);
      });
      return synopsis;
    } catch (error) {
      setSynopsisError(error.message || 'DeepSeek 扩写失败，请稍后重试');
      return '';
    } finally {
      setSynopsisLoading(false);
    }
  };

  const generateCharacterCards = async () => {
    if (!synopsis.trim()) {
      setCharacterCardsError('先确认故事梗概，再来生成角色卡。');
      return '';
    }
    if (!selectedStyleInfo) {
      setCharacterCardsError('先选择画面风格，再来生成角色卡。');
      return '';
    }

    setCharacterCardsLoading(true);
    setCharacterCardsError('');
    setCharacterCardsText('');

    try {
      await streamDeepSeekText('/api/ai/manju/stream-character-cards', {
        story: previewStoryLine,
        synopsis: synopsis.trim(),
        character: selectedCharacter,
        time: selectedTime,
        location: selectedLocation,
        story_type_key: selectedStoryType.key,
        style_name: selectedStyleInfo.name,
        style_prompt_template: selectedStyleInfo.promptTemplate || ''
      }, (text) => {
        setCharacterCardsText((prev) => prev + text);
      });
      return characterCardsText;
    } catch (error) {
      setCharacterCardsError(error.message || 'DeepSeek 生成角色卡失败，请稍后重试');
      return '';
    } finally {
      setCharacterCardsLoading(false);
    }
  };

  const copySegmentGenerationPrompt = () => {
    if (!previewStoryLine) {
      setPromptsError('先确定一句话故事。');
      return;
    }
    if (!synopsis.trim()) {
      setPromptsError('先生成并确认故事梗概。');
      return;
    }
    if (!characterCards.length && !characterCardsText.trim()) {
      setPromptsError('先生成或粘贴角色设定卡。');
      return;
    }
    if (!selectedStyleInfo) {
      setPromptsError('先选择画面风格。');
      return;
    }
    setPromptsError('');
    copyText(segmentGenerationPrompt, 'segment-generation-prompt');
  };

  const copyAllPrompts = () => {
    if (!segments.length) return;
    const content = buildSegmentBundle(segments);
    copyText(content, 'all-prompts');
  };

  const copyCharacterPrompt = () => {
    if (!synopsis.trim()) {
      setCharacterCardsError('先确认故事梗概。');
      return;
    }
    if (!selectedStyleInfo) {
      setCharacterCardsError('先选择画面风格。');
      return;
    }
    setCharacterCardsError('');
    copyText(characterCardsPrompt, 'character-cards-prompt');
  };

  const copyFinalPreview = () => {
    if (!previewStoryLine) {
      setPromptsError('先确定一句话故事。');
      return;
    }
    if (!synopsis.trim()) {
      setPromptsError('先生成并确认故事梗概。');
      return;
    }
    if (!characterCards.length && !characterCardsText.trim()) {
      setPromptsError('先生成或粘贴角色设定卡。');
      return;
    }
    if (!segments.length && !promptStreamText.trim()) {
      setPromptsError('先生成或粘贴 27 段分段提示词。');
      return;
    }
    setPromptsError('');
    copyText(finalPreviewBundle, 'final-preview-bundle');
  };

  const saveExistingProject = async () => {
    if (!currentProjectId) {
      setSaveTitle(getDefaultProjectTitle());
      setShowSaveModal(true);
      return;
    }

    setProjectSaving(true);
    setProjectSaveError('');
    try {
      const saved = await projectApi.updateManju(currentProjectId, {
        title: currentProjectTitle || getDefaultProjectTitle(),
        manju_data: buildCurrentManjuData()
      });
      setCurrentProjectTitle(saved.title || '');
      setSaveTitle(saved.title || '');
      switchToAiManjuStudio(saved);
      window.dispatchEvent(new CustomEvent('ai-manju-projects-changed', { detail: { project: saved } }));
    } catch (error) {
      setProjectSaveError(error.message || '保存失败，请稍后重试');
    } finally {
      setProjectSaving(false);
    }
  };

  const confirmCreateProject = async () => {
    const title = saveTitle.trim();
    if (!title) {
      setProjectSaveError('请输入作品名称。');
      return;
    }

    setProjectSaving(true);
    setProjectSaveError('');
    try {
      const saved = await projectApi.createManju(title, buildCurrentManjuData());
      setCurrentProjectId(saved.id);
      setCurrentProjectTitle(saved.title || '');
      setSaveTitle(saved.title || '');
      setShowSaveModal(false);
      switchToAiManjuStudio(saved);
      window.dispatchEvent(new CustomEvent('ai-manju-projects-changed', { detail: { project: saved } }));
    } catch (error) {
      setProjectSaveError(error.message || '保存失败，请稍后重试');
    } finally {
      setProjectSaving(false);
    }
  };

  const updateCharacterImageLink = (index, value) => {
    setCharacterImageLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && canPreviewImageLink(value)) {
      setCharacterImagePreviews((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
    }
  };

  const uploadCharacterImage = async (index, file) => {
    if (!file) return;
    setCharacterImageUploadErrors((prev) => {
      const next = [...prev];
      next[index] = '';
      return next;
    });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadForm('/api/ai/manju/upload-character-image', formData);
      updateCharacterImageLink(index, result.url);
      requestAnimationFrame(scrollStudioIntoView);
    } catch (error) {
      console.error('角色参考图上传失败:', error);
      setCharacterImageUploadErrors((prev) => {
        const next = [...prev];
        next[index] = error.message || '上传失败，请换一张图片再试';
        return next;
      });
    }
  };

  useEffect(() => {
    requestAnimationFrame(scrollStudioIntoView);
  }, []);

  const clearCharacterImage = (index) => {
    setCharacterImagePreviews((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index]);
      next[index] = '';
      return next;
    });
    updateCharacterImageLink(index, '');
  };

  const updateSegmentFrameLink = (segmentIndex, slot, value) => {
    setSegmentFrameLinks((prev) => {
      const next = normalizeSavedSegmentFrames(prev);
      next[segmentIndex] = { ...next[segmentIndex], [slot]: value };
      if (slot === 'end' && segmentIndex + 1 < COURSE_TOTAL_SEGMENTS && value) {
        next[segmentIndex + 1] = { ...next[segmentIndex + 1], start: value };
      }
      return next;
    });
  };

  const uploadSegmentFrameImage = async (segmentIndex, slot, file) => {
    if (!file) return;
    setSegmentFrameUploadErrors((prev) => {
      const next = normalizeSavedSegmentFrames(prev);
      next[segmentIndex] = { ...next[segmentIndex], [slot]: '' };
      return next;
    });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadForm('/api/ai/manju/upload-frame-image', formData);
      updateSegmentFrameLink(segmentIndex, slot, result.url);
    } catch (error) {
      console.error('首尾帧上传失败:', error);
      setSegmentFrameUploadErrors((prev) => {
        const next = normalizeSavedSegmentFrames(prev);
        next[segmentIndex] = { ...next[segmentIndex], [slot]: error.message || '上传失败，请换一张图片再试' };
        return next;
      });
    }
  };

  const clearSegmentFrameImage = (segmentIndex, slot) => {
    setSegmentFrameLinks((prev) => {
      const next = normalizeSavedSegmentFrames(prev);
      next[segmentIndex] = { ...next[segmentIndex], [slot]: '' };
      if (slot === 'end' && segmentIndex + 1 < COURSE_TOTAL_SEGMENTS && next[segmentIndex + 1].start === prev[segmentIndex]?.end) {
        next[segmentIndex + 1] = { ...next[segmentIndex + 1], start: '' };
      }
      return next;
    });
  };

  const buildDoubaoSegmentPrompt = (segment, segmentIndex = 0) => {
    const roleStates = inferSegmentRoleStates(segment, previewRoleCards);
    const characterInstruction = buildSegmentCharacterInstruction(previewRoleCards, roleStates, activeCharacterCount);
    const startInstruction = segmentIndex === 0 ?
    '请上传本段“首帧”格里的图片作为视频首帧。' :
    '请使用上一段“尾帧”自动承接出来的首帧格图片作为视频首帧。';
    return `给豆包生成这一段 10 秒视频：

分段阶段：${segment.segmentPhase || ''}
时间段：${segment.timeRange}
剧情说明：${segment.summary}
出场角色：${segment.cast || '（请按这一段实际出现的人物填写）'}
画面风格：${selectedStylePromptZh}
素材上传说明：
1. 角色参考图：${characterInstruction}
2. 首帧图：${startInstruction}
3. 尾帧图：请上传本段“尾帧”格里的图片作为视频尾帧。
${segmentIndex === 0 ? `首帧提示词：${segment.startPrompt}` : `首帧来源：${segment.startSource || '承接上一段尾帧，不重新生成首帧图'}`}
尾帧提示词：${segment.endPrompt}
运镜提示词：${segment.cameraPrompt}
台词/配音提示词：${segment.voicePrompt}`;
  };

  const renderSegmentFrameSlot = (segmentIndex, slot, labelZh) => {
    const label = labelZh;
    const frame = segmentFrameLinks[segmentIndex] || {};
    const imageLink = frame[slot] || '';
    const inherited = slot === 'start' && segmentIndex > 0 && imageLink && imageLink === segmentFrameLinks[segmentIndex - 1]?.end;
    const inputId = `ai-manju-frame-${segmentIndex}-${slot}`;
    const errorText = segmentFrameUploadErrors[segmentIndex]?.[slot] || '';
    return (
      <div className={`ai-manju-final-frame-slot ${imageLink ? 'filled' : ''}`}>
                <div className="ai-manju-final-frame-head">
                    <strong>{label}</strong>
                    {inherited && <span>{'接上一段尾帧'}</span>}
                </div>
                <input
          id={inputId}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            uploadSegmentFrameImage(segmentIndex, slot, file);
          }}
          className="ai-manju-file-input" />
        
                {imageLink && canPreviewImageLink(imageLink) ?
        <div className="ai-manju-final-frame-preview">
                        <button
            type="button"
            className="ai-manju-final-frame-open"
            onClick={() => window.open(resolveApiAssetUrl(imageLink), '_blank', 'noopener,noreferrer')}
            title={'打开原图，可另存为'}>
            
                            <img src={resolveApiAssetUrl(imageLink)} alt={`${segmentIndex + 1} ${label}`} loading="lazy" decoding="async" />
                        </button>
                        <button type="button" className="ai-manju-frame-clear" onClick={() => clearSegmentFrameImage(segmentIndex, slot)}>
                            {'清除'}
                        </button>
                    </div> :

        <label className="ai-manju-final-frame-add" htmlFor={inputId} title={`上传${labelZh}`}>
                        <span>+</span>
                        <em>{`上传${labelZh}`}</em>
                    </label>
        }
                {errorText && <p className="ai-manju-upload-error">{errorText}</p>}
            </div>);

  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div className="ai-manju-step-layout">
                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'AI生成'}</p>
                                <h3>{'先选世界设定，再选剧情钩子'}</h3>
                            </div>
                            <button type="button" className="ai-manju-ghost-btn" onClick={randomizeStorySeeds}>{'全部随机'}</button>
                        </div>

                        <div className="ai-manju-grid ai-manju-grid-three">
                            <label className="ai-manju-field">
                                <span>{'题材世界'}</span>
                                <div className="ai-manju-field-with-action">
                                    <select
                    value={selectedTime}
                    onChange={(event) => {
                      const nextEra = findEraByName(event.target.value);
                      setSelectedTime(nextEra.name);
                      setSelectedLocation(nextEra.locations[0]);
                    }}>
                    
                                        {GENRE_WORLD_SETS.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}
                                    </select>
                                    <button
                    type="button"
                    className="ai-manju-mini-btn"
                    onClick={() => {
                      const nextEra = pickRandom(GENRE_WORLD_SETS);
                      setSelectedTime(nextEra.name);
                      setSelectedLocation(pickRandom(nextEra.locations));
                    }}>
                    
                                        {'随机'}
                                    </button>
                                </div>
                            </label>
                            <label className="ai-manju-field">
                                <span>{'人物数量'}</span>
                                <div className="ai-manju-field-with-action">
                                    <select
                    value={selectedCharacters.length}
                    onChange={(event) => updateCharacterCount(Number(event.target.value))}>
                    
                                        <option value={1}>{characterCountText(1)}</option>
                                        <option value={2}>{characterCountText(2)}</option>
                                        <option value={3}>{characterCountText(3)}</option>
                                    </select>
                                    <button type="button" className="ai-manju-mini-btn" onClick={randomizeCharacters}>{'随机'}</button>
                                </div>
                            </label>
                            <label className="ai-manju-field">
                                <span>{'典型场景'}</span>
                                <div className="ai-manju-field-with-action">
                                    <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}>
                                        {availableLocations.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                    <button type="button" className="ai-manju-mini-btn" onClick={() => setSelectedLocation(pickRandom(availableLocations))}>{'随机'}</button>
                                </div>
                            </label>
                        </div>

                        <div className="ai-manju-type-grid">
                            {STORY_TYPES.map((item) =>
              <button
                key={item.key}
                type="button"
                className={`ai-manju-type-card ${selectedStoryTypeKey === item.key ? 'active' : ''}`}
                onClick={() => setSelectedStoryTypeKey(item.key)}>
                
                                    <strong>{storyTypeText(item)}</strong>
                                    <span>{storyTensionText(item)}</span>
                                </button>
              )}
                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'当前变量'}</span>
                            <p>{characterCountText(activeCharacterCount)}｜{genreText(selectedTime)}｜{selectedLocation}｜{storyTypeText(selectedStoryType)}</p>
                            <small>{storyTensionText(selectedStoryType)}</small>
                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'AI积分'}</span>
                            <p>
                                {aiUsage ?
                `本周剩余 ${aiUsage.remaining} / ${aiUsage.weekly_limit} 次` :
                '正在读取本周 AI 次数'}
                            </p>
                        </div>

                        <button type="button" className="ai-manju-primary-btn ai-manju-primary-btn-wide" onClick={generateAiStory} disabled={aiStoryLoading}>
                            {aiStoryLoading ? 'DeepSeek 正在生成一句话故事...' : 'DeepSeek生成一句话故事'}
                        </button>
                    </section>

                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'我的一句话故事'}</p>
                                <h3>{'自己写，或者选择 DeepSeek 生成的结果'}</h3>
                            </div>
                        </div>

                        <label className="ai-manju-field">
                            <span>{'我的一句话故事'}</span>
                            <textarea
                rows="6"
                value={manualStory}
                onChange={(event) => setManualStory(event.target.value)}
                placeholder={'例：高考前最后七天，一个总替别人背锅的班长，在停电的宿舍里发现全班都误会了真正的作弊者。'} />
              
                        </label>

                        <div className="ai-manju-preview-card strong">
                            <span className="ai-manju-chip">{'DeepSeek生成的一句话故事'}</span>
                            <p>{generatedStory || '左侧条件选好之后，点“DeepSeek生成一句话故事”，结果会在这里流式出现。'}</p>
                        </div>

                        <div className="ai-manju-choice-row">
                            <button
                type="button"
                className={`ai-manju-choice-btn ${storySource === 'generated' ? 'active' : ''}`}
                onClick={() => setStorySource('generated')}
                disabled={!generatedStory.trim()}>
                
                                {'选择 AI 结果'}
                            </button>
                            <button
                type="button"
                className={`ai-manju-choice-btn ${storySource === 'manual' ? 'active' : ''}`}
                onClick={() => setStorySource('manual')}
                disabled={!manualStory.trim()}>
                
                                {'选择我的结果'}
                            </button>
                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'当前选中的一句话故事'}</span>
                            <p>{previewStoryLine || '先选择 AI 结果，或者写下你自己的一句话故事。'}</p>
                        </div>

                        {aiStoryError && <p className="ai-manju-error-text">{aiStoryError}</p>}

                        <button type="button" className="ai-manju-primary-btn ai-manju-primary-btn-wide" onClick={confirmStorySelection}>
                            {'确定并进入下一步'}
                        </button>
                    </section>
                </div>);

    }

    if (currentStep === 1) {
      return (
        <div className="ai-manju-step-layout">
                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'输入基础'}</p>
                                <h3>{'这一屏只做故事扩写'}</h3>
                            </div>
                            <button type="button" className="ai-manju-ghost-btn" onClick={() => copyText(previewStoryLine, 'selected-story')}>
                                {copiedKey === 'selected-story' ? '已复制' : '复制当前故事'}
                            </button>
                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'当前一句话故事'}</span>
                            <p>{previewStoryLine}</p>
                        </div>

                        <div className="ai-manju-tag-cloud">
                            <span>{characterCountText(activeCharacterCount)}</span>
                            <span>{genreText(selectedTime)}</span>
                            <span>{selectedLocation}</span>
                            <span>{storyTypeText(selectedStoryType)}</span>
                        </div>
                    </section>

                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'故事梗概'}</p>
                                <h3>{'把它扩成 200 到 300 字左右'}</h3>
                            </div>
                            <div className="ai-manju-inline-actions">
                                <button type="button" className="ai-manju-primary-btn" onClick={generateSynopsis} disabled={synopsisLoading}>
                                    {synopsisLoading ? 'DeepSeek 正在扩写梗概...' : 'DeepSeek扩写梗概'}
                                </button>
                                <button type="button" className="ai-manju-ghost-btn" onClick={() => copyText(synopsis, 'synopsis')}>
                                    {copiedKey === 'synopsis' ? '已复制' : '复制梗概'}
                                </button>
                            </div>
                        </div>

                        <textarea
              className="ai-manju-large-textarea"
              rows="13"
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder={'点击“DeepSeek扩写梗概”后，这里会流式出现适合 4 分 30 秒三阶段漫剧的剧情梗概。'} />
            
                        {synopsisError && <p className="ai-manju-error-text">{synopsisError}</p>}

                        <button
              type="button"
              className="ai-manju-primary-btn ai-manju-primary-btn-wide"
              onClick={() => setCurrentStep(2)}
              disabled={!synopsis.trim()}>
              
                            {'确定梗概并进入下一步'}
                        </button>
                    </section>
                </div>);

    }

    if (currentStep === 2) {
      return (
        <div className="ai-manju-step-layout ai-manju-step-layout-style">
                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'风格导航'}</p>
                                <h3>{'先选一个大类，再看子风格'}</h3>
                            </div>
                            <span className="ai-manju-chip">{'8大类 / 80款'}</span>
                        </div>

                        <div className="ai-manju-category-list">
                            {STYLE_DATA.map((category, index) =>
              <button
                key={category.key}
                type="button"
                className={`ai-manju-category-btn ${selectedCategory === index ? 'active' : ''}`}
                onClick={() => setSelectedCategory(index)}>
                
                                    {category.name}
                                </button>
              )}
                        </div>

                        {selectedStyleInfo &&
            <div className="ai-manju-preview-card">
                                <span className="ai-manju-chip">{'当前风格'}</span>
                                <p><strong>{selectedStyleInfo.name}</strong></p>
                                <p>{selectedStyleInfo.description}</p>
                            </div>
            }
                    </section>

                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{currentCategory.name}</p>
                                <h3>{currentCategory.description}</h3>
                            </div>
                            <button
                type="button"
                className="ai-manju-ghost-btn"
                onClick={() => copyText(
                  `中文提示词：${selectedStylePromptZh}\n\nEnglish Prompt: ${selectedStyleInfo?.promptTemplate || ''}`,
                  'style-template'
                )}>
                
                                {copiedKey === 'style-template' ? '已复制' : '复制当前风格提示词'}
                            </button>
                        </div>

                        <div className="ai-manju-style-grid">
                            {currentCategory.children.map((style) => {
                const isActive = selectedStyle?.category === currentCategory.key && selectedStyle?.subcategory === style.key;
                return (
                  <button
                    key={style.key}
                    type="button"
                    className={`ai-manju-style-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedStyle({ category: currentCategory.key, subcategory: style.key })}>
                    
                                        <div className="ai-manju-style-image">
                                            <img
                        src={getStyleReferenceImage(style.key)}
                        alt={style.name}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          if (event.currentTarget.dataset.fallback !== 'svg') {
                            event.currentTarget.dataset.fallback = 'svg';
                            event.currentTarget.src = getStyleReferenceImage(style.key, 'svg');
                            return;
                          }
                          event.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                                        </div>
                                        <strong>{style.name}</strong>
                                    </button>);

              })}
                        </div>

                        {selectedStyleInfo &&
            <div className="ai-manju-preview-card strong ai-manju-style-selected-card">
                                <span className="ai-manju-chip">{'已选定风格'}</span>
                                <p><strong>{selectedStyleInfo.name}</strong></p>
                                <p>{selectedStyleInfo.description}</p>
                            </div>
            }

                        {selectedStyleInfo &&
            <div className="ai-manju-preview-card">
                                <span className="ai-manju-chip">{'中文风格提示词'}</span>
                                <p>{selectedStylePromptZh}</p>
                            </div>
            }

                        {selectedStyleInfo &&
            <div className="ai-manju-preview-card">
                                <span className="ai-manju-chip">{'英文风格提示词'}</span>
                                <p>{selectedStyleInfo.promptTemplate}</p>
                            </div>
            }

                        <button
              type="button"
              className="ai-manju-primary-btn ai-manju-primary-btn-wide"
              onClick={() => setCurrentStep(3)}
              disabled={!selectedStyleInfo}>
              
                            {'确定风格并进入下一步'}
                        </button>
                    </section>
                </div>);

    }

    if (currentStep === 3) {
      return (
        <div className="ai-manju-step-layout ai-manju-step-layout-characters">
                    <section className="ai-manju-panel">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'角色提取'}</p>
                                <h3>{`从扩写梗概里抽出 ${activeCharacterCount} 张角色设定卡`}</h3>
                            </div>
                            <span className="ai-manju-chip">{`${activeCharacterCount} 个角色位`}</span>
                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'当前故事梗概（主依据）'}</span>
                            <p>{synopsis.trim() || '先确认扩写后的故事梗概。'}</p>
                            <span className="ai-manju-chip">{'一句话故事（辅助）'}</span>
                            <p>{previewStoryLine || '这一步主要看扩写梗概，一句话故事只是辅助。'}</p>
                            <p>{selectedStyleInfo?.name || '先选择画面风格。'}</p>
                        </div>

                        <div className="ai-manju-final-actions">
                            <button
                type="button"
                className="ai-manju-primary-btn ai-manju-primary-btn-wide"
                onClick={generateCharacterCards}
                disabled={characterCardsLoading}>
                
                                {characterCardsLoading ? 'DeepSeek 正在生成角色卡...' : 'DeepSeek生成角色卡'}
                            </button>
                            <button type="button" className="ai-manju-ghost-btn" onClick={copyCharacterPrompt}>
                                {copiedKey === 'character-cards-prompt' ? '角色卡提示词已复制' : '复制角色卡提示词'}
                            </button>
                        </div>

                        {characterCardsError && <p className="ai-manju-error-text">{characterCardsError}</p>}

                        <label className="ai-manju-field">
                            <span>{'给外部 AI 的角色卡提示词'}</span>
                            <textarea
                className="ai-manju-large-textarea ai-manju-prompt-textarea"
                rows="8"
                value={characterCardsPrompt || '先完成故事梗概和画面风格，再复制这里的角色卡提示词。'}
                readOnly />
              
                        </label>

                        <label className="ai-manju-field">
                            <span>{'把外部 AI 生成的角色卡粘贴到这里'}</span>
                            <textarea
                className="ai-manju-large-textarea ai-manju-prompt-textarea"
                rows="12"
                value={characterCardsText}
                onChange={(event) => {
                  setCharacterCardsText(event.target.value);
                  setCharacterCardsError('');
                }}
                placeholder={`粘贴从外部 DeepSeek / 豆包生成的 ###CHARACTER 1 ... ###END 格式文本。系统会自动解析成 ${activeCharacterCount} 张角色卡。`} />
              
                        </label>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'解析状态'}</span>
                            <p>{characterCards.length ? parsedCharacterText() : '还没有解析到角色卡。请粘贴包含 ###CHARACTER 和 ###END 的外部生成结果。'}</p>
                        </div>

                        <div className="ai-manju-character-link-grid">
                            {Array.from({ length: activeCharacterCount }).map((_, index) =>
              <div className="ai-manju-field ai-manju-character-link-card" key={`character-image-link-${index}`}>
                                    <span>{`${characterCards[index]?.title || `角色 ${index + 1}`}参考图`}</span>
                                    <div className="ai-manju-character-upload-row">
                                        <input
                    id={`character-image-file-${index}`}
                    className="ai-manju-file-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      uploadCharacterImage(index, file);
                      event.target.value = '';
                    }} />
                  
                                        <label className="ai-manju-file-btn" htmlFor={`character-image-file-${index}`}>{'选择文件'}</label>
                                        {characterImageLinks[index]?.trim() &&
                  <button
                    type="button"
                    className="ai-manju-mini-btn"
                    onClick={() => clearCharacterImage(index)}>
                    
                                                {'清空'}
                                            </button>
                  }
                                    </div>
                                    <input
                  type="text"
                  value={characterImageLinks[index] || ''}
                  onChange={(event) => updateCharacterImageLink(index, event.target.value)}
                  placeholder={'也可以粘贴豆包生成图、网盘图或其他可打开的图片链接'} />
                
                                    {characterImageUploadErrors[index] &&
                <p className="ai-manju-upload-error">{characterImageUploadErrors[index]}</p>
                }
                                    <div className={`ai-manju-character-image-preview ${characterImagePreviews[index] || canPreviewImageLink(characterImageLinks[index] || '') ? '' : 'empty'}`}>
                                        {characterImagePreviews[index] || canPreviewImageLink(characterImageLinks[index] || '') ?
                  <img
                    src={characterImagePreviews[index] || resolveApiAssetUrl(characterImageLinks[index].trim())}
                    alt={`${characterCards[index]?.title || `角色 ${index + 1}`}参考图`}
                    loading="lazy"
                    decoding="async" /> :


                  <span>{characterImageLinks[index]?.trim() || '上传或粘贴角色参考图后显示预览'}</span>
                  }
                                    </div>
                                </div>
              )}
                        </div>

                        <button
              type="button"
              className="ai-manju-primary-btn ai-manju-primary-btn-wide"
              onClick={() => setCurrentStep(4)}
              disabled={!characterCards.length && !characterCardsText.trim()}>
              
                            {'确定角色卡并进入下一步'}
                        </button>
                    </section>

                    <aside className="ai-manju-panel ai-manju-doubao-aside">
                        <div className="ai-manju-panel-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'豆包生图'}</p>
                                <h3>{'逐个复制角色提示词'}</h3>
                            </div>
                        </div>

                        {characterCards.length ?
            <div className="ai-manju-doubao-prompt-list">
                                {characterCards.slice(0, activeCharacterCount).map((card, index) =>
              <div className="ai-manju-doubao-prompt-card" key={card.id}>
                                        <div className="ai-manju-doubao-prompt-head">
                                            <span className="ai-manju-chip">{`角色 ${index + 1}`}</span>
                                            <button
                    type="button"
                    className="ai-manju-mini-btn"
                    onClick={() => copyText(card.sheetPrompt, `doubao-character-${card.id}`)}>
                    
                                                {copiedKey === `doubao-character-${card.id}` ? '已复制' : '复制'}
                                            </button>
                                        </div>
                                        <strong>{card.title}</strong>
                                        <textarea
                  className="ai-manju-mini-textarea"
                  rows="7"
                  value={card.sheetPrompt}
                  readOnly />
                
                                    </div>
              )}
                            </div> :

            <div className="ai-manju-preview-card">
                                <span className="ai-manju-chip">{'等待角色卡'}</span>
                                <p>{'先在左边生成或粘贴角色卡。解析成功后，这里会按人物逐个显示给豆包生成角色图的提示词。'}</p>
                            </div>
            }
                    </aside>
                </div>);

    }

    if (currentStep === 4) {
      return (
        <div className="ai-manju-step-layout ai-manju-step-layout-prompts">
                <section className="ai-manju-panel">
                    <div className="ai-manju-final-shell">
	                        <div className="ai-manju-final-head">
	                            <div>
	                                <p className="ai-manju-panel-kicker">{'外部生成'}</p>
	                                <h3>{'复制提示词到外部工具，再把结果粘回来'}</h3>
	                            </div>
	                            <p className="ai-manju-final-desc">{'这一步不消耗系统 API。学生可复制到 DeepSeek、豆包或其他对话工具生成 27 段分镜。'}</p>
	                        </div>

                        <div className="ai-manju-final-grid">
                            <article className="ai-manju-final-card ai-manju-final-card-story">
                                <span className="ai-manju-final-label">{'一句话故事'}</span>
                                <p className="ai-manju-final-text">{previewStoryLine || '还没有确定一句话故事。'}</p>
                            </article>

                            <article className="ai-manju-final-card ai-manju-final-card-style">
                                <span className="ai-manju-final-label">{'画面风格'}</span>
                                <p className="ai-manju-final-title">{selectedStyleInfo?.name || '还没有选定画面风格'}</p>
                                <p className="ai-manju-final-meta">{selectedStyleInfo?.description || '先在上一步选一个明确的风格。'}</p>
                            </article>

	                            <article className="ai-manju-final-card ai-manju-final-card-synopsis">
	                                <span className="ai-manju-final-label">{'扩写梗概'}</span>
	                                <p className="ai-manju-final-text">{synopsis.trim() || '还没有生成故事梗概。'}</p>
	                            </article>
	                            <article className="ai-manju-final-card ai-manju-final-card-synopsis">
	                                <span className="ai-manju-final-label">{'角色卡'}</span>
	                                <p className="ai-manju-final-text">{characterCards.length ? parsedCharacterText() : '还没有角色卡。'}</p>
	                            </article>
	                            <article className="ai-manju-final-card ai-manju-final-card-synopsis">
	                                <span className="ai-manju-final-label">{'分段提示词'}</span>
	                                <p className="ai-manju-final-text">{segments.length ? parsedSegmentText() : '还没有分段提示词。'}</p>
	                            </article>
	                        </div>

                        <div className="ai-manju-final-actions">
                            <button type="button" className="ai-manju-primary-btn ai-manju-primary-btn-wide" onClick={copySegmentGenerationPrompt}>
                                {copiedKey === 'segment-generation-prompt' ? '外部生成提示词已复制' : '复制外部生成提示词'}
                            </button>
                            <button type="button" className="ai-manju-ghost-btn" onClick={copyAllPrompts} disabled={!segments.length}>
                                {copiedKey === 'all-prompts' ? '全部已复制' : '复制全部'}
                            </button>
                        </div>

	                        <label className="ai-manju-field">
	                            <span>{'给外部 AI 的完整提示词'}</span>
	                            <textarea
                  className="ai-manju-large-textarea ai-manju-prompt-textarea"
                  rows="12"
                  value={segmentGenerationPrompt || '先完成一句话故事、故事梗概和画面风格，再复制这里的外部生成提示词。'}
                  readOnly />
                
	                        </label>

                        <label className="ai-manju-field">
                            <span>{'把外部 AI 生成的 27 段结果粘贴到这里'}</span>
                            <textarea
                  className="ai-manju-large-textarea ai-manju-prompt-textarea"
                  rows="12"
                  value={promptStreamText}
                  onChange={(event) => {
                    setPromptStreamText(event.target.value);
                    setPromptsError('');
                  }}
                  placeholder={'粘贴从外部 DeepSeek / 豆包生成的 ###SEGMENT 1 ... ###END 格式文本。系统会自动解析成下面的 27 张分段卡片。'} />
                
	                        </label>

	                        <div className="ai-manju-preview-card">
	                            <span className="ai-manju-chip">{'解析状态'}</span>
	                            <p>{segments.length ? parsedSegmentText() : '还没有解析到分段结果。请粘贴包含 ###SEGMENT 和 ###END 的外部生成结果。'}</p>
	                        </div>

                        <div className="ai-manju-preview-card">
                            <span className="ai-manju-chip">{'最终总汇'}</span>
                            <p>{'这一页就是学生准备提交给豆包的完整预览。角色卡、首帧、尾帧、27 段提示词都在这里收口。'}</p>
                        </div>

                        <button
                type="button"
                className="ai-manju-primary-btn ai-manju-primary-btn-wide"
                onClick={() => setCurrentStep(5)}
                disabled={!segments.length && !promptStreamText.trim()}>
                
                            {'确定分段并进入最终预览'}
                        </button>
	                    </div>

	                    {promptsError && <p className="ai-manju-error-text">{promptsError}</p>}
	                </section>
	
	                <section className="ai-manju-segment-list">
	                    {segments.length === 0 &&
            <div className="ai-manju-empty-state">
	                            <h3>{'粘贴外部生成结果后会自动展开'}</h3>
	                            <p>{'这里会按 10 秒一段解析 27 组提示词。'}</p>
	                        </div>
            }

                    {segments.map((segment, index) =>
            <article key={segment.id} className="ai-manju-segment-card">
                            <div className="ai-manju-panel-head">
                                <div>
                                    <span className="ai-manju-chip">{segment.segmentPhase || segment.timeRange}</span>
                                    {segment.segmentPhase && <span className="ai-manju-chip">{segment.timeRange}</span>}
                                    <h3>{segment.title}</h3>
                                </div>
                                <button
                  type="button"
                  className="ai-manju-ghost-btn"
                  onClick={() => copyText(
                    buildDoubaoSegmentPrompt(segment, index),
                    segment.id
                  )}>
                  
                                    {copiedKey === segment.id ? '已复制' : '复制给豆包'}
                                </button>
                            </div>

                            <div className="ai-manju-grid ai-manju-grid-two">
                                <div className="ai-manju-preview-card"><span className="ai-manju-chip">{'剧情说明'}</span><p>{segment.summary}</p></div>
                                <div className="ai-manju-preview-card">
                                    <span className="ai-manju-chip">{index === 0 ? '首帧提示词' : '首帧来源'}</span>
                                    <p>{index === 0 ? segment.startPrompt : segment.startSource || '承接上一段尾帧，不重新生成首帧图'}</p>
                                </div>
                                <div className="ai-manju-preview-card"><span className="ai-manju-chip">{'尾帧提示词'}</span><p>{segment.endPrompt}</p></div>
                                <div className="ai-manju-preview-card"><span className="ai-manju-chip">{'运镜提示词'}</span><p>{segment.cameraPrompt}</p></div>
                                <div className="ai-manju-preview-card"><span className="ai-manju-chip">{'配乐提示词'}</span><p>{segment.musicPrompt}</p></div>
                                <div className="ai-manju-preview-card"><span className="ai-manju-chip">{'台词 / 配音提示词'}</span><p>{segment.voicePrompt}</p></div>
                            </div>

                            <div className="ai-manju-preview-card">
                                <span className="ai-manju-chip">{'剧本提示词'}</span>
                                <p>{segment.scriptPrompt}</p>
                            </div>
                        </article>
            )}
                </section>
            </div>);

    }

    return (
      <div className="ai-manju-step-layout ai-manju-step-layout-prompts">
                <section className="ai-manju-panel">
                    <div className="ai-manju-final-shell">
                        <div className="ai-manju-final-head">
                            <div>
                                <p className="ai-manju-panel-kicker">{'最终预览'}</p>
                                <h3>{'上面看剧本，下面补角色和首尾帧'}</h3>
                            </div>
                            <p className="ai-manju-final-desc">{'每段上行是给豆包的提示词，下行是角色卡、首帧和尾帧。上传尾帧后，下一段首帧会自动接上。'}</p>
                        </div>

                        <div className="ai-manju-final-summary-strip">
                            <span>{selectedStyleInfo?.name || '未选风格'}</span>
                            <span>{characterCards.length ? `${characterCards.length} / ${activeCharacterCount} 张角色卡` : '未解析角色卡'}</span>
                            <span>{segments.length ? `${segments.length} / ${COURSE_TOTAL_SEGMENTS} 段` : '未解析分段'}</span>
                        </div>

                        {segments.length > 0 ?
            <div className="ai-manju-final-row-list">
                                {segments.map((segment, segmentIndex) => {
                const roleStates = inferSegmentRoleStates(segment, previewRoleCards);
                const hasAnyMatchedRole = roleStates.some(Boolean);
                return (
                  <article key={`preview-${segment.id}`} className="ai-manju-final-row">
                                            <div className="ai-manju-final-row-main">
                                                <div className="ai-manju-final-row-head">
                                                    <div>
                                                        <span className="ai-manju-chip">{segment.segmentPhase || segment.timeRange || '分段'}</span>
                                                        {segment.timeRange && <span className="ai-manju-chip">{segment.timeRange}</span>}
                                                        <strong>{segment.title}</strong>
                                                    </div>
                                                    <button
                          type="button"
                          className="ai-manju-mini-btn"
                          onClick={() => copyText(buildDoubaoSegmentPrompt(segment, segmentIndex), `preview-${segment.id}`)}>
                          
                                                        {copiedKey === `preview-${segment.id}` ? '已复制' : '复制提示词'}
                                                    </button>
                                                </div>
                                                <p className="ai-manju-final-row-text">{buildDoubaoSegmentPrompt(segment, segmentIndex)}</p>
                                            </div>

                                            <div className="ai-manju-final-row-thumbs" aria-label={'本段缩略图'}>
                                                {Array.from({ length: COURSE_TOTAL_ROLES }).map((_, index) => {
                        const card = previewRoleCards[index];
                        const isActive = card ? roleStates[index] || !hasAnyMatchedRole && activeCharacterCount === 1 : false;
                        const imageLink = characterImageLinks[index]?.trim();
                        const imagePreviewUrl = resolveApiAssetUrl(imageLink);
                        return (
                          <div
                            key={`${segment.id}-role-${index}`}
                            className={`ai-manju-final-role-slot ${isActive ? 'active' : 'muted'}`}
                            title={card ? `${card.title}${isActive ? '：本段使用' : '：本段未使用'}` : `角色 ${index + 1}`}>
                            
                                                            <div className="ai-manju-final-role-image">
                                                                {imageLink && canPreviewImageLink(imageLink) ?
                              <img src={imagePreviewUrl} alt={card?.title || `角色 ${index + 1}`} /> :

                              <span>{card?.title?.slice(0, 2) || index + 1}</span>
                              }
                                                            </div>
                                                            <strong>{card?.title || `角色 ${index + 1}`}</strong>
                                                        </div>);

                      })}
                                                {renderSegmentFrameSlot(segmentIndex, 'start', '首帧')}
                                                {renderSegmentFrameSlot(segmentIndex, 'end', '尾帧')}
                                            </div>
                                        </article>);

              })}
                            </div> :

            <div className="ai-manju-empty-state">
                                <h3>{'先粘贴并解析 27 段分段提示词'}</h3>
                                <p>{'解析成功后，这里会按 10 秒一段显示成横向列表，每行都能直接复制给豆包。'}</p>
                            </div>
            }
                    </div>
                </section>
            </div>);

  };

  return (
    <div className="ai-manju-studio">
            <header className="ai-manju-hero">
                <div className="ai-manju-hero-main">
                    <p className="ai-manju-kicker">AI MANJU STUDIO</p>
                    <h1>{'AI漫剧一键生成'}</h1>
                    <p className="ai-manju-lead">
                        {'顶部六个流程就是主导航。学生可以直接点任意一步，内容区只展示当前这一步，页面会轻很多。'}
                    </p>
                </div>
                <div className="ai-manju-hero-side">
                    <div className="ai-manju-project-actions">
                        <span className="ai-manju-project-title">
                            {currentProjectId ? currentProjectTitle || '已保存作品' : '未保存作品'}
                        </span>
                        <button
              type="button"
              className="ai-manju-primary-btn"
              onClick={saveExistingProject}
              disabled={projectSaving}>
              
                            {projectSaving ? '保存中…' : currentProjectId ? '保存修改' : '保存作品'}
                        </button>
                    </div>
                    {projectSaveError && <p className="ai-manju-error">{projectSaveError}</p>}
                    <div className="ai-manju-tag-cloud">
                        <span>{'4分30秒总片'}</span>
                        <span>{'10秒一段'}</span>
                        <span>{'3张角色卡'}</span>
                        <span>{`${COURSE_TOTAL_SEGMENTS}组提示词`}</span>
                        <span>{'最终预览'}</span>
                        <span>{'连续分段'}</span>
                    </div>
                    <p className="ai-manju-hero-note">{'当前步骤：'}{flowStepText(FLOW_STEPS[currentStep], 'short')}</p>
                </div>
            </header>

            <nav className="ai-manju-top-steps" aria-label={'AI漫剧六步流程'}>
                {FLOW_STEPS.map((step, index) =>
        <button
          key={step.key}
          type="button"
          className={`ai-manju-step-tab ${currentStep === index ? 'active' : ''}`}
          onClick={() => setCurrentStep(index)}>
          
                        <span>{step.label}</span>
                        <strong>{flowStepText(step, 'short')}</strong>
                    </button>
        )}
            </nav>

            <section className="ai-manju-current-step">
                <div className="ai-manju-section-head">
                    <div>
                        <p className="ai-manju-kicker">STEP {currentStep + 1} / 6</p>
                        <h2>{flowStepText(FLOW_STEPS[currentStep], 'title')}</h2>
                    </div>
                    <p className="ai-manju-section-desc">{flowStepText(FLOW_STEPS[currentStep], 'desc')}</p>
                </div>
                {renderStepContent()}
            </section>

            {showSaveModal &&
      <div className="modal-overlay" onClick={() => !projectSaving && setShowSaveModal(false)}>
                    <div className="modal-small" onClick={(e) => e.stopPropagation()}>
                        <h3>{'保存 AI 漫剧作品'}</h3>
                        <input
            type="text"
            placeholder={'输入作品名称'}
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            autoFocus />
          
                        {projectSaveError && <p className="ai-manju-error">{projectSaveError}</p>}
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowSaveModal(false)} disabled={projectSaving}>{'取消'}</button>
                            <button type="button" className="btn-primary" onClick={confirmCreateProject} disabled={projectSaving}>
                                {projectSaving ? '保存中…' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
      }
        </div>);

}
