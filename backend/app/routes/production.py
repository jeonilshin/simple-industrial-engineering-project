from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ProductionPlan
from ..schemas import ProductionPlanIn, ProductionPlanOut

router = APIRouter(
    prefix="/production",
    tags=["production"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[ProductionPlanOut])
def list_plans(db: Session = Depends(get_db), limit: int = 50):
    return (
        db.query(ProductionPlan)
        .order_by(ProductionPlan.plan_date.desc(), ProductionPlan.id.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=ProductionPlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: ProductionPlanIn, db: Session = Depends(get_db)):
    plan = ProductionPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(ProductionPlan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
