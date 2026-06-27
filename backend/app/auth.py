"""Lightweight JWT auth with two env-driven users (admin + manager).

We deliberately avoid a users table for this MVP: credentials live in env vars,
which keeps the deploy simple and means no migration story for auth.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Literal

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

Role = Literal["admin", "manager"]

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-not-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "720"))  # 12h

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _hash(password: str) -> bytes:
    # bcrypt's 72-byte cap is well above any realistic password.
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt())


def _verify(password: str, hashed: bytes) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed)
    except ValueError:
        return False


# Username → (hashed password, role). Computed once at import.
_USERS: dict[str, tuple[bytes, Role]] = {
    "admin": (_hash(os.getenv("ADMIN_PASSWORD", "admin123")), "admin"),
    "manager": (_hash(os.getenv("MANAGER_PASSWORD", "manager123")), "manager"),
}


class TokenData(BaseModel):
    username: str
    role: Role


def authenticate(username: str, password: str) -> TokenData | None:
    record = _USERS.get(username)
    if not record:
        return None
    hashed, role = record
    if not _verify(password, hashed):
        return None
    return TokenData(username=username, role=role)


def create_access_token(data: TokenData) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": data.username, "role": data.role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if not username or role not in ("admin", "manager"):
            raise credentials_exception
        return TokenData(username=username, role=role)
    except JWTError as exc:
        raise credentials_exception from exc
