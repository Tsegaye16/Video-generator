import os
import aiohttp
import shutil
import uuid
import io
from io import BytesIO
import json
from PIL import Image
from pptx import Presentation
from pptx.exc import PackageNotFoundError
from pptx.enum.shapes import MSO_SHAPE_TYPE
from config import settings
import google.generativeai as genai
from models import SlideData,  TableData
from typing import Any,  List

def get_slide_count(file_path: str) -> int:
    try:
        prs = Presentation(file_path)
        return len(prs.slides)
    except PackageNotFoundError:
        raise ValueError("Cannot process legacy .ppt format reliably for slide count. Please use .pptx.")
    except Exception as e:
        raise ValueError(f"Error processing PowerPoint file: {e}")

from typing import List, Optional



def summarize_table(table_data: TableData) -> str:
    if not table_data or not table_data.rows:
        return ""
    header = ", ".join(table_data.rows[0])
    num_rows = len(table_data.rows) - 1
    return f"Table with header '{header}' and {num_rows} data rows."

def format_slide_content_for_llm(slide: SlideData, extracted_content_path: str) -> List[Any]:
    parts = []
    if slide.title:
        parts.append(f"Slide Title: {slide.title}\n")
    if slide.text_elements:
        parts.append("Slide Text:\n" + "\n".join([f"- {text}" for text in slide.text_elements]) + "\n")
    if slide.tables:
        table_summaries = [summarize_table(table) for table in slide.tables]
        parts.append("Slide Tables Summary:\n" + "\n".join([f"- {summary}" for summary in table_summaries]) + "\n")
    for img_info in slide.images:
        img_path = os.path.join(extracted_content_path, img_info.filename)
        if os.path.exists(img_path):
            try:
                img = Image.open(img_path)
                mime_type = None
                if img.format == "PNG":
                    mime_type = "image/png"
                elif img.format == "JPEG":
                    mime_type = "image/jpeg"
                elif img.format == "GIF":
                    mime_type = "image/gif"
                elif img.format == "BMP":
                    mime_type = "image/bmp"
                elif img_info.content_type:
                    mime_type = img_info.content_type
                if mime_type:
                    img_bytes = io.BytesIO()
                    img.save(img_bytes, format=img.format)
                    parts.append(genai.Part.from_data(img_bytes.getvalue(), mime_type=mime_type))
                    parts.append(f"\nImage Description (from file: {img_info.filename}): ")
                else:
                    print(f"Warning: Could not determine MIME type for image {img_info.filename}")
            except Exception as e:
                print(f"Warning: Could not load image {img_path} for LLM. Error: {e}")
        else:
            print(f"Warning: Image file not found at {img_path}")
    return parts

async def merge_with_logo(background_image_data: bytes, logo_url: str, output_format: str = "PNG"):
    try:
        # Open the background image
        background = Image.open(BytesIO(background_image_data)).convert("RGBA")
        
        # Download the logo from Cloudinary
        async with aiohttp.ClientSession() as session:
            async with session.get(logo_url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download logo from {logo_url}")
                logo_data = await response.read()
        
        # Open and process the logo
        logo = Image.open(BytesIO(logo_data)).convert("RGBA")
        logo = logo.resize((90, 90))
        
        # Merge the images
        x = background.width - logo.width
        y = 0
        composite = Image.new("RGBA", background.size)
        composite.paste(background, (0, 0))
        composite.paste(logo, (x, y), logo)
        
        # Save the merged image to a buffer
        merged_buffer = BytesIO()
        composite.save(merged_buffer, format=output_format)
        merged_buffer.seek(0)
        return merged_buffer.getvalue()
    except Exception as e:
        print(f"Error merging with logo: {e}")
        return None
