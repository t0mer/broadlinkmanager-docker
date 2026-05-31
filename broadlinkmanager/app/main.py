import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette_exporter import PrometheusMiddleware, handle_metrics

from app import db
from app.config import get_version, init_config
from app.routers import codes, commands, devices

DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")


def create_app() -> FastAPI:
    init_config()
    db.create_tables()

    app = FastAPI(
        title="Broadlink Manager",
        description="Manage Broadlink IR/RF devices",
        version=get_version(),
        contact={
            "name": "Tomer Klein",
            "email": "tomer.klein@gmail.com",
            "url": "https://github.com/t0mer/broadlinkmanager-docker",
        },
    )

    app.add_middleware(PrometheusMiddleware)
    app.add_route("/metrics", handle_metrics)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(devices.router)
    app.include_router(commands.router)
    app.include_router(codes.router)

    @app.get("/api/version")
    def version():
        return JSONResponse({"version": get_version()})

    # Serve React SPA static files if dist/ exists
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        index = os.path.join(DIST_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)
        return JSONResponse({"detail": "Frontend not built yet"}, status_code=404)

    return app


app = create_app()
