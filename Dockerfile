# Stage 1 — Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /app/web
COPY broadlinkmanager/web/package*.json ./
# npm ci is not usable here: the committed package-lock.json is out of sync with
# package.json, and the add-on targets four architectures with different optional
# native deps. No --silent, so build failures stay diagnosable.
RUN npm install --no-audit --no-fund
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

# Upstream never copied the built frontend out of the build stage, so the image
# shipped an empty dist/ and every page returned "Frontend not built yet".
COPY --from=frontend /app/dist /app/dist

# Modified from upstream t0mer/broadlinkmanager-docker: the modern-ui rewrite
# dropped the start command, so the container built but exited immediately.
# /data is the Home Assistant add-on persistent volume; the upstream default of
# /app/data does not exist in the image.
ENV DB_PATH=/data/codes.db \
    DEVICES_PATH=/data/devices.json
EXPOSE 7020
CMD ["python", "broadlinkmanager.py"]

