from pydantic import BaseModel


class DeviceInfo(BaseModel):
    name: str
    type: str
    ip: str
    mac: str


class PingResult(BaseModel):
    status: str
    success: bool


class CodeBase(BaseModel):
    CodeType: str
    CodeName: str
    Code: str


class CodeRecord(CodeBase):
    CodeId: int


class OperationResult(BaseModel):
    success: int
    message: str


class VersionInfo(BaseModel):
    version: str
