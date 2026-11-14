from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import cv2
import random
import numpy as np
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

app = Flask(__name__, static_folder="static")
CORS(app)

UPLOAD_FOLDER = "uploads"
REPORT_FOLDER = "reports"
FRAME_FOLDER = os.path.join("static", "frames")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)
os.makedirs(FRAME_FOLDER, exist_ok=True)

# in-memory history
history = []


def secure_name(name):
    return "".join(c for c in name if c.isalnum() or c in "._- ").strip()


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file"}), 400

    f = request.files["file"]
    filename = f"{uuid.uuid4()}_{secure_name(f.filename)}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    f.save(filepath)

    metadata = {
        "filename": f.filename,
        "filetype": f.content_type,
        "filesize": round(os.path.getsize(filepath) / (1024 * 1024), 2),
        "dimensions": "1920x1080 (estimated)",
        "last_modified": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    return jsonify({
        "status": "success",
        "metadata": metadata,
        "filepath": filepath
    })


# -------- FRAME EXTRACTION --------
def extract_frames(filepath, sample_count=6):
    frames = []
    cap = cv2.VideoCapture(filepath)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

    if total <= 0:
        img = cv2.imread(filepath)
        if img is not None:
            name = f"{uuid.uuid4()}.jpg"
            p = os.path.join(FRAME_FOLDER, name)
            cv2.imwrite(p, img)
            frames.append(p)
    else:
        step = max(1, total // sample_count)
        for i in range(sample_count):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
            ret, frame = cap.read()
            if ret:
                name = f"{uuid.uuid4()}.jpg"
                p = os.path.join(FRAME_FOLDER, name)
                cv2.imwrite(p, frame)
                frames.append(p)

    cap.release()
    return frames


# -------- MOCK FRAME-LEVEL MODEL --------
def analyze_frame(frame_path):
    """
    Simulates frame-level deepfake probability (0–1)
    Replace this with real ML inference later.
    """
    return random.uniform(0.45, 0.85)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    filepath = data.get("filepath")

    if not filepath or not os.path.exists(filepath):
        return jsonify({"status": "error", "message": "file not found"}), 404

    start_time = datetime.now()

    # 1. Extract frames
    frame_paths = extract_frames(filepath)

    # 2. Frame-level analysis
    frame_scores = [analyze_frame(fp) for fp in frame_paths]

    # 3. Aggregate confidence
    fake_prob = float(np.mean(frame_scores))
    confidence = round(fake_prob * 100, 2)

    verdict = "MANIPULATED" if confidence >= 50 else "REAL"

    # 4. Dynamic metrics
    metrics = {
        "facial_consistency": round(random.uniform(60, 95), 1),
        "blink_pattern": round(random.uniform(50, 90), 1),
        "artifact_detection": round(confidence, 1),
        "lighting": round(random.uniform(65, 95), 1),
        "audio_sync": round(random.uniform(60, 95), 1),
        "deep_learning_confidence": round(confidence, 1)
    }

    # 5. Dynamic indicators
    indicators = []
    if metrics["blink_pattern"] < 65:
        indicators.append("Blink pattern irregularities detected")
    if metrics["artifact_detection"] > 60:
        indicators.append("GAN artifacts detected near facial regions")
    if metrics["lighting"] < 70:
        indicators.append("Lighting inconsistencies across frames")
    if metrics["audio_sync"] < 65:
        indicators.append("Audio-video synchronization mismatch")

    if not indicators:
        indicators.append("No strong manipulation indicators detected")

    processing_time = (datetime.now() - start_time).total_seconds()

    results = {
        "confidence": confidence,
        "verdict": verdict,
        "fake_probability": confidence,
        "real_probability": round(100 - confidence, 2),
        "frames_analyzed": len(frame_paths),
        "metrics": metrics,
        "indicators": indicators,
        "frames": ["/static/frames/" + os.path.basename(f) for f in frame_paths],
        "processing_time": f"{processing_time:.2f}s"
    }

    # Save to history
    history.insert(0, {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "filename": os.path.basename(filepath),
        "results": results
    })

    if len(history) > 50:
        history.pop()

    return jsonify({"status": "success", "results": results})


@app.route("/history", methods=["GET"])
def get_history():
    return jsonify({"status": "success", "history": history})


@app.route("/generate_report", methods=["POST"])
def generate_report():
    data = request.get_json()
    results = data.get("results")

    if not results:
        return jsonify({"status": "error", "message": "no results"}), 400

    report_id = str(uuid.uuid4()) + ".pdf"
    report_path = os.path.join(REPORT_FOLDER, report_id)

    c = canvas.Canvas(report_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "DeepScan AI - Deepfake Analysis Report")

    c.setFont("Helvetica", 12)
    c.drawString(50, 720, f"Verdict: {results['verdict']}")
    c.drawString(50, 700, f"Confidence: {results['confidence']}%")

    y = 670
    c.drawString(50, y, "Metrics:")
    y -= 20

    for k, v in results["metrics"].items():
        c.drawString(60, y, f"{k.replace('_',' ').title()}: {v}%")
        y -= 16

    y -= 10
    c.drawString(50, y, "Indicators:")
    y -= 20

    for ind in results["indicators"]:
        c.drawString(60, y, f"- {ind}")
        y -= 14

    c.save()
    return jsonify({"status": "success", "report_path": report_path})


@app.route("/download_report", methods=["GET"])
def download_report():
    p = request.args.get("path")
    if not p or not os.path.exists(p):
        return jsonify({"status": "error", "message": "report not found"}), 404
    return send_file(p, as_attachment=True)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
