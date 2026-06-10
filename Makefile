DOCKER_IMAGE = clabnet/broadlinkmanager
VERSION = $(shell cat VERSION)
PORT    = 7020

# ── Python / deps ────────────────────────────────────────────────────────────

.PHONY: venv install

venv:
	uv venv

install:
	uv pip install .


# ── Frontend ──────────────────────────────────────────────────────────────────

.PHONY: web-install web-dev web-build

web-install:
	cd web && pnpm install

web-dev:
	cd web && pnpm dev

web-build:
	cd web && pnpm build

# ── Run locally ───────────────────────────────────────────────────────────────

.PHONY: run

run:
	uv run python server.py

# ── Docker ────────────────────────────────────────────────────────────────────

.PHONY: build up down logs

docker-build:
	docker build --file Dockerfile -t $(DOCKER_IMAGE) .

docker-build-nocache:
	docker build --progress=plain --no-cache --file Dockerfile -t $(DOCKER_IMAGE) .

up:
	docker run -d --name broadlinkmanager --network host \
	  -e DISCOVERY_IP_LIST="" \
	  -v $(PWD)/data:/app/data \
	  $(IMAGE):latest

down:
	docker stop broadlinkmanager && docker rm broadlinkmanager

logs:
	docker logs -f broadlinkmanager