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
	cd web && pnpm dev --host

build:
	cd web && pnpm build

# ── Run locally ───────────────────────────────────────────────────────────────

.PHONY: run

run:
	uv run python server.py

# ── Screenshots ──────────────────────────────────────────────────────────────

.PHONY: screenshots

screenshots:
	@echo "📸 Capturing screenshots of all pages..."
	@echo "   Make sure dev server is running: make dev"
	pnpm add -D playwright
	node scripts/screenshots.mjs

# ── Docker ────────────────────────────────────────────────────────────────────

.PHONY: docker-build docker-build-nocache logs

docker-build:
	docker build --file Dockerfile -t $(DOCKER_IMAGE) .

docker-build-nocache:
	docker build --progress=plain --no-cache --file Dockerfile -t $(DOCKER_IMAGE) .

logs:
	docker logs -f broadlinkmanager
