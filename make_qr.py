# -*- coding: utf-8 -*-
"""泓算访问二维码：纯黑码体 + ERROR_CORRECT_H + cv2 真解码自验证"""
import qrcode
import cv2
import numpy as np

URL = "https://lele332.github.io/hongsuan/"
OUT = r"C:\Users\klxq\Desktop\泓算-访问二维码.png"

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=4)
qr.add_data(URL)
qr.make(fit=True)
img = qr.make_image(fill_color=(0, 0, 0), back_color=(255, 255, 255)).convert("RGB")
img.save(OUT)

# cv2 真解码验证（模拟手机扫码；中文路径需 imdecode 读取）
det = cv2.QRCodeDetector()
buf = np.fromfile(OUT, dtype=np.uint8)
data, points, _ = det.detectAndDecode(cv2.imdecode(buf, cv2.IMREAD_COLOR))
ok = data == URL
print(f"decoded: '{data}'")
print("VERIFY_PASS" if ok else f"VERIFY_FAIL (expect {URL})")
