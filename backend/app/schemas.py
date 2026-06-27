"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Shift = Literal["morning", "afternoon", "night"]


class EmployeeIn(BaseModel):
    name: str
    skill_level: int = Field(ge=1, le=5, default=3)
    hourly_rate: float = 80.0
    available: bool = True
    preferred_shift: Shift = "morning"
    max_hours: int = 8


class EmployeeOut(EmployeeIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PredictRequest(BaseModel):
    production_target: int = Field(gt=0)
    orders: int = Field(ge=0)
    machines: int = Field(ge=1)
    available_workers: int = Field(ge=1)
    average_skill: float = Field(ge=1.0, le=5.0, default=3.5)
    overtime: int = Field(ge=0, default=0)


class PredictResponse(BaseModel):
    predicted_workers: int
    raw_prediction: float
    confidence: float
    std: float
    estimated_cost: float


class ScheduleRequest(BaseModel):
    workers_needed: int = Field(gt=0)
    hours_per_shift: int = 8


class ScheduleResponse(BaseModel):
    shifts: dict[str, list[EmployeeOut]]
    assigned: int
    shortfall: int
    estimated_labor_cost: float
    hours_per_shift: int


class PredictionRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    predicted_workers: int
    predicted_cost: float
    confidence: float
    production_target: int


class DashboardSummary(BaseModel):
    total_employees: int
    available_employees: int
    latest_prediction: PredictionRecord | None
    avg_hourly_rate: float


class ProductionPlanIn(BaseModel):
    plan_date: date
    production_target: int = Field(gt=0)
    expected_orders: int = Field(ge=0)
    machines_running: int = Field(ge=1)
    average_skill: float = Field(ge=1.0, le=5.0, default=3.5)
    overtime: int = Field(ge=0, default=0)


class ProductionPlanOut(ProductionPlanIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ScheduleRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    employee_name: str
    schedule_date: date
    shift: str
    hours: int


class AnalyticsResponse(BaseModel):
    trend: list[dict]  # [{date, predicted_workers, predicted_cost}]
    total_predicted_cost: float
    avg_confidence: float
    overtime_total: int
    productivity: float  # units per worker, latest
    idle_workers: int
    workers_by_skill: list[dict]  # [{skill_level, count}]
