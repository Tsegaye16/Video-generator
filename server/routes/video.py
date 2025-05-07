from fastapi import APIRouter, HTTPException
from models import VideoGenerationRequest
from config import settings, logger
import requests
import json
import time

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



@router.post("/api/generate-video")
async def generate_video(request: VideoGenerationRequest):
    try:
        video_inputs = []
        for scene in request.scenes:
            video_input = {}
            if request.avatar_id is not None:
                video_input["character"] = {
                    "type": "avatar",
                    "avatar_id": request.avatar_idd,
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

        response = requests.post(
            "https://api.heygen.com/v2/video/generate",
            json=payload,
            headers=headers
        )

        if response.status_code != 200:
            logger.error(f"HeyGen API error: {response.text}")
            return {
                'success': False,
                'error': 'HeyGen API error',
                'status_code': response.status_code,
                'details': response.text
            }, 500

        video_data = response.json()
        video_id = video_data.get("data", {}).get("video_id")

        logger.info(f"Video request submitted: {video_id}")

        # Polling status
        status_url = f"https://api.heygen.com/v1/video_status.get?video_id={video_id}"

        while True:
            status_response = requests.get(status_url, headers=headers)
            status_data = status_response.json()
            status = status_data.get("data", {}).get("status")

            logger.info(f"Checking status for {video_id}: {status}")

            if status == "completed":
                video_url = status_data["data"].get("video_url")
                return {
                    'success': True,
                    'video_id': video_id,
                    'video_url': video_url
                }
            elif status == "failed":
                return {
                    'success': False,
                    'video_id': video_id,
                    'error': 'Video generation failed'
                }

            time.sleep(5)  # Wait 5 seconds before next check

    except requests.exceptions.RequestException as e:
        logger.error(f"HeyGen API request failed: {e}")
        raise HTTPException(status_code=500, detail=f"HeyGen API request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
