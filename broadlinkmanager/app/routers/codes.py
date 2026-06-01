from fastapi import APIRouter
from app.models import CodeBase
from app import db

router = APIRouter(prefix="/api", tags=["Codes"])


@router.get("/codes", response_model=list[dict])
def list_codes():
    return db.select_all_codes()


@router.get("/code/{code_id}", response_model=list[dict])
def get_code(code_id: int):
    return db.select_code(code_id)


@router.post("/code")
def create_code(code: CodeBase):
    return db.insert_code(code.CodeType, code.CodeName, code.Code)


@router.put("/code/{code_id}")
def update_code(code_id: int, code: CodeBase):
    return db.update_code(code_id, code.CodeType, code.CodeName, code.Code)


@router.delete("/code/{code_id}")
def delete_code(code_id: int):
    return db.delete_code(code_id)
