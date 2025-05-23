import os
from dotenv import load_dotenv
import logging
from logging.handlers import TimedRotatingFileHandler

load_dotenv()

class Settings:
    GOOGLE_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")
    HEYGEN_API_KEY = os.getenv('HEYGEN_API_KEY')
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
    TEMP_UPLOAD_DIR = "temp_uploads"
    EXTRACTED_CONTENT_DIR = os.path.join(TEMP_UPLOAD_DIR, "extracted")
    LOGO_DIR = os.path.join(TEMP_UPLOAD_DIR, "logos")
    GENERATED_IMAGES_DIR = os.path.join(TEMP_UPLOAD_DIR, "generated_step4")
    GENERATED_IMAGE_BASE_URL = "/api/generated_images"
    MAX_SLIDES = 5
    ALLOWED_EXTENSIONS = {".pptx", ".ppt"}
    LOG_DIR = "logs"
    origins = ["*"]

# Ensure the log directory exists
os.makedirs(Settings.LOG_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a file handler for logging
file_handler = TimedRotatingFileHandler(
    os.path.join(Settings.LOG_DIR, 'app.log'),
    when='midnight',
    interval=1,
    backupCount=7
)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

# Add the file handler to the logger
logger.addHandler(file_handler)

settings = Settings()
