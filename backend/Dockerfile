FROM python:3.12-slim
WORKDIR /app/backend
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY backend/pyproject.toml backend/requirements.lock.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.lock.txt
COPY backend/ ./
COPY data/ /app/data/
RUN useradd --create-home --uid 10001 astra && chown -R astra:astra /app
USER astra
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log"]
