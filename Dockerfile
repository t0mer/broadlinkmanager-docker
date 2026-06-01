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
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      iputils-ping \
    && rm -rf /var/lib/apt/lists/*

COPY broadlinkmanager/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY broadlinkmanager/ /app/

