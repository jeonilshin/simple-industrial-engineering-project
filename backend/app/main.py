"""FastAPI entry point.

Run locally:  uvicorn app.main:app --reload --port 8000
Run on Render: uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import (
    analytics,
    auth as auth_routes,
    dashboard,
    employees,
    exports,
    predict,
    production,
    schedule,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Workforce Scheduler", version="0.1.0")

_default_origins = "http://localhost:3000"
_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(employees.router)
app.include_router(production.router)
app.include_router(predict.router)
app.include_router(schedule.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(exports.router)


@app.get("/")
def root():
    return {"service": "ai-workforce-scheduler", "status": "ok"}
