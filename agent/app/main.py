import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from agent.app.config import settings
from agent.app.database.db import init_db
from agent.app.websocket.manager import manager
from agent.app.security.auth import authenticate_websocket
from agent.app.api.auth import router as auth_router
from agent.app.api.metrics import router as metrics_router
from agent.app.api.services import router as services_router
from agent.app.api.processes import router as processes_router
from agent.app.api.system import router as system_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vps-control-agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    logger.info("Starting background metrics broadcaster...")
    manager.start_broadcasting()
    yield
    logger.info("Shutting down background tasks...")
    await manager.stop_broadcasting()
    logger.info("Agent stopped.")


app = FastAPI(
    title="Vectis VPS Agent",
    description="High-performance, secure Linux VPS telemetry and service management agent",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.allowed_origins_list
if "*" in origins:
    allow_origins = ["*"]
else:
    allow_origins = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router)
app.include_router(metrics_router)
app.include_router(services_router)
app.include_router(processes_router)
app.include_router(system_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "vps-control-center-agent",
        "version": "1.0.0"
    }


@app.websocket("/ws/metrics")
async def websocket_metrics(
    websocket: WebSocket,
    token: str = Query(default=None),
    api_key: str = Query(default=None)
):
    # Verify authentication
    auth_user = await authenticate_websocket(websocket)
    if not auth_user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
        return

    await manager.connect(websocket)
    try:
        # Keep connection open and listen for optional ping/pong or client messages
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)
