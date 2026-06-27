from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from ..auth import (
    Role,
    TokenData,
    authenticate,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    username: str


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Wrong username or password")
    return Token(
        access_token=create_access_token(user),
        role=user.role,
        username=user.username,
    )


@router.get("/me", response_model=TokenData)
def me(user: TokenData = Depends(get_current_user)):
    return user
