PYTHON = .venv/Scripts/python.exe

venv:
	uv venv

install:
	uv sync --all-extras

# Main pipeline orchestrator: run all pipeline steps

runall:
	$(PYTHON) -m gemini_pipeline.main

format:
	uvx ruff check --select I,F401,E402,F541 --fix .
	uvx ruff format .

clean:
	rimraf "**/__pycache__" .pytest_cache "**/.ipynb_checkpoints" "**/tmp" htmlcov pysse.egg-info .ruff_cache --glob

db-clean:
	@echo "Starting database cleanup..."
	$(PYTHON) src/gemini_pipeline/utils/db_clean.py