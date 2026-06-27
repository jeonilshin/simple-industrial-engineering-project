from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Employee, Prediction, ProductionPlan, Schedule
from ..schemas import AnalyticsResponse

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db), window: int = 14):
    preds = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(window)
        .all()
    )
    preds = list(reversed(preds))  # chronological for chart

    trend = [
        {
            "date": p.created_at.strftime("%Y-%m-%d %H:%M"),
            "predicted_workers": p.predicted_workers,
            "predicted_cost": round(p.predicted_cost, 2),
            "confidence": p.confidence,
            "production_target": p.production_target,
        }
        for p in preds
    ]
    total_cost = sum(p.predicted_cost for p in preds)
    avg_conf = sum(p.confidence for p in preds) / len(preds) if preds else 0.0

    overtime_total = (
        db.query(func.coalesce(func.sum(ProductionPlan.overtime), 0)).scalar() or 0
    )

    latest_plan = (
        db.query(ProductionPlan)
        .order_by(ProductionPlan.plan_date.desc(), ProductionPlan.id.desc())
        .first()
    )
    latest_pred = preds[-1] if preds else None
    productivity = 0.0
    if latest_plan and latest_pred and latest_pred.predicted_workers:
        productivity = round(
            latest_plan.production_target / latest_pred.predicted_workers, 2
        )

    today = date.today()
    scheduled_today = (
        db.query(func.count(Schedule.id))
        .filter(Schedule.schedule_date == today)
        .scalar()
        or 0
    )
    available = (
        db.query(func.count(Employee.id))
        .filter(Employee.available.is_(True))
        .scalar()
        or 0
    )
    idle_workers = max(0, available - scheduled_today)

    by_skill_rows = (
        db.query(Employee.skill_level, func.count(Employee.id))
        .group_by(Employee.skill_level)
        .order_by(Employee.skill_level)
        .all()
    )
    workers_by_skill = [{"skill_level": s, "count": c} for s, c in by_skill_rows]

    return AnalyticsResponse(
        trend=trend,
        total_predicted_cost=round(total_cost, 2),
        avg_confidence=round(avg_conf, 3),
        overtime_total=int(overtime_total),
        productivity=productivity,
        idle_workers=idle_workers,
        workers_by_skill=workers_by_skill,
    )
