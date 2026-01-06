# -*- coding: utf-8 -*-
"""
傾斜校正模組 (Deskewing Module)
使用 OpenCV + Hough Transform 偵測並校正掃描文件的傾斜角度
"""

import cv2
import numpy as np
from typing import Tuple, Optional
import math


def detect_skew_angle(image: np.ndarray, min_angle: float = -45, max_angle: float = 45) -> float:
    """
    偵測圖片的傾斜角度
    
    Args:
        image: 輸入圖片 (BGR 或灰階)
        min_angle: 最小偵測角度
        max_angle: 最大偵測角度
    
    Returns:
        傾斜角度 (度)
    """
    # 轉換為灰階
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # 二值化
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # 使用 Canny 邊緣檢測
    edges = cv2.Canny(binary, 50, 150, apertureSize=3)
    
    # 使用 Hough Transform 偵測直線
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=100,
        minLineLength=100,
        maxLineGap=10
    )
    
    if lines is None or len(lines) == 0:
        return 0.0
    
    # 計算所有線段的角度
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if x2 - x1 == 0:
            continue
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        
        # 只考慮接近水平的線 (文字行)
        if min_angle <= angle <= max_angle:
            angles.append(angle)
    
    if not angles:
        return 0.0
    
    # 使用中位數作為最終角度 (較穩健)
    median_angle = np.median(angles)
    
    return median_angle


def deskew_image(image: np.ndarray, angle: Optional[float] = None, 
                 background_color: Tuple[int, int, int] = (255, 255, 255)) -> Tuple[np.ndarray, float]:
    """
    校正圖片傾斜
    
    Args:
        image: 輸入圖片
        angle: 傾斜角度 (若為 None 則自動偵測)
        background_color: 旋轉後填充的背景顏色
    
    Returns:
        (校正後的圖片, 偵測到的角度)
    """
    if angle is None:
        angle = detect_skew_angle(image)
    
    # 如果角度太小，不需要校正
    if abs(angle) < 0.5:
        return image, angle
    
    # 取得圖片尺寸
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    
    # 計算旋轉矩陣
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    
    # 計算新的邊界尺寸 (避免裁切)
    cos_angle = abs(rotation_matrix[0, 0])
    sin_angle = abs(rotation_matrix[0, 1])
    new_w = int(h * sin_angle + w * cos_angle)
    new_h = int(h * cos_angle + w * sin_angle)
    
    # 調整旋轉矩陣的平移部分
    rotation_matrix[0, 2] += (new_w - w) / 2
    rotation_matrix[1, 2] += (new_h - h) / 2
    
    # 執行旋轉
    rotated = cv2.warpAffine(
        image,
        rotation_matrix,
        (new_w, new_h),
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=background_color
    )
    
    return rotated, angle


def enhance_scan_quality(image: np.ndarray) -> np.ndarray:
    """
    增強掃描圖片品質
    - 去除雜訊
    - 增強對比度
    - 銳化文字
    
    Args:
        image: 輸入圖片
    
    Returns:
        增強後的圖片
    """
    # 轉換為灰階
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # 去除雜訊 (保留邊緣)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # 自適應直方圖均衡化 (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # 銳化
    kernel = np.array([[-1, -1, -1],
                      [-1,  9, -1],
                      [-1, -1, -1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    return sharpened


def preprocess_for_ocr(image: np.ndarray, 
                       do_deskew: bool = True,
                       do_enhance: bool = True) -> Tuple[np.ndarray, dict]:
    """
    OCR 前的完整預處理流程
    
    Args:
        image: 輸入圖片
        do_deskew: 是否執行傾斜校正
        do_enhance: 是否執行品質增強
    
    Returns:
        (處理後的圖片, 處理資訊字典)
    """
    info = {
        "original_size": image.shape[:2],
        "skew_angle": 0.0,
        "deskewed": False,
        "enhanced": False
    }
    
    result = image.copy()
    
    # 傾斜校正
    if do_deskew:
        result, angle = deskew_image(result)
        info["skew_angle"] = angle
        info["deskewed"] = abs(angle) >= 0.5
    
    # 品質增強
    if do_enhance:
        result = enhance_scan_quality(result)
        info["enhanced"] = True
    
    info["processed_size"] = result.shape[:2]
    
    return result, info


# 測試用主程式
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python deskew.py <圖片路徑>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    image = cv2.imread(input_path)
    
    if image is None:
        print(f"無法讀取圖片: {input_path}")
        sys.exit(1)
    
    # 執行預處理
    processed, info = preprocess_for_ocr(image)
    
    print(f"原始尺寸: {info['original_size']}")
    print(f"偵測角度: {info['skew_angle']:.2f}°")
    print(f"已校正: {info['deskewed']}")
    
    # 儲存結果
    output_path = input_path.rsplit(".", 1)[0] + "_deskewed.png"
    cv2.imwrite(output_path, processed)
    print(f"已儲存: {output_path}")
