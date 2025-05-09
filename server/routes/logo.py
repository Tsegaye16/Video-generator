from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from models import ImageUploadResponse, LogoUploadResponse
from config import settings, logger

import requests


from utils import merge_with_logo

router = APIRouter()



@router.post("/api/upload-logo", response_model=LogoUploadResponse)
async def upload_logo(logo: UploadFile = File(...)):
    # Validate file type
    if logo.content_type not in ["image/jpeg", "image/png"]:
        logger.warning(f"Invalid logo file type: {logo.filename}")
        raise HTTPException(status_code=400, detail="Only JPG/PNG logos are allowed.")

    
    try:
        # Set HeyGen API endpoint and headers
        url = "https://upload.heygen.com/v1/asset"
        headers = {
            "Content-Type": logo.content_type,  # Dynamically set based on file
            "X-Api-Key": settings.HEYGEN_API_KEY,
        }

        # Log the upload attempt
        logger.info(f"Uploading logo: {logo.filename} (type: {logo.content_type})")

        # Send the file as binary data
        response = requests.post(url, headers=headers, data=logo.file)

        # Check HTTP status code
        if response.status_code != 200:
            logger.error(f"HeyGen API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"HeyGen API error: {response.status_code}")

        # Parse the JSON response
        response_data = response.json()
        logger.debug(f"HeyGen response: {response_data}")

        # Check if the API call was successful (code == 100)
        if response_data.get("code") != 100:
            logger.error(f"HeyGen API error: {response_data.get('message', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"HeyGen API error: {response_data.get('message', 'Unknown error')}")

        # Extract the logo URL
        logo_url = response_data.get("data", {}).get("url")
        logo_id = response_data.get("data", {}).get("id")
        if not logo_url:
            logger.error("No URL found in HeyGen response")
            raise HTTPException(status_code=500, detail="Invalid response from HeyGen: No URL found")

        logger.info(f"Logo uploaded successfully to HeyGen: {logo_url}")
        return LogoUploadResponse(logo_id=logo_id, logo_url=logo_url)

    except requests.RequestException as e:
        logger.error(f"Failed to upload logo to HeyGen: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during logo upload: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    finally:
        logo.file.close()

@router.post("/api/upload-image", response_model=ImageUploadResponse)
async def upload_image(logo_url: str = Form(...), image: UploadFile = File(...)):
    # Validate image file type
    if image.content_type not in ["image/jpeg", "image/png"]:
        logger.warning(f"Invalid image file type: {image.filename}")
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are allowed.")

    
    try:
        # Set HeyGen API endpoint and headers
        url = "https://upload.heygen.com/v1/asset"
        headers = {
            "Content-Type": image.content_type,  # Dynamically set based on file
            "X-Api-Key": settings.HEYGEN_API_KEY,
        }

        # Log the upload attempt
        logger.info(f"Uploading image: {image.filename} (type: {image.content_type})")

        if logo_url:
            # Read image content and merge with logo
            content = await image.read()
            logger.info(f"Merging image with logo: {logo_url}")
            merged = await merge_with_logo(content, logo_url)

            # Upload merged image to HeyGen
            logger.info(f"Uploading merged image to HeyGen")
            response = requests.post(url, headers=headers, data=merged)

        else:
            # Upload original image to HeyGen (no logo merging)
            logger.info(f"Uploading original image to HeyGen")
            response = requests.post(url, headers=headers, data=image.file)

        # Check HTTP status code
        if response.status_code != 200:
            logger.error(f"HeyGen API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"HeyGen API error: {response.status_code}")

        # Parse the JSON response
        response_data = response.json()
        logger.debug(f"HeyGen response: {response_data}")

        # Check if the API call was successful (code == 100)
        if response_data.get("code") != 100:
            logger.error(f"HeyGen API error: {response_data.get('message', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"HeyGen API error: {response_data.get('message', 'Unknown error')}")

        # Extract the image URL
        image_url = response_data.get("data", {}).get("url")
        image_id = response_data.get("data", {}).get("id")
        if not image_url:
            logger.error("No URL found in HeyGen response")
            raise HTTPException(status_code=500, detail="Invalid response from HeyGen: No URL found")

        logger.info(f"Image uploaded successfully to HeyGen: {image_url}")
        return ImageUploadResponse(image_id=image_id, image_url=image_url)

    except requests.RequestException as e:
        logger.error(f"Failed to upload image to HeyGen: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during image upload: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    finally:
        image.file.close()