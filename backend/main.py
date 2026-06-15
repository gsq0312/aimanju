from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import shutil
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field


APP_ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("AIMANJU_DATA_DIR", APP_ROOT / "data")).resolve()
UPLOAD_DIR = Path(os.getenv("AIMANJU_UPLOAD_DIR", DATA_DIR / "uploads")).resolve()
DB_PATH = Path(os.getenv("AIMANJU_DB_PATH", DATA_DIR / "aimanju.db")).resolve()
TOKEN_DAYS = int(os.getenv("AIMANJU_TOKEN_DAYS", "30"))
FRONTEND_DIST = Path(os.getenv("AIMANJU_FRONTEND_DIST", APP_ROOT.parent / "frontend" / "dist")).resolve()

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI漫剧一键生成", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("AIMANJU_CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def db_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                student_id TEXT NOT NULL UNIQUE,
                class_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tokens (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT 'AI漫剧一键生成作品',
                project_type TEXT NOT NULL DEFAULT 'ai_manju',
                manju_data TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )


init_db()


def normalize_text(value: Optional[str]) -> str:
    return (value or "").strip()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, salt, digest_hex = encoded.split("$", 2)
    except ValueError:
        return False
    if scheme != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_token(conn: sqlite3.Connection, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    conn.execute(
        "INSERT INTO tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (token, user_id, expires.isoformat(), now_iso()),
    )
    return token


def user_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "student_id": row["student_id"],
        "class_name": row["class_name"],
        "role": "student",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_current_user(authorization: Optional[str] = Header(default=None)) -> sqlite3.Row:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="请登录后使用")
    token = authorization.split(" ", 1)[1].strip()
    with db_conn() as conn:
        row = conn.execute(
            """
            SELECT users.*
            FROM tokens
            JOIN users ON users.id = tokens.user_id
            WHERE tokens.token = ? AND tokens.expires_at > ?
            """,
            (token, now_iso()),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
        return row


class LoginRequest(BaseModel):
    student_id: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    student_id: str
    class_name: str
    password: str = Field(min_length=6)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    student_id: Optional[str] = None
    class_name: Optional[str] = None


class ManjuProjectCreate(BaseModel):
    title: str
    manju_data: dict[str, Any] = Field(default_factory=dict)


class ManjuProjectUpdate(BaseModel):
    title: Optional[str] = None
    manju_data: Optional[Dict[str, Any]] = None


class StoryRequest(BaseModel):
    character: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    story_type_key: Optional[str] = None


class SynopsisRequest(StoryRequest):
    story: Optional[str] = None


class CharacterCardsRequest(SynopsisRequest):
    synopsis: Optional[str] = None
    style_name: Optional[str] = None
    style_prompt_template: Optional[str] = None


def project_payload(row: sqlite3.Row) -> dict[str, Any]:
    try:
        manju_data = json.loads(row["manju_data"] or "{}")
    except json.JSONDecodeError:
        manju_data = {}
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "description": row["description"],
        "project_type": row["project_type"],
        "manju_data": manju_data,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "aimanju"}


@app.post("/api/auth/register")
def register(data: RegisterRequest) -> dict[str, Any]:
    name = normalize_text(data.name)
    email = normalize_text(data.email).lower()
    student_id = normalize_text(data.student_id)
    class_name = normalize_text(data.class_name)
    if not name or not email or not student_id or not class_name:
        raise HTTPException(status_code=400, detail="姓名、邮箱、学号、班级都必须填写")

    with db_conn() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO users (name, email, student_id, class_name, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (name, email, student_id, class_name, hash_password(data.password), now_iso(), now_iso()),
            )
        except sqlite3.IntegrityError as exc:
            message = str(exc).lower()
            if "email" in message:
                raise HTTPException(status_code=409, detail="邮箱已注册")
            if "student_id" in message:
                raise HTTPException(status_code=409, detail="学号已注册")
            raise HTTPException(status_code=409, detail="账号已存在")
        token = create_token(conn, int(cursor.lastrowid))
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/auth/login")
def login(data: LoginRequest) -> dict[str, Any]:
    account = normalize_text(data.student_id).lower()
    with db_conn() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE lower(student_id) = ? OR lower(email) = ?",
            (account, account),
        ).fetchone()
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="账号或密码错误")
        token = create_token(conn, int(user["id"]))
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me")
def me(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    return user_payload(user)


@app.put("/api/auth/settings")
def update_settings(data: ProfileUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    fields: dict[str, str] = {}
    if data.name is not None:
        fields["name"] = normalize_text(data.name)
    if data.email is not None:
        fields["email"] = normalize_text(str(data.email)).lower()
    if data.student_id is not None:
        fields["student_id"] = normalize_text(data.student_id)
    if data.class_name is not None:
        fields["class_name"] = normalize_text(data.class_name)
    if any(value == "" for value in fields.values()):
        raise HTTPException(status_code=400, detail="个人资料字段不能为空")
    if not fields:
        return user_payload(user)
    fields["updated_at"] = now_iso()

    assignments = ", ".join(f"{key} = ?" for key in fields)
    values = list(fields.values()) + [user["id"]]
    with db_conn() as conn:
        try:
            conn.execute(f"UPDATE users SET {assignments} WHERE id = ?", values)
        except sqlite3.IntegrityError as exc:
            message = str(exc).lower()
            if "email" in message:
                raise HTTPException(status_code=409, detail="邮箱已被使用")
            if "student_id" in message:
                raise HTTPException(status_code=409, detail="学号已被使用")
            raise
        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    return user_payload(updated)


@app.get("/api/projects/manju")
def list_manju_projects(user: sqlite3.Row = Depends(get_current_user)) -> list[dict[str, Any]]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM projects WHERE user_id = ? AND project_type = 'ai_manju' ORDER BY updated_at DESC, id DESC",
            (user["id"],),
        ).fetchall()
    return [project_payload(row) for row in rows]


@app.post("/api/projects/manju")
def create_manju_project(data: ManjuProjectCreate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    title = normalize_text(data.title) or "未命名AI漫剧"
    timestamp = now_iso()
    with db_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO projects (user_id, title, description, project_type, manju_data, created_at, updated_at)
            VALUES (?, ?, ?, 'ai_manju', ?, ?, ?)
            """,
            (user["id"], title, "AI漫剧一键生成作品", json.dumps(data.manju_data, ensure_ascii=False), timestamp, timestamp),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return project_payload(row)


@app.get("/api/projects/manju/{project_id}")
def get_manju_project(project_id: int, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ? AND user_id = ? AND project_type = 'ai_manju'",
            (project_id, user["id"]),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="作品不存在")
    return project_payload(row)


@app.put("/api/projects/manju/{project_id}")
def update_manju_project(project_id: int, data: ManjuProjectUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    fields: dict[str, Any] = {"updated_at": now_iso()}
    if data.title is not None:
        fields["title"] = normalize_text(data.title) or "未命名AI漫剧"
    if data.manju_data is not None:
        fields["manju_data"] = json.dumps(data.manju_data, ensure_ascii=False)

    assignments = ", ".join(f"{key} = ?" for key in fields)
    values = list(fields.values()) + [project_id, user["id"]]
    with db_conn() as conn:
        cursor = conn.execute(
            f"UPDATE projects SET {assignments} WHERE id = ? AND user_id = ? AND project_type = 'ai_manju'",
            values,
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="作品不存在")
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return project_payload(row)


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, str]:
    with db_conn() as conn:
        cursor = conn.execute(
            "DELETE FROM projects WHERE id = ? AND user_id = ? AND project_type = 'ai_manju'",
            (project_id, user["id"]),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="作品不存在")
    return {"message": "deleted"}


@app.get("/api/manju/gallery")
def manju_gallery(user: sqlite3.Row = Depends(get_current_user)) -> list[dict[str, Any]]:
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT projects.*, users.name AS author_name, users.student_id, users.class_name
            FROM projects
            JOIN users ON users.id = projects.user_id
            WHERE projects.project_type = 'ai_manju'
            ORDER BY projects.updated_at DESC, projects.id DESC
            LIMIT 120
            """
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "author_name": row["author_name"],
            "student_id": row["student_id"],
            "class_name": row["class_name"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def validate_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".gif", ".webp"}:
        raise HTTPException(status_code=400, detail="仅支持 JPG、PNG、GIF、WEBP 图片")
    return ".jpg" if suffix == ".jpeg" else suffix


async def save_upload(file: UploadFile, user: sqlite3.Row, prefix: str) -> dict[str, str]:
    suffix = validate_upload(file)
    user_dir = UPLOAD_DIR / "manju" / str(user["id"])
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}-{secrets.token_hex(12)}{suffix}"
    path = user_dir / filename
    with path.open("wb") as target:
        shutil.copyfileobj(file.file, target)
    return {"url": f"/api/uploads/manju/{user['id']}/{filename}"}


@app.get("/api/uploads/manju/{user_id}/{filename}")
def get_uploaded_image(user_id: str, filename: str):
    path = UPLOAD_DIR / "manju" / Path(user_id).name / Path(filename).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")
    return FileResponse(path)


@app.post("/api/ai/manju/upload-character-image")
async def upload_character_image(file: UploadFile = File(...), user: sqlite3.Row = Depends(get_current_user)) -> dict[str, str]:
    return await save_upload(file, user, "character")


@app.post("/api/ai/manju/upload-frame-image")
async def upload_frame_image(file: UploadFile = File(...), user: sqlite3.Row = Depends(get_current_user)) -> dict[str, str]:
    return await save_upload(file, user, "frame")


@app.get("/api/ai/usage")
def ai_usage(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, int]:
    return {"remaining": 999, "weekly_limit": 999, "used_this_week": 0}


def story_text(payload: StoryRequest) -> str:
    character = payload.character or "2个主要人物"
    world = payload.time or "都市异能"
    location = payload.location or "地铁末班车"
    return f"在{world}世界的{location}，{character}因一次误会被推到绝境，主角必须在十分钟内揭开隐藏身份，完成反击并留下新的悬念。"


def synopsis_text(payload: SynopsisRequest) -> str:
    story = payload.story or story_text(payload)
    return (
        f"{story}\n\n"
        "第一幕：主角在熟悉场景中遭遇公开质疑，一个细节暗示事情并不简单。\n"
        "第二幕：对手持续施压，主角被迫寻找证据，同时关系人物开始动摇。\n"
        "第三幕：主角发现关键线索，但也暴露了真正的危险来源。\n"
        "第四幕：主角在最后时刻反转局势，解决眼前冲突，并把更大的秘密留到结尾。"
    )


def character_cards_text(payload: CharacterCardsRequest) -> str:
    style = payload.style_name or "统一动漫"
    base_names = ["林知夏", "顾沉", "周眠"]
    roles = ["主角", "关键对手", "关系推动者"]
    blocks = []
    for index, name in enumerate(base_names, start=1):
        blocks.append(
            f"###CHARACTER {index}\n"
            f"角色名称：{name}\n"
            f"角色定位：{roles[index - 1]}\n"
            f"人物简介：围绕故事核心冲突行动的人物，情绪明确，适合短剧镜头表现。\n"
            f"不变锚点：固定发型、固定服装主色、固定配饰，所有镜头保持一致。\n"
            f"正面提示词：{style}风格，正面站姿，清晰五官，服装细节明确，白底角色设定卡。\n"
            f"侧面提示词：{style}风格，侧面站姿，轮廓清晰，发型和服装与正面一致。\n"
            f"背面提示词：{style}风格，背面站姿，展示服装背部结构和配饰。\n"
            f"表情提示词：同一角色的平静、震惊、愤怒、释然四种表情，保持脸型一致。\n"
            f"配饰提示词：展示角色标志性配饰和服装纹理特写。\n"
            f"角色设定总提示词：只生成一张完整的角色设定卡图，不要输出多张独立图片，{style}风格，包含正面、侧面、背面、表情和配饰特写。\n"
            "###END"
        )
    return "\n\n".join(blocks)


def sse_stream(text: str) -> Iterator[str]:
    for index in range(0, len(text), 16):
        chunk = text[index : index + 16]
        yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


@app.post("/api/ai/manju/stream-one-line-story")
def stream_one_line_story(payload: StoryRequest, user: sqlite3.Row = Depends(get_current_user)):
    return StreamingResponse(
        sse_stream(story_text(payload)),
        media_type="text/event-stream",
        headers={"X-Remaining": "999", "X-Weekly-Limit": "999", "X-Used-This-Week": "0"},
    )


@app.post("/api/ai/manju/stream-synopsis")
def stream_synopsis(payload: SynopsisRequest, user: sqlite3.Row = Depends(get_current_user)):
    return StreamingResponse(
        sse_stream(synopsis_text(payload)),
        media_type="text/event-stream",
        headers={"X-Remaining": "999", "X-Weekly-Limit": "999", "X-Used-This-Week": "0"},
    )


@app.post("/api/ai/manju/stream-character-cards")
def stream_character_cards(payload: CharacterCardsRequest, user: sqlite3.Row = Depends(get_current_user)):
    return StreamingResponse(
        sse_stream(character_cards_text(payload)),
        media_type="text/event-stream",
        headers={"X-Remaining": "999", "X-Weekly-Limit": "999", "X-Used-This-Week": "0"},
    )


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = (FRONTEND_DIST / full_path).resolve()
        if candidate.is_file() and FRONTEND_DIST in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
