import os
import torch
from PIL import Image
import numpy as np
from flask import Flask, render_template, request, jsonify, send_from_directory
from transformers import CLIPProcessor, CLIPModel
import cv2

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")

# Folder for uploads
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load CLIP model
print("🚀 Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print(f"✅ Model loaded on device: {device}")

# Store embeddings and filenames
file_embeddings = {}
file_paths = {}

# ========== Helper Functions ==========

def get_image_embedding(img_path):
    """Return CLIP embedding for a single image"""
    try:
        image = Image.open(img_path).convert("RGB")
        inputs = processor(images=image, return_tensors="pt").to(device)
        with torch.no_grad():
            emb = model.get_image_features(**inputs)
        emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
        return emb.cpu()
    except Exception as e:
        print(f"⚠️ Image embedding error for {img_path}: {e}")
        return None

def get_video_embedding(video_path, max_frames=8):
    """Return average CLIP embedding for sampled video frames"""
    try:
        cap = cv2.VideoCapture(video_path)
        frames = []
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        for i in np.linspace(0, total_frames - 1, max_frames, dtype=int):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            if not ret:
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_img = Image.fromarray(frame)
            frames.append(frame_img)
        cap.release()

        if not frames:
            print(f"⚠️ No frames extracted from {video_path}")
            return None

        inputs = processor(images=frames, return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            emb = model.get_image_features(**inputs)
        emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
        avg_emb = emb.mean(dim=0, keepdim=True).cpu()
        return avg_emb
    except Exception as e:
        print(f"⚠️ Video embedding error for {video_path}: {e}")
        return None

def get_text_embedding(text):
    """Return CLIP embedding for a search text"""
    try:
        inputs = processor(text=[text], return_tensors="pt", padding=True).to(device)
        with torch.no_grad():
            emb = model.get_text_features(**inputs)
        emb = emb / emb.norm(p=2, dim=-1, keepdim=True)
        return emb.cpu()
    except Exception as e:
        print(f"⚠️ Text embedding error: {e}")
        return None

# ========== Routes ==========

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_files():
    """Handle file uploads"""
    files = request.files.getlist("file")
    if not files:
        print("⚠️ No files received")
        return jsonify({"message": "No files uploaded"}), 400

    uploaded_files = []
    for file in files:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        uploaded_files.append(file.filename)
        print(f"📸 Saved file: {file.filename}")

        ext = os.path.splitext(file.filename)[1].lower()
        emb = None
        if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
            emb = get_image_embedding(filepath)
        elif ext in [".mp4", ".avi", ".mov", ".mkv"]:
            emb = get_video_embedding(filepath)
        else:
            print(f"⚠️ Unsupported file type: {ext}")
            continue

        if emb is not None:
            file_embeddings[file.filename] = emb
            file_paths[file.filename] = filepath
            print(f"✅ Embedded: {file.filename}")
        else:
            print(f"⚠️ Skipped embedding for {file.filename}")

    return jsonify({"message": f"Uploaded and processed {len(uploaded_files)} files."})

@app.route("/search", methods=["POST"])
def search():
    """Perform text search against stored embeddings"""
    data = request.get_json()
    query = data.get("query", "")
    print(f"🔍 Received query: {query}")

    if not query:
        return jsonify({"matches": []})

    text_emb = get_text_embedding(query)
    if text_emb is None or not file_embeddings:
        print("⚠️ No embeddings or text feature unavailable")
        return jsonify({"matches": []})

    similarities = []
    for fname, emb in file_embeddings.items():
        sim = torch.nn.functional.cosine_similarity(text_emb, emb).item()
        similarities.append((fname, sim))

    similarities.sort(key=lambda x: x[1], reverse=True)
    top_matches = similarities[:5]
    print(f"🏁 Top matches: {top_matches}")

    matches = [{"filename": f, "similarity": float(s)} for f, s in top_matches if s > 0.1]
    return jsonify({"matches": matches})

@app.route("/uploads/<filename>")
def serve_upload(filename):
    """Serve uploaded files"""
    return send_from_directory(UPLOAD_FOLDER, filename)

# ========== Run App ==========
if __name__ == "__main__":
    print("🔥 Flask app running at http://127.0.0.1:5000")
    app.run(debug=True)
