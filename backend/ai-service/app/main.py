from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.core.config import settings
from app.api.v1 import chat, analysis, embeddings, citations

# Configure logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    "logs/ai_service.log",
    rotation="100 MB",
    retention="10 days",
    level="INFO"
)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    logger.info("🚀 AI Service starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"OpenAI API configured: {bool(settings.OPENAI_API_KEY)}")
    logger.info(f"Anthropic API configured: {bool(settings.ANTHROPIC_API_KEY)}")
    
    # Download spaCy model if needed
    # In the lifespan function, replace the spaCy section with:

    # Download spaCy model if needed
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
            logger.info("✅ spaCy model loaded")
        except OSError:
            logger.warning("⚠️ spaCy model not found. NLP features will be limited.")
            logger.warning("To enable: pip install spacy && python -m spacy download en_core_web_sm")
    except ImportError:
        logger.warning("⚠️ spaCy not installed. NLP features will be limited.")
        logger.info("To install: pip install spacy")
    
    # Shutdown
    yield
    logger.info("🛑 AI Service shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Synthia AI Service",
    description="AI-powered research assistant backend service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "Synthia AI Service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "service": "Synthia AI Service",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(embeddings.router, prefix="/api/v1/embeddings", tags=["Embeddings"])
app.include_router(citations.router, prefix="/api/v1/citations", tags=["Citations"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )

# Custom 404 handler
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """
    404 handler
    """
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "Endpoint not found",
            "path": str(request.url)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower()
    )