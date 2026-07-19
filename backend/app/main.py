from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as api_v1_router
from app.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    runtime_settings = settings if settings is not None else get_settings()

    application = FastAPI(title="Learnly API", version="0.1.0")

    application.add_middleware(
        CORSMiddleware,
        allow_origins=runtime_settings.cors_origins,
        allow_credentials=True,
        allow_headers=["*"],
        allow_methods=["*"],
    )

    application.include_router(api_v1_router, prefix=runtime_settings.api_v1_prefix)

    return application


app = create_app()
