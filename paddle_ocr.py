"""
PaddleOCR Wrapper Module
提供 PaddleOCR 的封裝介面，包含初始化、辨識、可用性檢查等功能
"""

from PIL import Image
import numpy as np

# Singleton instance
_paddle_ocr_instance = None
_paddle_available = None

def is_paddle_available():
    """
    檢查 PaddleOCR 是否可用
    
    Returns:
        bool: True if PaddleOCR is installed and working, False otherwise
    """
    global _paddle_available
    
    # Cache the result
    if _paddle_available is not None:
        return _paddle_available
    
    try:
        import paddleocr
        _paddle_available = True
        return True
    except ImportError:
        _paddle_available = False
        return False

def initialize_paddle_ocr():
    """
    初始化 PaddleOCR 實例（懶加載，單例模式）
    
    Returns:
        PaddleOCR instance or None if initialization fails
    """
    global _paddle_ocr_instance
    
    # Return existing instance if already initialized
    if _paddle_ocr_instance is not None:
        return _paddle_ocr_instance
    
    # Check if PaddleOCR is available
    if not is_paddle_available():
        return None
    
    try:
        from paddleocr import PaddleOCR
        
        # Initialize with Traditional Chinese
        # use_angle_cls=True enables text angle detection
        # show_log=False suppresses verbose output
        _paddle_ocr_instance = PaddleOCR(
            lang='chinese_cht',  # Traditional Chinese
            use_angle_cls=True,   # Detect text rotation
            show_log=False,       # Suppress logs
            use_gpu=False         # Use CPU (GPU support can be enabled if available)
        )
        
        return _paddle_ocr_instance
    except Exception as e:
        print(f"PaddleOCR initialization failed: {e}")
        return None

def perform_paddle_ocr(image):
    """
    使用 PaddleOCR 進行文字辨識
    
    Args:
        image: PIL Image object
        
    Returns:
        str: Recognized text, or error message if recognition fails
    """
    try:
        # Initialize OCR if not already done
        ocr = initialize_paddle_ocr()
        
        if ocr is None:
            return "Error: PaddleOCR not available. Please install with: pip install paddleocr"
        
        # Convert PIL Image to numpy array (required by PaddleOCR)
        img_array = np.array(image)
        
        # Perform OCR
        # Result format: [[[coordinates], (text, confidence)], ...]
        result = ocr.ocr(img_array, cls=True)
        
        # Extract text from result
        if not result or not result[0]:
            return ""
        
        # Combine all recognized text lines
        text_lines = []
        for line in result[0]:
            if line and len(line) >= 2:
                text, confidence = line[1]
                text_lines.append(text)
        
        # Join with newlines
        full_text = '\n'.join(text_lines)
        
        return full_text
        
    except Exception as e:
        return f"PaddleOCR Error: {str(e)}"

def get_paddle_info():
    """
    獲取 PaddleOCR 版本和配置信息
    
    Returns:
        dict: Information about PaddleOCR installation
    """
    if not is_paddle_available():
        return {
            'available': False,
            'message': 'PaddleOCR not installed'
        }
    
    try:
        import paddleocr
        import paddlepaddle as paddle
        
        return {
            'available': True,
            'paddleocr_version': paddleocr.__version__,
            'paddlepaddle_version': paddle.__version__,
            'model': 'PP-OCRv5',
            'language': 'Traditional Chinese (chinese_cht)'
        }
    except Exception as e:
        return {
            'available': False,
            'error': str(e)
        }
