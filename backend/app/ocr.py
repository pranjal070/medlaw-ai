import fitz
import io
from typing import List, Tuple, Dict, Any
from PIL import Image

def extract_all_pages(file_path: str) -> Dict[str, Any]:
    """
    Renders EVERY SINGLE PAGE of a PDF into high-res images and extracts page text.
    Logs debug metrics for page counts and OCR success.
    """
    page_images = []
    page_texts = []
    
    try:
        doc = fitz.open(file_path)
        total_pages = len(doc)
        print(f"[DEBUG LOG] Processing PDF Document: {file_path}")
        print(f"[DEBUG LOG] Total Pages Processed: {total_pages}")
        
        for i in range(total_pages):
            page = doc[i]
            text = page.get_text().strip()
            page_texts.append(text)
            
            # Render page image at 150 DPI for OCR / Multimodal API
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("jpeg")
            page_images.append(img_bytes)
            
            print(f"[DEBUG LOG] Page {i+1}/{total_pages} processed. Text chars: {len(text)}, Image bytes: {len(img_bytes)}")
            
        doc.close()
        
        return {
            "total_pages": total_pages,
            "page_images": page_images,
            "page_texts": page_texts,
            "ocr_success": True
        }
    except Exception as e:
        print(f"[DEBUG LOG ERROR] Failed to extract PDF pages: {e}")
        return {
            "total_pages": 0,
            "page_images": [],
            "page_texts": [],
            "ocr_success": False,
            "error": str(e)
        }
