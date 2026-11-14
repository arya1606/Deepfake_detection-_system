import os
import tensorflow as tf

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

class ModelLoader:
    def __init__(self):
        self.image_model = None
        self.video_model = None

    def load_image_model(self, filename="xception_image.h5"):
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Image model not found: {path}. Place the pretrained .h5 here.")
        self.image_model = tf.keras.models.load_model(path, compile=False)
        return self.image_model

    def load_video_model(self, filename="video_lstm.h5"):
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Video model not found: {path}. Place the pretrained .h5 here.")
        self.video_model = tf.keras.models.load_model(path, compile=False)
        return self.video_model

loader = ModelLoader()
