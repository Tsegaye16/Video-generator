from fastapi import APIRouter, File, UploadFile, HTTPException
from models import LogoUploadResponse
from config import settings, logger
import cloudinary.uploader
import uuid

router = APIRouter()

@router.post("/api/upload-logo", response_model=LogoUploadResponse)
async def upload_logo(logo: UploadFile = File(...)):
    if logo.content_type not in ["image/jpeg", "image/png"]:
        logger.warning(f"Invalid logo file type: {logo.filename}")
        raise HTTPException(status_code=400, detail="Only JPG/PNG logos are allowed.")
    
    logo_id = str(uuid.uuid4())
    try:
        # Upload logo to Cloudinary
        upload_result = cloudinary.uploader.upload(
            logo.file,
            public_id=f"logos/{logo_id}",  # Store in 'logos' folder with unique ID
            resource_type="image"
        )
        logo_url = upload_result['secure_url']
        logger.info(f"Logo uploaded successfully to Cloudinary: {logo_url}")
        return LogoUploadResponse(logo_id=logo_id, logo_url=logo_url)  # Return logo_id and URL
    except Exception as e:
        logger.error(f"Failed to upload logo to Cloudinary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")
    finally:
        logo.file.close()