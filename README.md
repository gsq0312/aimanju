# AI Manju Studio / AI漫剧一键生成

AI Manju Studio is a lightweight teaching-oriented tool for building short AI anime-drama projects. It guides students through story setup, synopsis expansion, character cards, scene prompts, and a project gallery workflow.

AI漫剧一键生成是一个面向教学场景的轻量创作工具，用来帮助学生完成短篇 AI 漫剧项目：从故事设定、梗概扩写、角色卡、分镜提示词到作品墙展示，形成一条清晰的创作流程。

## Features / 功能

- Independent FastAPI backend and React frontend
- Local SQLite persistence for registered users and projects
- Structured AI-drama workflow for story, synopsis, character cards, and scene prompts
- Character and frame image uploads for project drafts
- Gallery view for completed student projects
- No production database, uploaded student files, or API keys are included in this repository

## Tech Stack / 技术栈

- Backend: Python, FastAPI, SQLite
- Frontend: React, Vite
- Auth: simple bearer-token session flow for classroom prototypes

## Local Development / 本地运行

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
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

## Data And Privacy / 数据与隐私

Runtime data is written to `backend/data/` by default. Uploaded images are stored under the runtime upload directory. These folders are ignored by Git and should not be committed.

默认运行数据写入 `backend/data/`。上传图片保存在运行时上传目录中。这些目录已加入 `.gitignore`，不应提交到公开仓库。

## Public Release Notes / 公开说明

This repository is prepared as a source-code example. It does not include real student records, production uploads, deployment credentials, or model provider API keys.

本仓库作为源码示例公开，不包含真实学生记录、生产上传文件、部署凭据或模型供应商 API Key。
