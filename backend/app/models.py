"""ORM tables: Employees, ProductionPlans, Schedules, Predictions."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    skill_level: Mapped[int] = mapped_column(Integer, default=3)
    hourly_rate: Mapped[float] = mapped_column(Float, default=80.0)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    preferred_shift: Mapped[str] = mapped_column(String(20), default="morning")
    max_hours: Mapped[int] = mapped_column(Integer, default=8)

    schedules: Mapped[list["Schedule"]] = relationship(back_populates="employee")


class ProductionPlan(Base):
    __tablename__ = "production_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    plan_date: Mapped[date] = mapped_column(Date)
    production_target: Mapped[int] = mapped_column(Integer)
    expected_orders: Mapped[int] = mapped_column(Integer)
    machines_running: Mapped[int] = mapped_column(Integer)
    average_skill: Mapped[float] = mapped_column(Float, default=3.5)
    overtime: Mapped[int] = mapped_column(Integer, default=0)


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    schedule_date: Mapped[date] = mapped_column(Date)
    shift: Mapped[str] = mapped_column(String(20))
    hours: Mapped[int] = mapped_column(Integer, default=8)

    employee: Mapped[Employee] = relationship(back_populates="schedules")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    predicted_workers: Mapped[int] = mapped_column(Integer)
    predicted_cost: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    production_target: Mapped[int] = mapped_column(Integer)
