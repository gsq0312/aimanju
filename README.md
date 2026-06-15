# AI漫剧一键生成

独立 AI漫剧系统，使用独立数据库和上传目录，不读取、不写入旧学生系统数据。

## 本地运行

后端：

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 18110
```

前端：

```bash
cd frontend
npm install
npm run dev
```

默认前端地址：`http://127.0.0.1:5177`
默认后端地址：`http://127.0.0.1:18110`
