import numpy as np
import tensorflow as tf
import cv2
import base64
from io import BytesIO
from PIL import Image

def _to_base64_pil(img_array):
    img = Image.fromarray((img_array).astype('uint8'))
    buf = BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def grad_cam(model, img_array, last_conv_layer_name=None, class_index=None):
    img_tensor = tf.convert_to_tensor(np.expand_dims(img_array, 0), dtype=tf.float32)
    if last_conv_layer_name is None:
        for layer in reversed(model.layers):
            if 'conv' in layer.name:
                last_conv_layer_name = layer.name
                break
    try:
        last_conv_layer = model.get_layer(last_conv_layer_name)
    except Exception:
        last_conv_layer = model.layers[-3]

    grad_model = tf.keras.models.Model([model.inputs], [last_conv_layer.output, model.output])
    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_tensor)
        if class_index is None:
            class_index = tf.argmax(predictions[0])
        loss = predictions[:, class_index]
    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0,1,2))
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    heatmap = heatmap.numpy()
    heatmap = cv2.resize(heatmap, (img_array.shape[1], img_array.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted((img_array*255).astype('uint8'), 0.6, heatmap_color, 0.4, 0)
    return _to_base64_pil(overlay)
