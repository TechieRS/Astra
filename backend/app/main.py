import hashlib
import json
import logging
import secrets
import threading
from collections import defaultdict, deque
from time import monotonic

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from app.core import settings
from app.db import LearningReport, MissionAction, MissionSession, get_db
from app.logging_config import configure_logging
from app.nasa import catalog, nasa_service
from app.schemas import Action, ExplainRequest, SessionCreate, SessionResponse
from app.simulation import (
    BLOCKED,
    EQUIPMENT,
    EXPLANATIONS,
    MISSION,
    SITES,
    RuleError,
    apply_action,
    new_state,
    present,
    report,
)

configure_logging()
app = FastAPI(title="ASTRA Mission API", version="1.0.0", docs_url="/api/docs", redoc_url=None)
limits: dict[str, deque] = defaultdict(deque)
limit_lock = threading.Lock()


@app.middleware("http")
async def boundaries(request: Request, call_next):
    if request.method == "POST":
        size = request.headers.get("content-length", "0")
        if not size.isdigit() or int(size) > 8192:
            return JSONResponse(
                status_code=413, content={"detail": "Please send a smaller request."}
            )
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 8192:
                return JSONResponse(
                    status_code=413, content={"detail": "Please send a smaller request."}
                )
        request._body = bytes(body)
        now = monotonic()
        key = request.client.host if request.client else "local"
        with limit_lock:
            # Bound memory and expire inactive entries, not just the active caller.
            for old_key in list(limits):
                if not limits[old_key] or limits[old_key][-1] <= now - 60:
                    del limits[old_key]
            if key not in limits and len(limits) >= 4096:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Mission control is busy. Please try shortly."},
                    headers={"Retry-After": "60"},
                )
            bucket = limits[key]
            while bucket and bucket[0] <= now - 60:
                bucket.popleft()
            if len(bucket) >= 180:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Take a short break, then try again."},
                    headers={"Retry-After": "60"},
                )
            bucket.append(now)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = (
        "no-store" if "/sessions" in request.url.path else "no-cache"
    )
    return response


# Wrap boundary responses too, so an allowed separate frontend can read 413/429 errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[v.strip() for v in settings().allowed_origins.split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RuleError)
async def rules_handler(_request, exc):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(OperationalError)
async def storage_handler(_request, _exc):
    logging.getLogger("astra").error("Database unavailable; check connection and migrations")
    return JSONResponse(
        status_code=503, content={"detail": "Mission storage is unavailable. Please retry shortly."}
    )


def session_row(db: Session, session_id: str, lock=False):
    if len(session_id) != 43:
        raise HTTPException(404, "Mission session not found.")
    statement = select(MissionSession).where(MissionSession.id == session_id)
    if lock:
        statement = statement.with_for_update()
    row = db.scalar(statement)
    if row is None:
        raise HTTPException(
            404, "Mission session not found on this server. You can start a new mission."
        )
    return row


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(MissionSession.id).limit(1))
    return {"status": "ok", "simulation": "educational-v1"}


@app.get("/api/missions")
def missions():
    return [MISSION]


@app.get("/api/missions/{mission_id}")
def mission(mission_id: str):
    if mission_id != MISSION["id"]:
        raise HTTPException(404, "Mission not found.")
    return {
        **MISSION,
        "equipment": EQUIPMENT,
        "map": {"width": 16, "height": 12, "sites": SITES, "blocked": sorted(BLOCKED)},
    }


@app.post("/api/sessions", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, db: Session = Depends(get_db)):
    state = new_state(secrets.token_urlsafe(32), body.callsign, body.seed)
    db.add(MissionSession(id=state["id"], state=state, version=0))
    db.commit()
    return present(state)


@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
@app.get("/api/sessions/{session_id}/state", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    return present(session_row(db, session_id).state)


@app.post("/api/sessions/{session_id}/actions", response_model=SessionResponse)
def act(session_id: str, body: Action, db: Session = Depends(get_db)):
    row = session_row(db, session_id, lock=True)
    digest = hashlib.sha256(
        json.dumps(body.model_dump(mode="json"), sort_keys=True).encode()
    ).hexdigest()
    previous = db.scalar(
        select(MissionAction).where(
            MissionAction.session_id == session_id, MissionAction.action_id == str(body.action_id)
        )
    )
    if previous:
        if previous.request_hash != digest:
            raise HTTPException(409, "This action ID was already used for another command.")
        return previous.response
    if row.version != body.version:
        raise HTTPException(409, "Your mission changed. Refresh its state and try again.")
    next_state = apply_action(row.state, body)
    response = present(next_state)
    changed = db.execute(
        update(MissionSession)
        .where(MissionSession.id == session_id, MissionSession.version == body.version)
        .values(state=next_state, version=next_state["version"])
    )
    if changed.rowcount != 1:
        db.rollback()
        raise HTTPException(409, "Another action arrived first. Refresh and try again.")
    db.add(
        MissionAction(
            session_id=session_id,
            action_id=str(body.action_id),
            request_hash=digest,
            response=response,
        )
    )
    if next_state["status"] in ("COMPLETED", "FAILED"):
        db.add(LearningReport(session_id=session_id, report=report(next_state)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Concurrent identical retry: return the recorded response, never reapply the engine.
        saved = db.scalar(
            select(MissionAction).where(
                MissionAction.session_id == session_id,
                MissionAction.action_id == str(body.action_id),
            )
        )
        if saved and saved.request_hash == digest:
            return saved.response
        raise HTTPException(409, "Your mission changed. Refresh and try again.") from None
    return response


@app.get("/api/sessions/{session_id}/events")
def events(session_id: str, db: Session = Depends(get_db)):
    return session_row(db, session_id).state["log"]


@app.get("/api/sessions/{session_id}/report")
def learning_report(session_id: str, db: Session = Depends(get_db)):
    row = session_row(db, session_id)
    result = db.get(LearningReport, session_id)
    if result is None:
        return report(row.state)
    return result.report


@app.get("/api/nasa/sources")
@app.get("/api/nasa/datasets")
def nasa_sources():
    return catalog()


@app.get("/api/nasa/images")
def nasa_images():
    return nasa_service.images()


@app.post("/api/education/explain")
def explain(body: ExplainRequest):
    return {
        "guide": "ORBIT",
        "mode": "deterministic",
        "explanation": EXPLANATIONS[body.topic],
        "source": "NASA reference catalog + simplified mission rules",
    }
