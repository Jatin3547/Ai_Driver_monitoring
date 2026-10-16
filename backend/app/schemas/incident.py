from pydantic import BaseModel


class IncidentOut(BaseModel):
    id: str
    driverId: str
    vehicleId: str | None = None
    type: str
    severity: str
    status: str
    timestamp: str
    location: str
    description: str


class IncidentCreate(BaseModel):
    driverId: str
    vehicleId: str | None = None
    type: str
    severity: str
    location: str = ""
    description: str = ""


class IncidentUpdate(BaseModel):
    status: str | None = None
    acknowledgedBy: str | None = None
