import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="aimanju-wall-feedback-"))
os.environ["AIMANJU_DATA_DIR"] = str(TEST_DATA_DIR)
os.environ["AIMANJU_DB_PATH"] = str(TEST_DATA_DIR / "aimanju.db")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main  # noqa: E402


class WallFeedbackTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_DATA_DIR, ignore_errors=True)

    def setUp(self):
        with main.db_conn() as conn:
            for table in ["wall_works", "tokens", "users"]:
                conn.execute(f"DELETE FROM {table}")
            columns = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
            if "role" not in columns:
                conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'")
        self.client = TestClient(main.app)

    def register(self, name: str, student_id: str) -> str:
        response = self.client.post(
            "/api/auth/register",
            json={
                "name": name,
                "email": f"{student_id}@example.com",
                "student_id": student_id,
                "class_name": "24级市场营销01班",
                "password": "test-pass-123",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["access_token"]

    def promote_to_teacher(self, student_id: str):
        with main.db_conn() as conn:
            conn.execute("UPDATE users SET role = 'teacher' WHERE student_id = ?", (student_id,))

    @staticmethod
    def auth(token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def create_work(self, token: str) -> int:
        response = self.client.post(
            "/api/manju/wall-works",
            data={"title": "QA AI漫剧", "video_url": "https://www.bilibili.com/video/BV1xx411c7mD"},
            headers=self.auth(token),
        )
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["id"]

    def gallery_work(self, token: str, work_id: int) -> dict:
        response = self.client.get("/api/manju/gallery", headers=self.auth(token))
        self.assertEqual(response.status_code, 200, response.text)
        return next(item for item in response.json() if item["id"] == work_id)

    def test_student_and_teacher_likes_are_separate(self):
        author_token = self.register("作者", "author-1")
        student_token = self.register("同学", "student-1")
        teacher_token = self.register("老师", "teacher-1")
        self.promote_to_teacher("teacher-1")
        work_id = self.create_work(author_token)

        self.assertEqual(self.client.get("/api/auth/me", headers=self.auth(teacher_token)).json()["role"], "teacher")
        self.assertEqual(self.client.put(f"/api/manju/wall-works/{work_id}/like", headers=self.auth(student_token)).status_code, 200)
        self.assertEqual(self.client.put(f"/api/manju/wall-works/{work_id}/like", headers=self.auth(teacher_token)).status_code, 200)

        work = self.gallery_work(teacher_token, work_id)
        self.assertEqual(work["student_like_count"], 1)
        self.assertEqual(work["teacher_like_count"], 1)
        self.assertTrue(work["liked_by_me"])

        self.assertEqual(self.client.delete(f"/api/manju/wall-works/{work_id}/like", headers=self.auth(student_token)).status_code, 200)
        self.assertEqual(self.gallery_work(teacher_token, work_id)["student_like_count"], 0)

    def test_only_teacher_can_write_and_manage_feedback(self):
        author_token = self.register("作者", "author-2")
        student_token = self.register("同学", "student-2")
        teacher_token = self.register("老师", "teacher-2")
        self.promote_to_teacher("teacher-2")
        work_id = self.create_work(author_token)

        self.assertEqual(
            self.client.post(
                f"/api/manju/wall-works/{work_id}/comments",
                json={"content": "请说明创作过程。"},
                headers=self.auth(student_token),
            ).status_code,
            403,
        )
        comment_response = self.client.post(
            f"/api/manju/wall-works/{work_id}/comments",
            json={"content": "请说明创作过程。"},
            headers=self.auth(teacher_token),
        )
        self.assertEqual(comment_response.status_code, 200, comment_response.text)
        comment_id = comment_response.json()["id"]
        self.assertEqual(
            self.client.put(
                f"/api/manju/wall-comments/{comment_id}",
                json={"content": "请补充创作过程和素材来源。"},
                headers=self.auth(teacher_token),
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.put(
                f"/api/manju/wall-works/{work_id}/link-status",
                json={"expired": True},
                headers=self.auth(student_token),
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.put(
                f"/api/manju/wall-works/{work_id}/link-status",
                json={"expired": True},
                headers=self.auth(teacher_token),
            ).status_code,
            200,
        )

        work = self.gallery_work(student_token, work_id)
        self.assertEqual(work["teacher_link_status"], "expired")
        self.assertEqual(work["comments"][0]["content"], "请补充创作过程和素材来源。")
        self.assertFalse(work["comments"][0]["can_manage"])
        self.assertTrue(self.gallery_work(teacher_token, work_id)["comments"][0]["can_manage"])

        self.assertEqual(
            self.client.delete(f"/api/manju/wall-comments/{comment_id}", headers=self.auth(teacher_token)).status_code,
            200,
        )
        self.assertEqual(
            self.client.put(
                f"/api/manju/wall-works/{work_id}/link-status",
                json={"expired": False},
                headers=self.auth(teacher_token),
            ).status_code,
            200,
        )
        final_work = self.gallery_work(student_token, work_id)
        self.assertEqual(final_work["teacher_link_status"], "unknown")
        self.assertEqual(final_work["comments"], [])


if __name__ == "__main__":
    unittest.main()
