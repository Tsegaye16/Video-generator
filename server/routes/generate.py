from fastapi import APIRouter, HTTPException
from models import SceneGenerationRequest, SceneGenerationResponse, Scene, ImageGenerationRequest, ImageGenerationResponse
from utils import format_slide_content_for_llm, merge_with_logo
from config import settings, logger
import json
import google.generativeai as genarativeai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google import genai
import requests
from typing import List


router = APIRouter()



@router.post("/api/generate-scenes", response_model=SceneGenerationResponse)
async def generate_scenes(request: SceneGenerationRequest):
    if not settings.GOOGLE_API_KEY:
        logger.error("Gemini API Key not configured on server.")
        raise HTTPException(status_code=500, detail="Gemini API Key not configured on server.")
    extraction_data = request.extraction_data
    all_scenes: List[Scene] = []
    extracted_content_path = extraction_data.extracted_content_path
    genarativeai.configure(api_key=settings.GOOGLE_API_KEY)
    model = genarativeai.GenerativeModel(
        'gemini-2.0-flash',
        generation_config=genarativeai.GenerationConfig(response_mime_type="application/json"),

        safety_settings={
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        }

    )
    system_prompt = """
You are an AI assistant creating a video script storyboard from PowerPoint slide content.
Analyze the provided text, table summaries, and images for each slide.
Your goal is to break down the slide's information into one or more logical "scenes".
For each scene, generate:
1.  `speech_script`: A concise narration (1-2 sentences, conversational tone) summarizing the key point of that scene.
2.  `image_prompt`: A descriptive text prompt (max 30 words) for an AI image generator to create a relevant, professional-looking background visual for this scene. Focus on the core concept, mood, or key elements. Avoid text in images unless essential.

Structure your output as a JSON object containing a single key "scenes", which is a list of scene objects. Each scene object must have "speech_script" and "image_prompt" keys.
Example scene object: {"speech_script": "...", "image_prompt": "..."}
Ensure the narrative flows logically across scenes derived from the same slide.
Base your output *only* on the provided slide content. Do not add external information.
"""
    try:
        for slide_data in extraction_data.slides:
            slide_content_parts = format_slide_content_for_llm(slide_data, extracted_content_path)
            prompt_parts = [system_prompt, "\n--- SLIDE CONTENT START ---\n"]
            prompt_parts.extend(slide_content_parts)
            prompt_parts.append("\n--- SLIDE CONTENT END ---\nGenerate scenes based *only* on the content above:")
            response = model.generate_content(prompt_parts, stream=False)
            if not response.candidates or not response.candidates[0].content.parts:
                logger.error(f"Error: No content generated for slide {slide_data.slide_number}.")
                all_scenes.append(Scene(
                    original_slide_number=slide_data.slide_number,
                    speech_script=f"Error: Could not generate content for slide {slide_data.slide_number}. Review original slide.",
                    image_prompt="abstract error message background"
                ))
                continue
            try:
                generated_json = json.loads(response.text)
                slide_scenes = generated_json.get("scenes", [])
                if not slide_scenes:
                    all_scenes.append(Scene(
                        speech_script=f"Notice: AI could not determine distinct scenes for slide {slide_data.slide_number}.",
                        image_prompt="simple placeholder graphic",
                        original_slide_number=slide_data.slide_number
                    ))
                    continue
                for scene_idx, scene_json in enumerate(slide_scenes, 1):
                    all_scenes.append(Scene(
                        speech_script=scene_json.get("speech_script", "No script generated"),
                        image_prompt=scene_json.get("image_prompt", "generic background"),
                        original_slide_number=slide_data.slide_number,
                        scene_id=f"slide_{slide_data.slide_number}_scene_{scene_idx}"
                    ))
            except json.JSONDecodeError as e:
                logger.error(f"Error decoding JSON for slide {slide_data.slide_number}: {e}")
                all_scenes.append(Scene(
                    speech_script=f"Error processing slide {slide_data.slide_number}",
                    image_prompt="error background",
                    original_slide_number=slide_data.slide_number,
                    scene_id=f"slide_{slide_data.slide_number}_error"
                ))
    except Exception as e:
        logger.error(f"Error generating scenes: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating scenes: {str(e)}")
    
    logger.info(f"Generated {len(all_scenes)} scenes for file {extraction_data.file_id}.")
    return SceneGenerationResponse(
        file_id=extraction_data.file_id,
        scenes=all_scenes
    )

@router.post("/api/generate-image", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    if not request.scene_id:
        logger.error("scene_id is required for image generation.")
        raise HTTPException(status_code=400, detail="scene_id is required for image generation")

    try:
        # Construct the prompt with the base prompt and user's input
        full_prompt = settings.base_prompt.format(prompt=request.prompt)

        # Generate image using the AI model
        client = genai.Client(api_key=settings.GOOGLE_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=full_prompt,
            config=genai.types.GenerateContentConfig(response_modalities=['TEXT', 'IMAGE']),
        )

        # Extract image data
        image_data = None
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                image_data = part.inline_data.data
                break
        if image_data is None:
            logger.error("No image data received from the model.")
            raise HTTPException(status_code=500, detail="No image data received from the model.")

        # Retrieve logo URL
        logo_url = request.logo_url
        if not logo_url and request.logo_id:
            logger.warning(f"Logo with ID '{request.logo_id}' not found.")
            raise HTTPException(status_code=404, detail=f"Logo with ID '{request.logo_id}' not found.")

        # Merge the background image with the logo (if logo_url is provided)
        final_image_data = image_data
        content_type = "image/png"  # Default for Gemini-generated images (adjust if needed)
        if logo_url:
            logger.info(f"Merging image with logo: {logo_url}")
            final_image_data = await merge_with_logo(image_data, logo_url)
            if final_image_data is None:
                logger.error("Failed to merge image with logo.")
                raise HTTPException(status_code=500, detail="Failed to merge image with logo.")
            content_type = "image/png"  # merge_with_logo outputs PNG

        # Upload the image to HeyGen
        url = "https://upload.heygen.com/v1/asset"
        headers = {
            "Content-Type": content_type,
            "X-Api-Key": settings.HEYGEN_API_KEY,
        }

        logger.info(f"Uploading image to HeyGen (Content-Type: {content_type})")
        response = requests.post(url, headers=headers, data=final_image_data)

        # Check HTTP status code
        if response.status_code != 200:
            error_msg = f"HeyGen API error: {response.status_code} - {response.text}"
            logger.error(error_msg)
            if response.status_code == 400 and "Content type not match" in response.text:
                raise HTTPException(status_code=400, detail="Content type mismatch in HeyGen upload")
            raise HTTPException(status_code=500, detail=f"HeyGen API error: {response.status_code}")

        # Parse the JSON response
        response_data = response.json()
        logger.debug(f"HeyGen response: {response_data}")

        # Check if the API call was successful (code == 100)
        if response_data.get("code") != 100:
            error_msg = f"HeyGen API error: {response_data.get('message', 'Unknown error')}"
            logger.error(error_msg)
            if response_data.get("code") == 400543:
                raise HTTPException(status_code=400, detail="Content type mismatch in HeyGen upload")
            raise HTTPException(status_code=500, detail=error_msg)

        # Extract the image URL
        image_url = response_data.get("data", {}).get("url")
        if not image_url:
            logger.error("No URL found in HeyGen response")
            raise HTTPException(status_code=500, detail="Invalid response from HeyGen: No URL found")

        logger.info(f"Image generated and uploaded successfully: {image_url}")
        return ImageGenerationResponse(
            scene_id=request.scene_id,
            image_url=image_url,
            logo_url=logo_url,
        )

    except requests.RequestException as e:
        logger.error(f"Failed to upload image to HeyGen: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
    
    