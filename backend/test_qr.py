import cv2
import numpy as np

detector = cv2.QRCodeDetector()
# create a dummy image
img = np.zeros((100, 100, 3), dtype=np.uint8)
retval, decoded_info, points, straight_qrcode = detector.detectAndDecodeMulti(img)
print(retval, decoded_info, points, straight_qrcode)
