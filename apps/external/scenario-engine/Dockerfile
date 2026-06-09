FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn[standard] httpx pydantic
COPY shared/ /app/shared/
COPY scenario-engine/main.py /app/main.py
COPY scenario-engine/static/ /app/static/
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
