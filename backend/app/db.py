from datetime import UTC, datetime
from functools import lru_cache

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.core import settings


class Base(DeclarativeBase):
    pass


class MissionSession(Base):
    __tablename__ = "mission_sessions"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state: Mapped[dict] = mapped_column(JSON)
    version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class MissionAction(Base):
    __tablename__ = "mission_actions"
    __table_args__ = (UniqueConstraint("session_id", "action_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("mission_sessions.id"), index=True)
    action_id: Mapped[str] = mapped_column(String(36))
    request_hash: Mapped[str] = mapped_column(String(64))
    response: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class LearningReport(Base):
    __tablename__ = "learning_reports"
    session_id: Mapped[str] = mapped_column(ForeignKey("mission_sessions.id"), primary_key=True)
    report: Mapped[dict] = mapped_column(JSON)


@lru_cache
def engine():
    url = settings().database_url
    return create_engine(
        url,
        connect_args={"check_same_thread": False} if url.startswith("sqlite") else {},
        pool_pre_ping=True,
    )


def get_db():
    with sessionmaker(bind=engine(), expire_on_commit=False)() as db:
        yield db
