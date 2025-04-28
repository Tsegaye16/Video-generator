from fastapi import APIRouter, HTTPException
from models import VideoGenerationRequest
from config import settings, logger
import requests
import json

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
            timeout=10
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

@router.post("/api/generate-video")
async def generate_video(request: VideoGenerationRequest):
    try:
        video_inputs = []
        for scene in request.scenes:
            video_input = {
                "character": {
                    "type": "avatar",
                    "avatar_id": request.avatar_id,
                    "scale": 0.60,
                    "avatar_style": "normal",
                    "offset": {"x": 0.36, "y": 0.21}
                },
                "voice": {
                    "type": "text",
                    "voice_id": request.voice_id,
                    "input_text": scene.speech_script,
                    "speed": 1.0
                },
                "background": {
                    "type": "image",
                    "url": scene.image_url,
                    "fit": "cover"
                }
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
        response = requests.post(
            "https://api.heygen.com/v2/video/generate",
            json=payload,
            headers=headers
        )
      
        if response.status_code == 200:
            video_data = response.json()

            logger.info(f"Video generated successfully: {video_data.get('data', {}).get('video_id')}")
            return {
                'success': True,
                'video_id': video_data.get('data', {}).get('video_id'),
                'status_url': f"https://api.heygen.com/v1/video_status.get?video_id={video_data.get('data', {}).get('video_id')}"
            }
        else:
            logger.error(f"HeyGen API error: {response.text}")
            
            return {
                'success': False,
                'error': 'HeyGen API error',
                'status_code': response.status_code,
                'details': response.text
            }, 500
    except requests.exceptions.RequestException as e:
        logger.error(f"HeyGen API request failed: {e}")
        raise HTTPException(status_code=500, detail=f"HeyGen API request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/api/video-status/{video_id}")
async def get_video_status(video_id: str):
    try:
        headers = {
            "accept": "application/json",
            "x-api-key": settings.HEYGEN_API_KEY
        }
        response = requests.get(
            f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
            headers=headers
        )
        print("Response:",response.text)
        response.raise_for_status()
        status_data = response.json()

        logger.info(f"Video status fetched successfully: {video_id}")
        return {
            "success": True,
            "status": status_data.get("data", {}).get("status"),
            "download_url": status_data.get("data", {}).get("video_url")
        }
    except Exception as e:
        logger.error(f"Failed to fetch video status: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
