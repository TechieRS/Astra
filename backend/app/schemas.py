from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ActionKind = Literal[
    "prepare",
    "launch",
    "move",
    "travel",
    "inspect",
    "repair",
    "bypass",
    "sample",
    "shelter",
    "wait",
    "return",
    "abort",
    "pause",
    "resume",
]
Equipment = Literal["oxygen_tank", "solar_tools", "rover_battery", "radiation_shield"]


class SessionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mission_id: Literal["lunar-outpost"] = "lunar-outpost"
    callsign: Literal["Pathfinder", "Explorer", "Voyager"] = "Pathfinder"
    seed: int = Field(default=42, ge=0, le=1_000_000)


class Action(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action_id: UUID
    version: int = Field(ge=0)
    kind: ActionKind
    target: Literal["habitat", "solar", "ridge", "crater", "shelter"] | None = None
    x: int | None = Field(default=None, ge=0, le=15)
    y: int | None = Field(default=None, ge=0, le=11)
    equipment: list[Equipment] = Field(default_factory=list, max_length=2)


class ExplainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    topic: Literal["oxygen", "power", "radiation", "samples", "strategy"]


class SessionResponse(BaseModel):
    id: str
    version: int
    mission_id: str
    callsign: str
    seed: int
    status: Literal["BRIEFING", "PREPARATION", "ACTIVE", "PAUSED", "COMPLETED", "FAILED"]
    equipment: list[str]
    oxygen: float
    oxygen_capacity: float
    power: float
    power_capacity: float
    risk: float
    elapsed: int
    position: dict[str, int]
    inspected: bool
    array_status: Literal["unknown", "broken", "repaired", "bypassed"]
    samples: list[str]
    storm_at: int
    storm: bool
    sheltered: bool
    outcome: str | None
    log: list[dict]
    objectives: list[dict]
    available_actions: list[dict]
    last_path: list[list[int]]
