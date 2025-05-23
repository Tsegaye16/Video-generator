from fastapi import APIRouter, HTTPException
from models import ExtractRequest, ExtractionResponse, SlideData, ImageInfo, TableData
from config import settings, logger
from typing import List
import uuid
import matplotlib.pyplot as plt
from PIL import Image
import numpy as np

import os
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from spire.presentation import Presentation as SpirePresentation, FileFormat

router = APIRouter()

@router.post("/api/extract")
async def extract_content(request: ExtractRequest):
    file_id = request.file_id
    original_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, file_id)

    if not os.path.exists(original_file_path):
        logger.warning(f"File not found: {file_id}")
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")

    file_ext = os.path.splitext(file_id)[1].lower()
    processing_file_path = original_file_path
    converted_file_path = None

    if file_ext == '.ppt':
        try:
            spire_pptx = SpirePresentation()
            spire_pptx.LoadFromFile(original_file_path)
            converted_filename = f"{uuid.uuid4()}.pptx"
            converted_file_path = os.path.join(settings.TEMP_UPLOAD_DIR, converted_filename)
            spire_pptx.SaveToFile(converted_file_path, FileFormat.Pptx2019)
            spire_pptx.Dispose()
            processing_file_path = converted_file_path
            logger.info(f"Converted {file_id} to PPTX: {converted_filename}")
        except Exception as e:
            if os.path.exists(original_file_path):
                os.remove(original_file_path)
            logger.error(f"Error converting PPT to PPTX for {file_id}: {e}")
            raise HTTPException(status_code=500, detail=f"PPT to PPTX conversion failed: {e}")

    file_base_name = os.path.splitext(file_id)[0]
    specific_extracted_path = os.path.join(settings.EXTRACTED_CONTENT_DIR, file_base_name)
    os.makedirs(specific_extracted_path, exist_ok=True)

    extracted_slides_data: List[SlideData] = []

    try:
        prs = Presentation(processing_file_path)
        for i, slide in enumerate(prs.slides):
            slide_number = i + 1
            current_slide_data = SlideData(slide_number=slide_number)
            image_index, table_index = 0, 0
            title_shape = None

            if slide.shapes.title and slide.shapes.title.has_text_frame:
                title_shape = slide.shapes.title
                current_slide_data.title = title_shape.text.strip()

            for shape in slide.shapes:
                if shape.has_text_frame and shape != title_shape:
                    text = shape.text.strip()
                    if text:
                        current_slide_data.text_elements.append(text)

                if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                    image = shape.image
                    img_filename = f"slide_{slide_number}_img_{image_index}.{image.ext.lower()}"
                    img_save_path = os.path.join(specific_extracted_path, img_filename)
                    with open(img_save_path, 'wb') as f:
                        f.write(image.blob)
                    current_slide_data.images.append(ImageInfo(
                        filename=img_filename,
                        content_type=image.content_type,
                        width_emu=image.size[0],
                        height_emu=image.size[1]
                    ))
                    image_index += 1

                if shape.shape_type == MSO_SHAPE_TYPE.TABLE:
                    table = shape.table
                    table_data_list = [[cell.text.strip() for cell in row.cells] for row in table.rows]
                    if table_data_list:
                        fig, ax = plt.subplots()
                        ax.axis('off')
                        table_img = ax.table(cellText=table_data_list, loc='center', cellLoc='center')
                        table_img.auto_set_font_size(False)
                        table_img.set_fontsize(10)
                        fig.tight_layout()
                        img_filename = f"slide_{slide_number}_table_{table_index}.png"
                        img_save_path = os.path.join(specific_extracted_path, img_filename)
                        fig.savefig(img_save_path, bbox_inches='tight', dpi=200)
                        plt.close(fig)
                        with Image.open(img_save_path) as img:
                            width, height = img.size
                        current_slide_data.images.append(ImageInfo(
                            filename=img_filename,
                            content_type='image/png',
                            width_emu=width,
                            height_emu=height
                        ))
                        table_index += 1

            extracted_slides_data.append(current_slide_data)
            logger.info(f"Extracted slide {slide_number} with title: {current_slide_data.title}")

    except Exception as e:
        logger.error(f"Error extracting content from {file_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    finally:
        try:
            if os.path.exists(original_file_path):
                os.remove(original_file_path)
                logger.info(f"Cleaned up original file: {original_file_path}")
            if converted_file_path and os.path.exists(converted_file_path):
                os.remove(converted_file_path)
                logger.info(f"Cleaned up converted file: {converted_file_path}")
        except Exception as e:
            logger.warning(f"Failed to clean up files: {e}")

    return ExtractionResponse(
        file_id=file_id,
        extracted_content_path=specific_extracted_path,
        slides=extracted_slides_data
    )
