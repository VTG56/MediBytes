import cv2
import numpy as np
from PIL import Image

def preprocess_image(image_path):
    """
    Preprocess image for better OCR results
    """
    # Read image
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not read image from {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(thresh, h=10)
    
    # Deskew if needed
    coords = np.column_stack(np.where(denoised > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        if abs(angle) > 0.5:
            (h, w) = denoised.shape
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            denoised = cv2.warpAffine(denoised, M, (w, h), 
                                      flags=cv2.INTER_CUBIC, 
                                      borderMode=cv2.BORDER_REPLICATE)
    
    # Convert back to PIL Image for EasyOCR
    return Image.fromarray(denoised)

def enhance_contrast(image):
    """
    Enhance image contrast
    """
    if isinstance(image, str):
        img = cv2.imread(image, cv2.IMREAD_GRAYSCALE)
    else:
        img = np.array(image)
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img)
    
    return Image.fromarray(enhanced)

def remove_noise(image, method='bilateral'):
    """
    Remove noise from image
    """
    if isinstance(image, str):
        img = cv2.imread(image)
    else:
        img = np.array(image)
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    
    if method == 'bilateral':
        filtered = cv2.bilateralFilter(img, 9, 75, 75)
    elif method == 'gaussian':
        filtered = cv2.GaussianBlur(img, (5, 5), 0)
    elif method == 'median':
        filtered = cv2.medianBlur(img, 5)
    else:
        filtered = img
    
    return Image.fromarray(cv2.cvtColor(filtered, cv2.COLOR_BGR2RGB))
