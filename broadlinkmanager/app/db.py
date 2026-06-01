import os
import sqlite3
from contextlib import contextmanager
from loguru import logger

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "codes.db"))


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def create_tables() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS Codes (
                CodeId   INTEGER PRIMARY KEY AUTOINCREMENT,
                CodeType TEXT NOT NULL,
                CodeName TEXT NOT NULL,
                Code     TEXT NOT NULL
            )
        """)
    logger.info("Database tables ready")


def insert_code(code_type: str, code_name: str, code: str) -> dict:
    try:
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO Codes (CodeType, CodeName, Code) VALUES (?, ?, ?)",
                (code_type, code_name, code),
            )
        return {"message": "Code inserted successfully.", "success": 1}
    except Exception as e:
        logger.error(f"insert_code failed: {e}")
        return {"message": str(e), "success": 0}


def update_code(code_id: int, code_type: str = None, code_name: str = None, code: str = None) -> dict:
    try:
        parts, params = [], []
        if code_type:
            parts.append("CodeType=?"); params.append(code_type)
        if code_name:
            parts.append("CodeName=?"); params.append(code_name)
        if code:
            parts.append("Code=?"); params.append(code)
        if not parts:
            return {"message": "Nothing to update.", "success": 0}
        params.append(code_id)
        with get_connection() as conn:
            conn.execute(f"UPDATE Codes SET {', '.join(parts)} WHERE CodeId=?", params)
        return {"message": "Code updated successfully.", "success": 1}
    except Exception as e:
        logger.error(f"update_code failed: {e}")
        return {"message": str(e), "success": 0}


def delete_code(code_id: int) -> dict:
    try:
        with get_connection() as conn:
            conn.execute("DELETE FROM Codes WHERE CodeId=?", (code_id,))
        return {"message": "Code deleted successfully.", "success": 1}
    except Exception as e:
        logger.error(f"delete_code failed: {e}")
        return {"message": str(e), "success": 0}


def select_code(code_id: int) -> list[dict]:
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT CodeId, CodeType, CodeName, Code FROM Codes WHERE CodeId=?", (code_id,)
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"select_code failed: {e}")
        return []


def select_all_codes() -> list[dict]:
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT CodeId, CodeType, CodeName, Code FROM Codes"
            ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"select_all_codes failed: {e}")
        return []
