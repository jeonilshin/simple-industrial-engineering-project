from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..ml.predictor import predict_workers
from ..models import Prediction
from ..schemas import PredictRequest, PredictResponse

router = APIRouter(
    prefix="/predict",
    tags=["predict"],
    dependencies=[Depends(get_current_user)],
)

AVG_HOURLY_RATE = 80.0
HOURS_PER_DAY = 8


@router.post("", response_model=PredictResponse)
def predict(payload: PredictRequest, db: Session = Depends(get_db)):
    try:
        result = predict_workers(
            production_target=payload.production_target,
            orders=payload.orders,
            machines=payload.machines,
            available_workers=payload.available_workers,
            average_skill=payload.average_skill,
            overtime=payload.overtime,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    cost = result["predicted_workers"] * AVG_HOURLY_RATE * HOURS_PER_DAY

    db.add(
        Prediction(
            predicted_workers=result["predicted_workers"],
            predicted_cost=cost,
            confidence=result["confidence"],
            production_target=payload.production_target,
        )
    )
    db.commit()

    return PredictResponse(**result, estimated_cost=round(cost, 2))
