from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.upload import router as upload_router
from routes.extract import router as extract_router
from routes.generate import router as generate_router
from routes.video import router as video_router
from routes.logo import router as logo_router
from config import settings, logger

app = FastAPI(title="PowerPoint to Video API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload_router)
app.include_router(extract_router)
app.include_router(generate_router)
app.include_router(video_router)
app.include_router(logo_router)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "PowerPoint to Video Backend is running!"}
