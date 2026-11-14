from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from fastapi import Depends, HTTPException, status, Header, Request, WebSocket
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from agent.app.config import settings
from agent.app.models.schemas import UserInfo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> UserInfo:
    # 1. Check API Key
    if x_api_key and x_api_key == settings.AGENT_API_KEY:
        return UserInfo(username="api-agent", is_admin=True)

    # 2. Check Authorization Bearer
    token = bearer_token

    # 3. Check Cookie fallback
    if not token:
        cookie_token = request.cookies.get("vps_access_token")
        if cookie_token:
            token = cookie_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return UserInfo(username=username, is_admin=True)


async def authenticate_websocket(websocket: WebSocket) -> Optional[str]:
    token = websocket.query_params.get("token")
    api_key = websocket.query_params.get("api_key")
    cookie_token = websocket.cookies.get("vps_access_token")

    if api_key and api_key == settings.AGENT_API_KEY:
        return "api-agent"

    active_token = token or cookie_token
    if active_token:
        payload = decode_token(active_token)
        if payload and "sub" in payload:
            return payload["sub"]

    return None
