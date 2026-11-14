# generate_demo_model.py
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2

# Load a pretrained MobileNetV2 (ImageNet weights)
model = MobileNetV2(weights="imagenet", include_top=True)

# Save as our demo deepfake model
model.save("models/deepfake_detection_model.h5")

print("✅ Demo model saved to models/deepfake_detection_model.h5")
