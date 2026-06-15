
import os
import sys
import io
import time
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=== ML MODEL VALIDATION SCRIPT ===")
print("Python:", sys.version)


print("\n[1] Importing TensorFlow...")
import tensorflow as tf
print("OK: TensorFlow", tf.__version__, "loaded")


MODEL_PATH = "tomato_densenet_model.h5"
print("\n[2] Checking model file:", MODEL_PATH)
if not os.path.exists(MODEL_PATH):
    print("FAIL: Model file NOT FOUND")
    sys.exit(1)
size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
print("OK: Model file found:", round(size_mb, 1), "MB")

print("\n[3] Loading model...")
model = None
load_errors = []


try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("OK: Loaded with standard loader")
except Exception as e:
    load_errors.append("Standard: " + str(e)[:120])
    print("   Standard load failed:", str(e)[:120])


if model is None:
    try:
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        print("OK: Loaded with compile=False")
    except Exception as e:
        load_errors.append("compile=False: " + str(e)[:120])
        print("   compile=False failed:", str(e)[:120])


if model is None:
    try:
        import h5py
        print("   Attempting h5py metadata inspection...")
        with h5py.File(MODEL_PATH, 'r') as f:
            print("   H5 file keys:", list(f.keys()))
            if 'model_config' in f.attrs:
                import json
                config_str = f.attrs['model_config']
                if isinstance(config_str, bytes):
                    config_str = config_str.decode('utf-8')
                config = json.loads(config_str)
                print("   Model class_name:", config.get('class_name', 'unknown'))
            if 'keras_version' in f.attrs:
                print("   Keras version (saved with):", f.attrs['keras_version'])
            if 'backend' in f.attrs:
                print("   Backend (saved with):", f.attrs['backend'])
    except Exception as e:
        print("   h5py inspection failed:", e)


if model is None:
    try:
       
        from keras import layers as keras_layers
        orig_init = keras_layers.Conv2D.__init__
        
        def patched_init(self, *args, **kwargs):
            name = kwargs.get('name', '')
            if name and '/' in name:
                kwargs['name'] = name.replace('/', '_')
            orig_init(self, *args, **kwargs)
        
        keras_layers.Conv2D.__init__ = patched_init
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        keras_layers.Conv2D.__init__ = orig_init
        print("OK: Loaded with name-patching workaround")
    except Exception as e:
        load_errors.append("Name-patch: " + str(e)[:120])
        print("   Name-patching failed:", str(e)[:120])
        try:
            keras_layers.Conv2D.__init__ = orig_init
        except:
            pass


if model is None:
    print("\nFAIL: All model loading attempts failed!")
    print("\nDiagnosis:")
    print("  The model was saved with TensorFlow 1.x or early TF 2.x which allowed")
    print("  '/' characters in layer names (e.g., 'conv1/conv').")
    print("  TensorFlow 2.21.0 enforces strict layer naming and rejects '/' in names.")
    print("\nLoad errors encountered:")
    for err in load_errors:
        print("  -", err)
    print("\nFix Required:")
    print("  Option A (Recommended): Retrain/resave the model with TF 2.x compatible naming")
    print("  Option B: Install tensorflow 2.12 or earlier: pip install tensorflow==2.12.0")
    print("  Option C: Convert model using h5py to rename layers then load weights")
    print("\nFor the backend (fastapi_backend.py):")
    print("  The model CANNOT be loaded with TF 2.21. The 'mock prediction' fallback")
    print("  (returning 'Healthy' with 0.95 confidence) will be triggered instead.")
    print("  This means the Python FastAPI backend will NOT provide real AI predictions.")
    sys.exit(2)


print("\n[4] Model architecture:")
input_shape = model.input_shape
output_shape = model.output_shape
num_classes = output_shape[-1]
print("   Input shape: ", input_shape)
print("   Output shape:", output_shape)
print("   Output classes:", num_classes)

DISEASE_METADATA_KEYS = [
    "Bacterial Spot", "Early Blight", "Late Blight", "Leaf Mold",
    "Septoria Leaf Spot", "Spider Mites (Two-spotted Spider Mite)",
    "Target Spot", "Yellow Leaf Curl Virus", "Mosaic Virus", "Healthy"
]

print("\n[5] CLASS_NAMES alignment:")
print("   metadata keys:", len(DISEASE_METADATA_KEYS), "| model classes:", num_classes)
if num_classes == len(DISEASE_METADATA_KEYS):
    print("OK: Perfect class alignment")
else:
    print("WARNING: Mismatch - class count differs by", abs(num_classes - len(DISEASE_METADATA_KEYS)))


def run_inference(name, img_array):
    try:
        tensor = np.expand_dims(img_array, axis=0)
        t0 = time.time()
        preds = model.predict(tensor, verbose=0)
        elapsed = (time.time() - t0) * 1000
        idx = int(np.argmax(preds[0]))
        conf = float(preds[0][idx])
        label = DISEASE_METADATA_KEYS[idx] if idx < len(DISEASE_METADATA_KEYS) else "UNKNOWN_CLASS_" + str(idx)
        print("   ", name, "->", label, "(", round(conf * 100, 1), "%) in", round(elapsed, 1), "ms")
        return True
    except Exception as e:
        print("   FAIL:", name, "-", e)
        return False

print("\n[6] Inference tests:")
g = np.zeros((224, 224, 3), np.float32); g[:,:,1] = 0.5; g[:,:,0] = 0.1
run_inference("Green leaf (Healthy expected)", g)

s = np.zeros((224, 224, 3), np.float32); s[:,:,1]=0.4; s[50:80,50:80]=0.05; s[20:60,150:200,0]=0.7; s[20:60,150:200,1]=0.6
run_inference("Spotted leaf (Disease expected)", s)

run_inference("All-black edge case", np.zeros((224,224,3), np.float32))
run_inference("All-white edge case", np.ones((224,224,3), np.float32))

print("\n[7] Performance benchmark (5 runs):")
times = []
for _ in range(5):
    img = np.random.rand(1, 224, 224, 3).astype(np.float32)
    t0 = time.time()
    model.predict(img, verbose=0)
    times.append((time.time() - t0) * 1000)
print("   Average:", round(float(np.mean(times)), 1), "ms | Min:", round(min(times), 1), "| Max:", round(max(times), 1))

print("\n=== ML VALIDATION COMPLETE ===")
