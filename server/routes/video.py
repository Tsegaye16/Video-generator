from fastapi import APIRouter, HTTPException
from models import VideoGenerationRequest
from config import settings, logger
import requests


router = APIRouter()

@router.get("/api/get_avatars")
async def get_avatars():
    try:
        headers = {
            "X-Api-Key": settings.HEYGEN_API_KEY,
            "accept": "application/json"
        }
        response = requests.get(
            "https://api.heygen.com/v2/avatars",
            headers=headers,
            timeout=40
        )
        response.raise_for_status()
        response_data = response.json()

        logger.info("Avatars fetched successfully")
        return {
            "success": True,
            "data": response_data.get("data", {}).get("avatars", [])
        }
    except Exception as e:
        logger.error(f"Failed to fetch avatars: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatars: {str(e)}")

@router.get("/api/get_voices")
async def get_voices():
    try:
        headers = {
            "accept": "application/json",
            "X-Api-Key": settings.HEYGEN_API_KEY
        }
        response = requests.get(
            "https://api.heygen.com/v2/voices",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        response_data = response.json()

        logger.info("Voices fetched successfully")
        return {
            "success": True,
            "data": response_data.get("data", {}).get("voices", [])
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to fetch voices: {e}")
        raise HTTPException(status_code=500, detail=f"HeyGen API request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



from fastapi import HTTPException
import requests
import time
import logging

logger = logging.getLogger(__name__)

@router.post("/api/generate-video")
async def generate_video(request: VideoGenerationRequest):
    try:
        video_inputs = []
        for scene in request.scenes:
            video_input = {}
            if request.avatar_id is not None:
                video_input["character"] = {
                    "type": "avatar",
                    "avatar_id": request.avatar_id,
                    "scale": 0.60,
                    "avatar_style": "normal",
                    "offset": {"x": 0.36, "y": 0.21}
                }
            video_input["voice"] = {
                "type": "text",
                "voice_id": request.voice_id,
                "input_text": scene.speech_script,
                "speed": 1.0
            }
            video_input["background"] = {
                "type": "image",
                "url": scene.image_url,
                "fit": "cover"
            }
            video_inputs.append(video_input)

        payload = {
            "video_inputs": video_inputs,
            "dimension": {
                "width": 1280,
                "height": 720
            }
        }

        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": settings.HEYGEN_API_KEY
        }

        # Submit video generation request
        response = requests.post(
            "https://api.heygen.com/v2/video/generate",
            json=payload,
            headers=headers
        )

        if response.status_code != 200:
            logger.error(f"HeyGen API error: {response.text}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": "HeyGen API error",
                    "details": response.text
                }
            )

        video_data = response.json()
        video_id = video_data.get("data", {}).get("video_id")

        if not video_id:
            logger.error(f"No video_id in response: {video_data}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": "Failed to initiate video generation",
                    "details": "No video_id returned by HeyGen API"
                }
            )

        logger.info(f"Video request submitted: {video_id}")
        return {
            "success": True,
            "video_id": video_id
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"HeyGen API request failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"HeyGen API request failed: {str(e)}"
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Unexpected server error: {str(e)}"
            }
        )

@router.get("/api/video-status/{video_id}")
async def get_video_status(video_id: str):
    try:
        headers = {
            "accept": "application/json",
            "x-api-key": settings.HEYGEN_API_KEY
        }

        status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"
        status_response = requests.get(status_url, headers=headers)
        status_response.raise_for_status()

        status_data = status_response.json()
        logger.debug(f"Status response: {status_data}")

        status = status_data.get("data", {}).get("status")
        logger.info(f"Checking status for {video_id}: {status}")

        if status == "completed":
            video_url = status_data["data"].get("video_url")
            if not video_url:
                logger.error(f"No video_url in completed status: {status_data}")
                raise HTTPException(
                    status_code=500,
                    detail={
                        "success": False,
                        "error": "Video generation completed but no video URL provided",
                        "details": "Missing video_url in response"
                    }
                )
            return {
                "success": True,
                "video_id": video_id,
                "video_url": video_url,
                "status": "completed"
            }

        elif status == "failed":
            error_info = status_data["data"].get("error", {})
            error_message = error_info.get("detail") or error_info.get("message") or "Unknown error"
            error_code = error_info.get("code", "Unknown")
            logger.error(f"Video generation failed for {video_id}: {error_message} (Code: {error_code})")
            raise HTTPException(
                status_code=422,
                detail={
                    "success": False,
                    "video_id": video_id,
                    "error": error_message,
                    "error_code": error_code,
                    "status": "failed"
                }
            )

        elif status in ["pending", "waiting", "processing"]:
            return {
                "success": True,
                "video_id": video_id,
                "status": status
            }

        else:
            logger.error(f"Unknown status for {video_id}: {status}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "video_id": video_id,
                    "error": f"Unknown video status: {status}",
                    "status": "unknown"
                }
            )

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else None
        error_details = e.response.text if e.response else str(e)
        error_message = "Failed to check video status"

        if status_code == 404:
            error_message = "Video status not found. The video ID may be invalid or expired."
            logger.error(f"HeyGen API returned 404 for video_id {video_id}: {error_details}")
        else:
            logger.error(f"HeyGen status check failed: {error_details}")

        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": error_message,
                "details": error_details,
                "http_status": status_code,
                "status": "error"
            }
        )

    except requests.exceptions.RequestException as e:
        logger.error(f"HeyGen API request failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"HeyGen API request failed: {str(e)}",
                "status": "error"
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Unexpected server error: {str(e)}",
                "status": "error"
            }
        )