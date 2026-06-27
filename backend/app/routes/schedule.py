from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..ml.optimizer import assign_shifts
from ..models import Employee, Schedule
from ..schemas import EmployeeOut, ScheduleRequest, ScheduleResponse, ScheduleRow

router = APIRouter(
    prefix="/schedule",
    tags=["schedule"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ScheduleResponse)
def schedule(payload: ScheduleRequest, db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.available.is_(True)).all()
    emp_dicts = [EmployeeOut.model_validate(e).model_dump() for e in employees]

    result = assign_shifts(
        employees=emp_dicts,
        workers_needed=payload.workers_needed,
        hours_per_shift=payload.hours_per_shift,
    )

    today = date.today()
    # Replace today's rows so re-running on the same day is idempotent.
    db.query(Schedule).filter(Schedule.schedule_date == today).delete()
    for shift_name, emps in result["shifts"].items():
        for emp in emps:
            db.add(
                Schedule(
                    employee_id=emp["id"],
                    schedule_date=today,
                    shift=shift_name,
                    hours=payload.hours_per_shift,
                )
            )
    db.commit()

    return result


@router.get("/history", response_model=list[ScheduleRow])
def history(
    db: Session = Depends(get_db),
    on_date: date | None = Query(default=None),
    limit: int = 200,
):
    q = (
        db.query(Schedule, Employee)
        .join(Employee, Employee.id == Schedule.employee_id)
        .order_by(Schedule.schedule_date.desc(), Schedule.shift)
    )
    if on_date:
        q = q.filter(Schedule.schedule_date == on_date)
    rows = q.limit(limit).all()
    return [
        ScheduleRow(
            id=s.id,
            employee_id=s.employee_id,
            employee_name=e.name,
            schedule_date=s.schedule_date,
            shift=s.shift,
            hours=s.hours,
        )
        for s, e in rows
    ]
