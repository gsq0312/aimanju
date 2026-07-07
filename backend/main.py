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

import httpx
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
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
AI_API_BASE = os.getenv("AIMANJU_AI_API_BASE") or os.getenv("AI_API_BASE") or "https://api.deepseek.com/v1"
AI_API_KEY = os.getenv("AIMANJU_DEEPSEEK_API_KEY") or os.getenv("DEEPSEEK_API_KEY") or os.getenv("AI_API_KEY")
AI_MODEL = os.getenv("AIMANJU_AI_MODEL") or os.getenv("AI_MODEL") or "deepseek-chat"
AI_TIMEOUT_SECONDS = float(os.getenv("AIMANJU_AI_TIMEOUT_SECONDS", "120"))
ALLOWED_REGISTER_CLASSES = [
    "2401",
    "2402",
    "2403",
]
DEFAULT_MAX_GROUP_MEMBERS = 6

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
                group_id INTEGER REFERENCES student_groups(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT 'AI漫剧一键生成作品',
                project_type TEXT NOT NULL DEFAULT 'ai_manju',
                manju_data TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS student_groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name TEXT NOT NULL,
                name TEXT NOT NULL,
                created_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                max_members INTEGER NOT NULL DEFAULT 6,
                is_locked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(class_name, name)
            );

            CREATE TABLE IF NOT EXISTS student_group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role TEXT NOT NULL DEFAULT 'member',
                joined_at TEXT NOT NULL,
                UNIQUE(group_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS wall_works (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                group_id INTEGER REFERENCES student_groups(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                video_url TEXT NOT NULL,
                cover_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        project_columns = {row["name"] for row in conn.execute("PRAGMA table_info(projects)").fetchall()}
        if "group_id" not in project_columns:
            conn.execute("ALTER TABLE projects ADD COLUMN group_id INTEGER REFERENCES student_groups(id) ON DELETE SET NULL")


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


class GroupCreateRequest(BaseModel):
    name: str


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


def row_value(row: sqlite3.Row, key: str, default: Any = None) -> Any:
    return row[key] if key in row.keys() else default


def project_payload(row: sqlite3.Row) -> dict[str, Any]:
    try:
        manju_data = json.loads(row["manju_data"] or "{}")
    except json.JSONDecodeError:
        manju_data = {}
    group_id = row["group_id"]
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "group_id": group_id,
        "scope": "group" if group_id else "personal",
        "author_name": row_value(row, "author_name"),
        "author_student_id": row_value(row, "author_student_id"),
        "group_name": row_value(row, "group_name"),
        "title": row["title"],
        "description": row["description"],
        "project_type": row["project_type"],
        "manju_data": manju_data,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def validate_class_name(class_name: str) -> str:
    normalized = normalize_text(class_name)
    if normalized not in ALLOWED_REGISTER_CLASSES:
        raise HTTPException(status_code=400, detail="请选择有效班级")
    return normalized


def current_group_row(conn: sqlite3.Connection, user_id: int) -> Optional[sqlite3.Row]:
    return conn.execute(
        """
        SELECT student_groups.*
        FROM student_group_members
        JOIN student_groups ON student_groups.id = student_group_members.group_id
        WHERE student_group_members.user_id = ?
        ORDER BY student_group_members.joined_at ASC, student_group_members.id ASC
        LIMIT 1
        """,
        (user_id,),
    ).fetchone()


def group_members(conn: sqlite3.Connection, group_id: int) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT users.id AS user_id, users.name, users.student_id, student_group_members.role, student_group_members.joined_at
        FROM student_group_members
        JOIN users ON users.id = student_group_members.user_id
        WHERE student_group_members.group_id = ?
        ORDER BY student_group_members.joined_at ASC, student_group_members.id ASC
        """,
        (group_id,),
    ).fetchall()
    return [
        {
            "user_id": row["user_id"],
            "name": row["name"],
            "student_id": row["student_id"],
            "role": row["role"],
            "joined_at": row["joined_at"],
        }
        for row in rows
    ]


def group_has_projects(conn: sqlite3.Connection, group_id: int) -> bool:
    if conn.execute("SELECT id FROM projects WHERE group_id = ? LIMIT 1", (group_id,)).fetchone() is not None:
        return True
    return conn.execute("SELECT id FROM wall_works WHERE group_id = ? LIMIT 1", (group_id,)).fetchone() is not None


def group_payload(conn: sqlite3.Connection, row: sqlite3.Row, current_user_id: Optional[int] = None) -> dict[str, Any]:
    members = group_members(conn, int(row["id"]))
    return {
        "id": row["id"],
        "class_name": row["class_name"],
        "name": row["name"],
        "created_by_user_id": row["created_by_user_id"],
        "max_members": row["max_members"],
        "is_locked": bool(row["is_locked"]),
        "members": members,
        "has_work": group_has_projects(conn, int(row["id"])),
        "can_join": (
            not bool(row["is_locked"])
            and len(members) < int(row["max_members"] or DEFAULT_MAX_GROUP_MEMBERS)
            and current_user_id is not None
            and all(member["user_id"] != current_user_id for member in members)
        ),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def current_group_id(conn: sqlite3.Connection, user_id: int) -> Optional[int]:
    row = current_group_row(conn, user_id)
    return int(row["id"]) if row else None


def project_access_clause(user_id: int, group_id: Optional[int]) -> tuple[str, list[Any]]:
    if group_id:
        return "(projects.user_id = ? OR projects.group_id = ?)", [user_id, group_id]
    return "projects.user_id = ?", [user_id]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "aimanju"}


@app.get("/api/auth/register-options")
def register_options() -> dict[str, list[str]]:
    return {"classes": ALLOWED_REGISTER_CLASSES}


@app.post("/api/auth/register")
def register(data: RegisterRequest) -> dict[str, Any]:
    name = normalize_text(data.name)
    email = normalize_text(data.email).lower()
    student_id = normalize_text(data.student_id)
    class_name = validate_class_name(data.class_name)
    if not name or not email or not student_id:
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
        fields["class_name"] = validate_class_name(data.class_name)
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


@app.get("/api/manju/groups/status")
def group_status(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    class_name = normalize_text(user["class_name"])
    if not class_name:
        raise HTTPException(status_code=400, detail="请先选择班级")
    with db_conn() as conn:
        my_group = current_group_row(conn, int(user["id"]))
        groups = conn.execute(
            """
            SELECT *
            FROM student_groups
            WHERE class_name = ?
            ORDER BY created_at ASC, id ASC
            """,
            (class_name,),
        ).fetchall()
        return {
            "class_name": class_name,
            "my_group": group_payload(conn, my_group, int(user["id"])) if my_group else None,
            "groups": [group_payload(conn, row, int(user["id"])) for row in groups],
        }


@app.post("/api/manju/groups")
def create_group(data: GroupCreateRequest, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    class_name = normalize_text(user["class_name"])
    if not class_name:
        raise HTTPException(status_code=400, detail="请先选择班级")
    group_name = normalize_text(data.name)
    if not group_name:
        raise HTTPException(status_code=400, detail="请填写小组名称")
    timestamp = now_iso()
    with db_conn() as conn:
        if current_group_row(conn, int(user["id"])):
            raise HTTPException(status_code=400, detail="你已经加入了一个小组")
        try:
            cursor = conn.execute(
                """
                INSERT INTO student_groups (class_name, name, created_by_user_id, max_members, is_locked, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, ?, ?)
                """,
                (class_name, group_name, user["id"], DEFAULT_MAX_GROUP_MEMBERS, timestamp, timestamp),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="本班已存在同名小组")
        group_id = int(cursor.lastrowid)
        conn.execute(
            "INSERT INTO student_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'leader', ?)",
            (group_id, user["id"], timestamp),
        )
        row = conn.execute("SELECT * FROM student_groups WHERE id = ?", (group_id,)).fetchone()
        return group_payload(conn, row, int(user["id"]))


@app.post("/api/manju/groups/{group_id}/join")
def join_group(group_id: int, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    class_name = normalize_text(user["class_name"])
    if not class_name:
        raise HTTPException(status_code=400, detail="请先选择班级")
    with db_conn() as conn:
        if current_group_row(conn, int(user["id"])):
            raise HTTPException(status_code=400, detail="你已经加入了一个小组")
        row = conn.execute("SELECT * FROM student_groups WHERE id = ?", (group_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="小组不存在")
        if row["class_name"] != class_name:
            raise HTTPException(status_code=403, detail="只能加入本班小组")
        if row["is_locked"]:
            raise HTTPException(status_code=400, detail="该小组已锁定")
        members = group_members(conn, group_id)
        if len(members) >= int(row["max_members"] or DEFAULT_MAX_GROUP_MEMBERS):
            raise HTTPException(status_code=400, detail="该小组人数已满")
        conn.execute(
            "INSERT INTO student_group_members (group_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)",
            (group_id, user["id"], now_iso()),
        )
        updated = conn.execute("SELECT * FROM student_groups WHERE id = ?", (group_id,)).fetchone()
        return group_payload(conn, updated, int(user["id"]))


@app.post("/api/manju/groups/leave")
def leave_group(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    with db_conn() as conn:
        membership = conn.execute(
            """
            SELECT student_group_members.*
            FROM student_group_members
            JOIN student_groups ON student_groups.id = student_group_members.group_id
            WHERE student_group_members.user_id = ?
            LIMIT 1
            """,
            (user["id"],),
        ).fetchone()
        if not membership:
            return group_status(user)
        group_id = int(membership["group_id"])
        conn.execute("DELETE FROM student_group_members WHERE id = ?", (membership["id"],))
        remaining = conn.execute(
            "SELECT * FROM student_group_members WHERE group_id = ? ORDER BY joined_at ASC, id ASC",
            (group_id,),
        ).fetchall()
        if not remaining and not group_has_projects(conn, group_id):
            conn.execute("DELETE FROM student_groups WHERE id = ?", (group_id,))
        elif membership["role"] == "leader" and remaining and all(row["role"] != "leader" for row in remaining):
            conn.execute("UPDATE student_group_members SET role = 'leader' WHERE id = ?", (remaining[0]["id"],))

    return group_status(user)


@app.get("/api/projects/manju")
def list_manju_projects(user: sqlite3.Row = Depends(get_current_user)) -> list[dict[str, Any]]:
    with db_conn() as conn:
        group_id = current_group_id(conn, int(user["id"]))
        access_sql, access_values = project_access_clause(int(user["id"]), group_id)
        rows = conn.execute(
            f"""
            SELECT
                projects.*,
                users.name AS author_name,
                users.student_id AS author_student_id,
                student_groups.name AS group_name
            FROM projects
            JOIN users ON users.id = projects.user_id
            LEFT JOIN student_groups ON student_groups.id = projects.group_id
            WHERE projects.project_type = 'ai_manju' AND {access_sql}
            ORDER BY projects.updated_at DESC, projects.id DESC
            """,
            access_values,
        ).fetchall()
    return [project_payload(row) for row in rows]


@app.post("/api/projects/manju")
def create_manju_project(data: ManjuProjectCreate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    title = normalize_text(data.title) or "未命名AI漫剧"
    timestamp = now_iso()
    with db_conn() as conn:
        my_group = current_group_row(conn, int(user["id"]))
        group_id = my_group["id"] if my_group else None
        cursor = conn.execute(
            """
            INSERT INTO projects (user_id, group_id, title, description, project_type, manju_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'ai_manju', ?, ?, ?)
            """,
            (user["id"], group_id, title, "AI漫剧一键生成作品", json.dumps(data.manju_data, ensure_ascii=False), timestamp, timestamp),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return project_payload(row)


@app.get("/api/projects/manju/{project_id}")
def get_manju_project(project_id: int, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    with db_conn() as conn:
        group_id = current_group_id(conn, int(user["id"]))
        access_sql, access_values = project_access_clause(int(user["id"]), group_id)
        row = conn.execute(
            f"""
            SELECT
                projects.*,
                users.name AS author_name,
                users.student_id AS author_student_id,
                student_groups.name AS group_name
            FROM projects
            JOIN users ON users.id = projects.user_id
            LEFT JOIN student_groups ON student_groups.id = projects.group_id
            WHERE projects.id = ?
              AND projects.project_type = 'ai_manju'
              AND {access_sql}
            """,
            [project_id, *access_values],
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

    with db_conn() as conn:
        group_id = current_group_id(conn, int(user["id"]))
        fields["group_id"] = group_id
        assignments = ", ".join(f"{key} = ?" for key in fields)
        access_sql, access_values = project_access_clause(int(user["id"]), group_id)
        values = list(fields.values()) + [project_id, *access_values]
        cursor = conn.execute(
            f"""
            UPDATE projects
            SET {assignments}
            WHERE id = ?
              AND project_type = 'ai_manju'
              AND {access_sql}
            """,
            values,
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="作品不存在")
        row = conn.execute(
            """
            SELECT
                projects.*,
                users.name AS author_name,
                users.student_id AS author_student_id,
                student_groups.name AS group_name
            FROM projects
            JOIN users ON users.id = projects.user_id
            LEFT JOIN student_groups ON student_groups.id = projects.group_id
            WHERE projects.id = ?
            """,
            (project_id,),
        ).fetchone()
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


@app.get("/api/manju/wall-works/my")
def my_wall_works(user: sqlite3.Row = Depends(get_current_user)) -> list[dict[str, Any]]:
    with db_conn() as conn:
        group_id = current_group_id(conn, int(user["id"]))
        access_sql, access_values = project_access_clause(int(user["id"]), group_id)
        wall_access_sql = access_sql.replace("projects.", "wall_works.")
        rows = conn.execute(
            f"""
            SELECT *
            FROM wall_works
            WHERE {wall_access_sql}
            ORDER BY updated_at DESC, id DESC
            """,
            access_values,
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "video_url": row["video_url"],
            "cover_url": row["cover_url"],
            "group_id": row["group_id"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


@app.post("/api/manju/wall-works")
async def submit_wall_work(
    title: str = Form(...),
    video_url: str = Form(...),
    cover: Optional[UploadFile] = File(default=None),
    user: sqlite3.Row = Depends(get_current_user),
) -> dict[str, Any]:
    work_title = normalize_text(title)
    work_url = normalize_text(video_url)
    if not work_title or not work_url:
        raise HTTPException(status_code=400, detail="请填写作品名称和作品链接")
    cover_url = None
    if cover and cover.filename:
        cover_url = (await save_upload(cover, user, "wall-cover"))["url"]
    timestamp = now_iso()
    with db_conn() as conn:
        my_group = current_group_row(conn, int(user["id"]))
        group_id = my_group["id"] if my_group else None
        cursor = conn.execute(
            """
            INSERT INTO wall_works (user_id, group_id, title, video_url, cover_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user["id"], group_id, work_title, work_url, cover_url, timestamp, timestamp),
        )
        row = conn.execute("SELECT * FROM wall_works WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return {
        "id": row["id"],
        "title": row["title"],
        "video_url": row["video_url"],
        "cover_url": row["cover_url"],
        "group_id": row["group_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


@app.get("/api/manju/gallery")
def manju_gallery(user: sqlite3.Row = Depends(get_current_user)) -> list[dict[str, Any]]:
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                wall_works.*,
                users.name AS author_name,
                users.student_id,
                users.class_name AS user_class_name,
                student_groups.name AS group_name,
                student_groups.class_name AS group_class_name,
                (
                    SELECT GROUP_CONCAT(member_user.name, '、')
                    FROM student_group_members AS member
                    JOIN users AS member_user ON member_user.id = member.user_id
                    WHERE member.group_id = wall_works.group_id
                    ORDER BY member.joined_at ASC, member.id ASC
                ) AS group_members_text
            FROM wall_works
            JOIN users ON users.id = wall_works.user_id
            LEFT JOIN student_groups ON student_groups.id = wall_works.group_id
            ORDER BY wall_works.updated_at DESC, wall_works.id DESC
            LIMIT 120
            """
        ).fetchall()
    return [
        {
            "id": row["id"],
            "work_id": row["id"],
            "title": row["title"],
            "card_type": "group" if row["group_id"] else "individual",
            "group_id": row["group_id"],
            "group_name": row["group_name"],
            "group_members": [item for item in (row["group_members_text"] or "").split("、") if item],
            "author_name": row["author_name"],
            "student_name": row["author_name"],
            "student_id": row["student_id"],
            "user_student_id": row["student_id"],
            "class_name": row["group_class_name"] or row["user_class_name"],
            "video_url": row["video_url"],
            "cover_url": row["cover_url"],
            "item_number": "AI漫剧",
            "like_count": 0,
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
def ai_usage(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, Any]:
    return {"remaining": 999, "weekly_limit": 999, "used_this_week": 0, "provider": "deepseek", "model": AI_MODEL}


def fallback_story_text(payload: StoryRequest) -> str:
    character = payload.character or "2个主要人物"
    world = payload.time or "都市异能"
    location = payload.location or "地铁末班车"
    return f"在{world}世界的{location}，{character}因一次误会被推到绝境，主角必须在十分钟内揭开隐藏身份，完成反击并留下新的悬念。"


def fallback_synopsis_text(payload: SynopsisRequest) -> str:
    story = payload.story or fallback_story_text(payload)
    return (
        f"{story}\n\n"
        "第一幕：主角在熟悉场景中遭遇公开质疑，一个细节暗示事情并不简单。\n"
        "第二幕：对手持续施压，主角被迫寻找证据，同时关系人物开始动摇。\n"
        "第三幕：主角发现关键线索，但也暴露了真正的危险来源。\n"
        "第四幕：主角在最后时刻反转局势，解决眼前冲突，并把更大的秘密留到结尾。"
    )


def fallback_character_cards_text(payload: CharacterCardsRequest) -> str:
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


def require_ai_key() -> str:
    if not AI_API_KEY:
        raise HTTPException(status_code=503, detail="DeepSeek API Key 未配置")
    return AI_API_KEY


def deepseek_messages(system_prompt: str, user_prompt: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user", "content": user_prompt.strip()},
    ]


def story_prompt(payload: StoryRequest) -> str:
    character = payload.character or "2个主要人物"
    world = payload.time or "都市异能"
    location = payload.location or "地铁末班车"
    story_type = payload.story_type_key or "强反转短漫剧"
    return f"""
请为 AI 漫剧一键生成系统创作 1 条中文“一句话故事”。

创作条件：
- 人物：{character}
- 世界/时代：{world}
- 场景：{location}
- 类型：{story_type}

要求：
1. 只输出 1 句话，不要标题，不要解释。
2. 句子要有主角、冲突、反转和悬念。
3. 适合扩写成 4 分 30 秒、每段约 10 秒的 AI 漫剧。
"""


def synopsis_prompt(payload: SynopsisRequest) -> str:
    story = payload.story or fallback_story_text(payload)
    return f"""
请把下面的一句话故事扩写成中文 AI 漫剧剧情梗概。

一句话故事：
{story}

要求：
1. 输出“三幕式/四段式”剧情梗概，适合 4 分 30 秒短漫剧。
2. 每一幕写清楚冲突升级、关键反转、视觉化场景。
3. 不要写制作说明，不要输出无关解释。
4. 语言要适合学生直接继续生成角色卡和分镜提示词。
"""


def character_cards_prompt(payload: CharacterCardsRequest) -> str:
    story = payload.story or fallback_story_text(payload)
    synopsis = payload.synopsis or ""
    style = payload.style_name or "统一动漫"
    style_prompt = payload.style_prompt_template or ""
    return f"""
请根据剧情生成 3 个 AI 漫剧角色设定卡，必须严格使用指定格式。

一句话故事：
{story}

剧情梗概：
{synopsis}

画面风格：
{style}
{style_prompt}

格式要求：
###CHARACTER 1
角色名称：
角色定位：
人物简介：
不变锚点：
正面提示词：
侧面提示词：
背面提示词：
表情提示词：
配饰提示词：
角色设定总提示词：
###END

###CHARACTER 2
...
###END

###CHARACTER 3
...
###END

内容要求：
1. 必须输出 3 个角色。
2. 每个角色的不变锚点要能保证多镜头一致性。
3. 提示词要适合豆包/即梦/通用图像模型生成角色设定卡。
4. 不要输出格式外说明。
"""


def stream_deepseek_text(messages: list[dict[str, str]], temperature: float, fallback_text: str) -> Iterator[str]:
    api_key = require_ai_key()
    url = f"{AI_API_BASE.rstrip('/')}/chat/completions"
    payload = {
        "model": AI_MODEL,
        "messages": messages,
        "temperature": temperature,
        "stream": True,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        with httpx.Client(timeout=AI_TIMEOUT_SECONDS) as client:
            with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code >= 400:
                    body = response.read()
                    detail = body.decode("utf-8", errors="ignore")[:300] if body else f"HTTP {response.status_code}"
                    raise RuntimeError(detail)
                for line in response.iter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        line = line[6:]
                    if line.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    choices = data.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta") or {}
                    text = delta.get("content") or ""
                    if text:
                        yield f"data: {json.dumps({'text': text}, ensure_ascii=False)}\n\n"
    except Exception as exc:
        if os.getenv("AIMANJU_AI_FALLBACK", "0") == "1":
            for index in range(0, len(fallback_text), 16):
                chunk = fallback_text[index : index + 16]
                yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        else:
            message = f"DeepSeek 调用失败：{str(exc)[:180]}"
            yield f"data: {json.dumps({'text': message}, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


def sse_stream(text: str) -> Iterator[str]:
    for index in range(0, len(text), 16):
        chunk = text[index : index + 16]
        yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


@app.post("/api/ai/manju/stream-one-line-story")
def stream_one_line_story(payload: StoryRequest, user: sqlite3.Row = Depends(get_current_user)):
    require_ai_key()
    return StreamingResponse(
        stream_deepseek_text(
            deepseek_messages(
                "你是短漫剧课程的中文故事策划，只输出可直接使用的内容。",
                story_prompt(payload),
            ),
            temperature=0.95,
            fallback_text=fallback_story_text(payload),
        ),
        media_type="text/event-stream",
        headers={"X-Remaining": "999", "X-Weekly-Limit": "999", "X-Used-This-Week": "0"},
    )


@app.post("/api/ai/manju/stream-synopsis")
def stream_synopsis(payload: SynopsisRequest, user: sqlite3.Row = Depends(get_current_user)):
    require_ai_key()
    return StreamingResponse(
        stream_deepseek_text(
            deepseek_messages(
                "你是 AI 漫剧课程的中文剧情策划，擅长把短故事扩写为结构清晰的漫剧梗概。",
                synopsis_prompt(payload),
            ),
            temperature=0.8,
            fallback_text=fallback_synopsis_text(payload),
        ),
        media_type="text/event-stream",
        headers={"X-Remaining": "999", "X-Weekly-Limit": "999", "X-Used-This-Week": "0"},
    )


@app.post("/api/ai/manju/stream-character-cards")
def stream_character_cards(payload: CharacterCardsRequest, user: sqlite3.Row = Depends(get_current_user)):
    require_ai_key()
    return StreamingResponse(
        stream_deepseek_text(
            deepseek_messages(
                "你是 AI 漫剧角色设定师，必须严格按用户要求的结构输出角色卡。",
                character_cards_prompt(payload),
            ),
            temperature=0.82,
            fallback_text=fallback_character_cards_text(payload),
        ),
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
