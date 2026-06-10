# Stage 1 — Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /app/web
COPY broadlinkmanager/web/package*.json ./
RUN npm ci --silent
COPY broadlinkmanager/web/ ./
RUN npm run build
# Vite outDir is '../dist' so output lands at /app/dist

# Stage 2 — Python runtime
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
RUN uv pip install .

# Copy application source
COPY broadlinkmanager/ /app/

