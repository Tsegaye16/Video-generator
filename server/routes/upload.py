from fastapi import APIRouter, File, UploadFile, HTTPException
from utils import get_slide_count
from config import settings, logger
import os
import shutil
import uuid
from spire.presentation import Presentation as SpirePresentation, FileFormat

router = APIRouter()

@router.post("/api/upload")
async def upload_powerpoint(file: UploadFile = File(...)):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        logger.warning(f"Invalid file type: {file.filename}")
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .ppt or .pptx file."
        )

    # Generate a unique temporary filename
    temp_filename = f"{uuid.uuid4()}{file_ext}"
    temp_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, temp_filename)

    # Save the uploaded file
    try:
        os.makedirs(settings.TEMP_UPLOAD_DIR, exist_ok=True)  # Ensure directory exists
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"File uploaded successfully: {file.filename}")
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file.")
    finally:
        await file.close()

    # Handle .ppt conversion to .pptx for slide counting
    processing_file_path = temp_file_path
    converted_file_path = None
    if file_ext == '.ppt':
        try:
            # Load the PPT file with Spire.Presentation
            spire_pptx = SpirePresentation()
            spire_pptx.LoadFromFile(temp_file_path)
            
            # Save as PPTX
            converted_filename = f"{uuid.uuid4()}.pptx"
            converted_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, converted_filename)
            spire_pptx.SaveToFile(converted_file_path, FileFormat.Pptx2019)
            spire_pptx.Dispose()  # Close the presentation
            
            # Update processing file path to the converted PPTX
            processing_file_path = converted_file_path
            logger.info(f"Converted {file.filename} to PPTX: {converted_filename}")
        except Exception as e:
            # Clean up original file on conversion failure
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            logger.error(f"Error converting PPT to PPTX for {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"PPT to PPTX conversion failed: {e}")

    # Process the file (original .pptx or converted .pptx)
    try:
        slide_count = get_slide_count(processing_file_path)
        if slide_count > settings.MAX_SLIDES:
            logger.warning(f"File exceeds max slides: {file.filename}")
            raise HTTPException(status_code=400, detail=f"Exceeds max {settings.MAX_SLIDES} slides.")
        if slide_count == 0:
            logger.warning(f"No slides found in file: {file.filename}")
            raise HTTPException(status_code=400, detail="No slides found.")
    except HTTPException as e:
        # Clean up files on validation failure
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if converted_file_path and os.path.exists(converted_file_path):
            os.remove(converted_file_path)
        raise e
    except Exception as e:
        # Clean up files on processing error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if converted_file_path and os.path.exists(converted_file_path):
            os.remove(converted_file_path)
        logger.error(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")

    # Retain files for extraction; cleanup will be handled by /api/extract
    logger.info(f"File processed successfully: {file.filename}")
    return {
        "message": "Uploaded successfully!",
        "filename": file.filename,
        "file_id": temp_filename,
        "slide_count": slide_count
    }