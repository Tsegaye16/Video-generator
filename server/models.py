from pydantic import BaseModel
from typing import List, Optional, Dict

class ExtractRequest(BaseModel):
    file_id: str

class ImageInfo(BaseModel):
    filename: str
    content_type: str
    width_emu: int
    height_emu: int

class TableData(BaseModel):
    rows: List[List[str]]

class SlideData(BaseModel):
    slide_number: int
    title: Optional[str] = None
    text_elements: List[str] = []
    images: List[ImageInfo] = []
    tables: List[TableData] = []

class ExtractionResponse(BaseModel):
    file_id: str
    extracted_content_path: str
    slides: List[SlideData]

class Scene(BaseModel):
    image_url: Optional[str] = None
    speech_script: str
    original_slide_number: Optional[int] = None
    image_prompt: Optional[str] = None
    scene_id: Optional[str] = None

class SceneGenerationRequest(BaseModel):
    extraction_data: ExtractionResponse

class SceneGenerationResponse(BaseModel):
    file_id: str
    scenes: List[Scene]
    table_image_urls: Dict[int, List[str]]  # New field: slide_number -> list of table image URLs

class ImageGenerationRequest(BaseModel):
    prompt: str
    scene_id: str
    logo_id: Optional[str] = None
    logo_url: Optional[str] = None

class ImageGenerationResponse(BaseModel):
    scene_id: str
    image_url: Optional[str] = None
    logo_url: Optional[str] = None

class VideoGenerationRequest(BaseModel):
    scenes: List[Scene]
    avatar_id: Optional[str] = None
    voice_id: str

class LogoUploadResponse(BaseModel):
    logo_id: str
    logo_url: str

class ImageUploadResponse(BaseModel):
    image_id: str
    image_url: str