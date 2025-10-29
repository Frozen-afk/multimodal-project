<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python">
  <img src="https://img.shields.io/badge/Flask-3.0-black?logo=flask">
  <img src="https://img.shields.io/badge/OpenAI%20CLIP-ViT%2FB32-green?logo=openai">
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat">
</p>

<h1 align="center">🧠 AI-Powered Multimodal Gallery Search</h1>

<p align="center">
  Search your <b>images and videos using natural language</b>.<br>
  Built for the <b>Multimodal AI Hackathon</b> using OpenAI CLIP + Flask.
</p>

---

## 🚀 Overview
**AI-Powered Multimodal Gallery Search** is a project developed for a **Multimodal AI Hackathon**.  
It allows users to **search their gallery of images and videos using natural text** — for example:  
_"dog playing in a park"_  
and it instantly returns all matching media, even if filenames don’t match.

This project connects **text, image, and video understanding** into a single intelligent system.
## 📂 Project Structure
ai_gallery_search/
│
├── app.py                    # Flask backend  
├── static/  
│   ├── css/  
│   │   └── style.css         # Frontend styling  
│   ├── js/  
│   │   └── script.js         # Frontend logic  
│   └── uploads/              # Uploaded media stored here  
└── templates/  
    └── index.html            # Main web interface  

---

## ⚙️ Installation and Setup

### 1️⃣ Clone the repository
git clone https://github.com/<your-username>/ai_gallery_search.git  
cd ai_gallery_search

### 2️⃣ Create and activate a virtual environment
python -m venv venv  
source venv/bin/activate        # On Windows: venv\Scripts\activate

### 3️⃣ Install dependencies
pip install -r requirements.txt

If you don’t have `requirements.txt`, create one with:
torch  
transformers  
flask  
pillow  
opencv-python  
numpy

### 4️⃣ Run the app
python app.py

Then open your browser and visit:
http://127.0.0.1:5000
## 💡 How It Works

1. **Upload Media:**  
   Users upload images or short videos to the gallery.

2. **Feature Extraction:**  
   Each image (and sampled video frame) is passed through the **CLIP model**, producing an **embedding vector** — a numerical representation of its content.

3. **Text Query:**  
   When you type something like “cat on sofa,” CLIP converts your text into a comparable vector.

4. **Similarity Matching:**  
   The app calculates **cosine similarity** between the text embedding and stored media embeddings to find the closest matches.

5. **Results:**  
   Matching media are displayed instantly on the webpage.

---

## 🧠 Model Used

| Component | Model | Description |
|------------|--------|-------------|
| **Image Encoder** | `openai/clip-vit-base-patch32` | Maps images into a shared vector space |
| **Text Encoder** | `openai/clip-vit-base-patch32` | Maps text queries into the same vector space |
| **Similarity Metric** | Cosine Similarity | Finds the nearest matches between image/video embeddings and text |
## 🎥 Video Search Logic
- Videos are split into frames using **OpenCV**.  
- Each frame is processed by the CLIP image encoder.  
- The embeddings are averaged to represent the entire video.  
- During search, both image and video embeddings are compared to the query.

---

## 🔮 Future Enhancements
1. **Automatic Caption Generation:** Integrate BLIP or LLaVA to auto-generate captions for all media.  
2. **Voice-Based Search:** Add speech-to-text for voice-based queries.  
3. **Vector Database Integration:** Use FAISS or Pinecone for scalable, fast vector searches.  
4. **Mobile App Version:** Extend to Android/iOS using Flutter.  
5. **Real-Time Camera Search:** Match live camera feeds to text descriptions.

---

## 🧩 Tech Stack
| Layer | Technology |
|--------|-------------|
| **Frontend** | HTML, CSS (Poppins), JavaScript |
| **Backend** | Python (Flask) |
| **AI Model** | OpenAI CLIP (ViT-B/32) |
| **Libraries** | Torch, Transformers, PIL, OpenCV, NumPy |
## 🏁 Hackathon Context
This project was built for a **Multimodal AI Hackathon**, focusing on integrating **multiple data modalities**:  
- Image  
- Video  
- Text  

It demonstrates how multimodal embeddings can make gallery search faster and more intuitive.

---

## 🖼️ Example Query
**Query:** _"dog running in a park"_  
**Output:** Displays all uploaded media where a dog appears in a park setting.

---

## 📜 License
This project is open-source and available under the **MIT License**.

---

## 📦 requirements.txt
flask==3.0.3  
torch==2.3.1  
torchvision==0.18.1  
transformers==4.44.2  
pillow==10.4.0  
opencv-python==4.10.0.84  
numpy==1.26.4
