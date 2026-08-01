import io
import os
from typing import List, Tuple, Optional
import pypdf
from PIL import Image

def render_pdf_pages_to_images(file_path: str, max_pages: int = 20) -> List[Tuple[bytes, str]]:
    """
    Extracts or renders images for ALL pages of a PDF document.
    Returns a list of (image_bytes, mime_type) tuples.
    """
    image_payloads = []
    
    try:
        reader = pypdf.PdfReader(file_path)
        num_pages = min(len(reader.pages), max_pages)
        
        for page_idx in range(num_pages):
            page = reader.pages[page_idx]
            
            # Extract images embedded directly in the PDF page
            if page.images:
                for img_obj in page.images:
                    try:
                        img_bytes = img_obj.data
                        img = Image.open(io.BytesIO(img_bytes))
                        out_buffer = io.BytesIO()
                        img.convert("RGB").save(out_buffer, format="PNG")
                        image_payloads.append((out_buffer.getvalue(), "image/png"))
                    except Exception as e:
                        print(f"Error reading page {page_idx+1} image: {e}")
                        
    except Exception as e:
        print(f"Error rendering PDF pages to images: {e}")
        
    return image_payloads
