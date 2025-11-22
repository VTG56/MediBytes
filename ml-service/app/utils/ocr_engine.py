import easyocr
import numpy as np
from PIL import Image

class OCREngine:
    def __init__(self, languages=['en'], gpu=False):
        """
        Initialize EasyOCR reader
        """
        try:
            self.reader = easyocr.Reader(languages, gpu=gpu)
            self.gpu = gpu
        except Exception as e:
            print(f"Warning: Could not initialize EasyOCR with GPU. Falling back to CPU. Error: {e}")
            self.reader = easyocr.Reader(languages, gpu=False)
            self.gpu = False
    
    def extract_text(self, image):
        """
        Extract text from image using EasyOCR
        
        Args:
            image: PIL Image or path to image file
            
        Returns:
            tuple: (extracted_text, confidence)
        """
        try:
            # Convert PIL Image to numpy array if needed
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            # Perform OCR
            results = self.reader.readtext(image)
            
            # Extract text and calculate average confidence
            extracted_texts = []
            confidences = []
            
            for (bbox, text, confidence) in results:
                extracted_texts.append(text)
                confidences.append(confidence)
            
            # Combine texts
            full_text = ' '.join(extracted_texts)
            
            # Calculate average confidence
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            return full_text, float(avg_confidence)
            
        except Exception as e:
            raise Exception(f"OCR extraction failed: {str(e)}")
    
    def extract_structured(self, image):
        """
        Extract text with bounding box information
        
        Args:
            image: PIL Image or path to image file
            
        Returns:
            list: List of dictionaries with text, bbox, and confidence
        """
        try:
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            results = self.reader.readtext(image)
            
            structured_results = []
            for (bbox, text, confidence) in results:
                structured_results.append({
                    'text': text,
                    'bbox': bbox,
                    'confidence': float(confidence)
                })
            
            return structured_results
            
        except Exception as e:
            raise Exception(f"Structured OCR extraction failed: {str(e)}")
    
    def detect_language(self, image):
        """
        Detect primary language in image
        """
        try:
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            results = self.reader.readtext(image, detail=1)
            
            # For now, return 'en' as default
            # In production, you might want to use language detection
            return 'en'
            
        except Exception as e:
            return 'en'
