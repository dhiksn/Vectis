from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from agent.app.config import settings
from agent.app.models.schemas import LoginRequest, Token, UserInfo
from agent.app.security.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(req: LoginRequest, response: Response):
    # Authenticate admin user
    if req.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not verify_password(req.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": req.username},
        expires_delta=access_token_expires
    )

    # Set secure HTTP-only cookie
    response.set_cookie(
        key="vps_access_token",
        value=token,
        httponly=True,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set True in production with HTTPS
    )

    return Token(access_token=token, token_type="bearer", username=req.username)


@router.get("/me", response_model=UserInfo)
async def me(current_user: UserInfo = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="vps_access_token")
    return {"message": "Successfully logged out"}
