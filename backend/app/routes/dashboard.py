from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Employee, Prediction
from ..schemas import DashboardSummary, PredictionRecord

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Employee.id)).scalar() or 0
    available = (
        db.query(func.count(Employee.id)).filter(Employee.available.is_(True)).scalar() or 0
    )
    avg_rate = db.query(func.avg(Employee.hourly_rate)).scalar() or 0.0
    latest = (
        db.query(Prediction)
        .order_by(Prediction.created_at.desc())
        .limit(1)
        .one_or_none()
    )

    return DashboardSummary(
        total_employees=total,
        available_employees=available,
        latest_prediction=PredictionRecord.model_validate(latest) if latest else None,
        avg_hourly_rate=round(float(avg_rate), 2),
    )
