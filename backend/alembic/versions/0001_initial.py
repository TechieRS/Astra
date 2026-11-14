"""Anonymous mission sessions, immutable action history, and learning reports."""

import sqlalchemy as sa

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mission_sessions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("state", sa.JSON, nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "mission_actions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "session_id", sa.String(64), sa.ForeignKey("mission_sessions.id"), nullable=False
        ),
        sa.Column("action_id", sa.String(36), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column("response", sa.JSON, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("session_id", "action_id"),
    )
    op.create_index("ix_mission_actions_session_id", "mission_actions", ["session_id"])
    op.create_table(
        "learning_reports",
        sa.Column(
            "session_id", sa.String(64), sa.ForeignKey("mission_sessions.id"), primary_key=True
        ),
        sa.Column("report", sa.JSON, nullable=False),
    )


def downgrade():
    op.drop_table("learning_reports")
    op.drop_index("ix_mission_actions_session_id", "mission_actions")
    op.drop_table("mission_actions")
    op.drop_table("mission_sessions")
