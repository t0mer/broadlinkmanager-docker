DOCKER_IMAGE = clabnet/broadlinkmanager
VERSION = $(shell cat VERSION)
PORT    = 7020

# ── Python / deps ────────────────────────────────────────────────────────────

.PHONY: venv install

venv:
	uv venv

install:
	uv pip install .
	cd web && pnpm install


# ── Frontend ──────────────────────────────────────────────────────────────────

.PHONY: dev build

dev:
	cd web && pnpm dev

build:
	cd web && pnpm build

# ── Run locally ───────────────────────────────────────────────────────────────

.PHONY: run

run:
	uv run python server.py

# ── Docker ────────────────────────────────────────────────────────────────────

.PHONY: docker-build docker-build-nocache logs

docker-build:
	docker build --file Dockerfile -t $(DOCKER_IMAGE) .

docker-build-nocache:
	docker build --progress=plain --no-cache --file Dockerfile -t $(DOCKER_IMAGE) .

logs:
	docker logs -f broadlinkmanager
