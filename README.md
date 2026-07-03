# AI Manju Studio / AI漫剧一键生成

AI Manju Studio is a teaching-oriented AI anime-drama creation system. It guides students through story setup, synopsis expansion, visual style selection, character cards, scene prompts, final preview, and classroom gallery sharing.

AI漫剧一键生成是一个面向课堂教学的 AI 漫剧创作系统，支持学生从一句话故事、梗概扩写、画面风格、角色设定卡、分段提示词到最终预览和作品墙展示，完成一条完整创作流程。

## Features / 功能

- Public-first studio UI: students can browse and create before logging in, and log in/register from the side controls when saving is needed.
- Independent FastAPI backend and React frontend.
- Local SQLite persistence for registered users, projects, groups, gallery works, and AI usage events.
- Personal and group projects, including shared group drafts visible to group members.
- Gallery workflow for publishing, viewing, deleting own works, and teacher-style takedown roles.
- DeepSeek usage tracking for request counts, tokens, estimated cost, classes, students, models, endpoints, and status.
- Style reference images served from `/aimanju/assets/style-images/...`.
- No production database, uploaded student files, deployment credentials, or model provider API keys are included in this repository.

## Tech Stack / 技术栈

- Backend: Python, FastAPI, SQLite
- Frontend: React, Vite
- Auth: simple bearer-token session flow for classroom use

## Local Development / 本地运行

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 18110
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://127.0.0.1:5177`

Default backend URL: `http://127.0.0.1:18110`

## Production Build / 生产构建

For deployment under `https://gsqai.cn/aimanju/`, build with:

```bash
cd frontend
VITE_BASE_PATH=/aimanju/ npm run build
```

Then publish `frontend/dist` to the configured Nginx static directory.

## Data And Privacy / 数据与隐私

Runtime data is written to the configured data directory, such as `/root/aimanju_data` in production or `backend/data/` in local development. Uploaded images are stored under the runtime upload directory. These folders are ignored by Git and should not be committed.

默认运行数据写入配置的数据目录，例如生产环境 `/root/aimanju_data`，本地开发默认 `backend/data/`。上传图片保存在运行时上传目录中。这些目录已加入 `.gitignore`，不应提交到仓库。
