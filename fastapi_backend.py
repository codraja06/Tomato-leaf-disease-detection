import os
import io
import numpy as np
import tensorflow as tf
from PIL import Image
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DISEASE_METADATA = {
    "Bacterial Spot": {
        "product": "Copper-based fungicides",
        "treatment": "Remove infected leaves immediately. Spray copper fungicide every 7-10 days. Avoid watering the leaves and water only at the base of the plant.",
        "product_url": "https://www.amazon.com/s?k=Copper+fungicide+for+tomatoes"
    },
    "Early Blight": {
        "product": "Chlorothalonil or Mancozeb",
        "treatment": "Remove affected leaves and dispose of them away from the garden. Spray fungicide every week. Keep mulch around the plant to prevent disease spread from soil.",
        "product_url": "https://www.amazon.com/s?k=Chlorothalonil+fungicide"
    },
    "Late Blight": {
        "product": "Ridomil Gold or Copper Fungicide",
        "treatment": "Remove heavily infected plants immediately to stop the spread. Spray recommended fungicide and avoid overhead watering. Ensure good airflow between plants.",
        "product_url": "https://www.amazon.com/s?k=Ridomil+Gold+fungicide"
    },
    "Leaf Mold": {
        "product": "Calcium-based sprays",
        "treatment": "Remove infected leaves and improve ventilation around plants. Reduce humidity and spray calcium-based products as recommended.",
        "product_url": "https://www.amazon.com/s?k=Calcium+spray+for+plants"
    },
    "Septoria Leaf Spot": {
        "product": "Fungicides containing chlorothalonil",
        "treatment": "Remove infected lower leaves. Apply fungicide every 7-10 days and avoid wetting the foliage while watering.",
        "product_url": "https://www.amazon.com/s?k=Septoria+fungicide"
    },
    "Spider Mites (Two-spotted Spider Mite)": {
        "product": "Neem oil or Insecticidal soap",
        "treatment": "Spray neem oil or insecticidal soap on both sides of the leaves. Repeat every 5-7 days until mites are controlled.",
        "product_url": "https://www.amazon.com/s?k=Neem+oil+for+plants"
    },
    "Target Spot": {
        "product": "Azoxystrobin or Chlorothalonil",
        "treatment": "Remove infected leaves and apply fungicide according to label instructions. Maintain proper spacing between plants for airflow.",
        "product_url": "https://www.amazon.com/s?k=Azoxystrobin+fungicide"
    },
    "Yellow Leaf Curl Virus": {
        "product": "Imidacloprid (for whitefly control)",
        "treatment": "Remove severely infected plants. Control whiteflies using insecticide or yellow sticky traps to prevent further spread.",
        "product_url": "https://www.amazon.com/s?k=Imidacloprid+insecticide"
    },
    "Mosaic Virus": {
        "product": "No chemical cure",
        "treatment": "Remove infected plants immediately. Disinfect gardening tools and control aphids to prevent the virus from spreading to healthy plants.",
        "product_url": "https://www.amazon.com/s?k=Aphid+control+organic"
    },
    "Healthy": {
        "product": "General purpose organic fertilizer",
        "treatment": "Continue regular watering, provide sufficient sunlight, and apply organic fertilizer every 2-3 weeks to maintain healthy growth.",
        "product_url": "https://www.amazon.com/s?k=Organic+tomato+fertilizer"
    }
}

CLASS_NAMES = list(DISEASE_METADATA.keys())


ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


MODEL_PATH = os.environ.get("MODEL_PATH", "tomato_densenet_model.h5")
model = None
model_status = "not_loaded"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the Keras model at startup; release resources at shutdown."""
    global model, model_status
    if os.path.exists(MODEL_PATH):
        try:
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            model_status = "loaded"
            print(f"[TomatoGuard] Model '{MODEL_PATH}' loaded successfully.")
        except Exception as e:
            model_status = "error"
            print(f"[TomatoGuard] ERROR loading model: {e}")
            print("[TomatoGuard] Falling back to mock predictions.")
    else:
        model_status = "not_found"
        print(f"[TomatoGuard] WARNING: '{MODEL_PATH}' not found. Using mock predictions.")
    yield
    # Shutdown: release model memory
    model = None



app = FastAPI(
    title="TomatoGuard – Tomato Leaf Disease Detector API",
    version="1.0.0",
    description="Predicts tomato leaf diseases using a DenseNet CNN model.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a normalised (1, 224, 224, 3) float32 tensor."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)



@app.get("/", summary="Health check")
def read_root():
    return {
        "status": "Tomato Leaf Disease System is running",
        "model_status": model_status,
        "model_path": MODEL_PATH,
    }


@app.get("/health", summary="Detailed health check")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_status": model_status,
        "class_count": len(CLASS_NAMES),
    }


@app.post("/predict", summary="Predict disease from leaf image")
async def predict(file: UploadFile = File(...)):
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpeg/png/webp).")

    
    try:
        data = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {e}")

    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )

    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        if model is None:
            
            disease_name = "Healthy"
            confidence = 0.50   
            is_mock = True
        else:
            processed = preprocess_image(data)
            predictions = model.predict(processed, verbose=0)
            index = int(np.argmax(predictions[0]))
            disease_name = CLASS_NAMES[index] if index < len(CLASS_NAMES) else "Healthy"
            confidence = float(predictions[0][index])
            is_mock = False

        metadata = DISEASE_METADATA.get(disease_name, DISEASE_METADATA["Healthy"])

        return {
            "disease_name": disease_name,
            "confidence_score": confidence,
            "recommended_product": metadata["product"],
            "natural_treatment": metadata["treatment"],
            "product_url": metadata.get("product_url", ""),
            "is_mock": is_mock,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")



if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
