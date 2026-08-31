# Stage 1 — Build React frontend
FROM node:24-alpine AS frontend
WORKDIR /app/web
RUN corepack enable pnpm
COPY web/package.json web/pnpm-lock.yaml ./
RUN mkdir -p ~/.pnpm-store && \
    echo 'strict-peer-dependencies=false' > /root/.pnpmrc && \
    pnpm install --frozen-lockfile --force-integrity-check=false 2>&1 || pnpm install --no-lockfile
COPY web/ ./
RUN pnpm run build && rm -rf node_modules ~/.pnpm-store
# Vite outDir is '../dist' so output lands at /app/dist

# Stage 2 — Runtime
FROM python:3.12-slim
LABEL maintainer="tomer.klein@gmail.com"
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_NO_CACHE=1 \
    UV_SYSTEM_PYTHON=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      iputils-ping \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml .
RUN uv pip install . && rm -rf /root/.cache
COPY server.py VERSION ./
COPY app/ ./app/
COPY broadlink/ ./broadlink/
COPY --from=frontend /app/dist ./dist/
EXPOSE 7020
CMD ["python", "server.py"]
