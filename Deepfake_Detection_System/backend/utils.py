import cv2
import numpy as np
from PIL import Image
import io, tempfile, os

def preprocess_image_file(file_stream, target_size=(299, 299)):
    if hasattr(file_stream, 'read'):
        image_bytes = file_stream.read()
    else:
        image_bytes = file_stream
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize(target_size)
    arr = np.asarray(image).astype('float32')
    return arr / 255.0

def extract_frames_from_video(file_stream, max_frames=30, target_size=(299, 299)):
    if hasattr(file_stream, 'read'):
        content = file_stream.read()
    else:
        content = file_stream
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    cap = cv2.VideoCapture(tmp_path)
    frames = []
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    step = max(1, total // max_frames) if total>0 else 1
    idx = 0
    grabbed = 0
    while grabbed < max_frames:
        ret = cap.grab()
        if not ret:
            break
        if idx % step == 0:
            ret2, frame = cap.retrieve()
            if not ret2:
                break
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, target_size)
            frames.append(frame.astype('float32')/255.0)
            grabbed += 1
        idx += 1
    cap.release()
    try:
        os.remove(tmp_path)
    except Exception:
        pass
    return np.array(frames)
