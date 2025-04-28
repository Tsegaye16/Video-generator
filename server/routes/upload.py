from fastapi import APIRouter, File, UploadFile, HTTPException
from utils import get_slide_count
from config import settings, logger
import os
import shutil
import uuid

router = APIRouter()

@router.post("/api/upload")
async def upload_powerpoint(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="Invalid file type.")
    temp_filename = f"{uuid.uuid4()}{file_ext}"
    temp_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, temp_filename)
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            logger.info(f"File uploaded successfully: {file.filename}")
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
    finally:
        await file.close()
    try:
        slide_count = get_slide_count(temp_file_path)
        if slide_count > settings.MAX_SLIDES:
            os.remove(temp_file_path)
            logger.warning(f"File exceeds max slides: {file.filename}")
            raise HTTPException(status_code=400, detail=f"Exceeds max {settings.MAX_SLIDES} slides.")
        if slide_count == 0:
            os.remove(temp_file_path)
            logger.warning(f"No slides found in file: {file.filename}")
            raise HTTPException(status_code=400, detail="No slides found.")
    except HTTPException as e:

        raise e
    except Exception as e:
        os.remove(temp_file_path)
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail="Error processing file.")
    logger.info(f"File processed successfully: {file.filename}")
    return {"message": "Uploaded successfully!", "filename": file.filename, "file_id": temp_filename, "slide_count": slide_count}
