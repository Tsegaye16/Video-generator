from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from models import ImageUploadResponse, LogoUploadResponse
from config import settings, logger
import cloudinary.uploader
import uuid

from utils import merge_with_logo

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

@router.post("/api/upload-image", response_model=ImageUploadResponse)
async def upload_image(logo_url: str = Form(...),image: UploadFile = File(...)):
    if image.content_type not in ["image/jpeg", "image/png"]:
        logger.warning(f"Invalid image file type: {image.filename}")
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed.")
    content = await image.read()
    print('Uploading image', content)
    if logo_url:
        merged = await merge_with_logo(content, logo_url)
        image_id = str(uuid.uuid4())
        try:
            # Upload image to Cloudinary
            upload_result = cloudinary.uploader.upload(
                merged,
                public_id=f"images/{image_id}",  # Store in 'images' folder with unique ID
                resource_type="image"
            )
            image_url = upload_result['secure_url']
            logger.info(f"Image uploaded successfully to Cloudinary: {image_url}")
            return ImageUploadResponse(image_id=image_id, image_url=image_url)  # Return image_id and URL
        except Exception as e:
            logger.error(f"Failed to upload image to Cloudinary: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
        finally:
            image.file.close()
    else:
            raise HTTPException(status_code=500, detail=f"Failed to change image")
