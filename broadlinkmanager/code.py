from pydantic import BaseModel

class Code(BaseModel):
    CodeId: int = None
    CodeType: str
    CodeName: str
    Code: str