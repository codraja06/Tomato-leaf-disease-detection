
import sys
import io
import json
import base64
import time
import urllib.request
import urllib.error

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    print("[TEST] GET /")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/", timeout=5)
        data = json.loads(req.read())
        print("   Status:", req.status)
        print("   Response:", data)
        assert "status" in data, "Missing 'status' in response"
        print("   PASS")
        return True
    except Exception as e:
        print("   FAIL:", e)
        return False

def create_minimal_jpeg():
    """Create a minimal valid JPEG as base64 for testing"""
    
    from PIL import Image
    import io as _io
    img = Image.new("RGB", (224, 224), color=(100, 180, 100))
    buf = _io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()

def test_predict_healthy():
    print("[TEST] POST /predict - valid green leaf image")
    try:
        from PIL import Image
        import io as _io
        img = Image.new("RGB", (224, 224), color=(50, 160, 50))  
        buf = _io.BytesIO()
        img.save(buf, format="JPEG")
        image_bytes = buf.getvalue()
        
        import urllib.parse
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="leaf.jpg"\r\n'
            f"Content-Type: image/jpeg\r\n\r\n"
        ).encode("utf-8") + image_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
        
        req = urllib.request.Request(
            f"{BASE_URL}/predict",
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}"
            },
            method="POST"
        )
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        print("   Status:", resp.status)
        print("   Response:", data)
        assert "disease_name" in data, "Missing disease_name"
        assert "confidence_score" in data, "Missing confidence_score"
        assert 0 <= data["confidence_score"] <= 1, "confidence_score out of range"
        print("   disease_name:", data["disease_name"])
        print("   confidence_score:", round(data["confidence_score"] * 100, 1), "%")
        print("   PASS")
        return True
    except Exception as e:
        print("   FAIL:", e)
        return False

def test_predict_invalid_file():
    print("[TEST] POST /predict - invalid non-image file")
    try:
        boundary = "----TestBoundary"
        text_bytes = b"this is not an image"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n'
            f"Content-Type: text/plain\r\n\r\n"
        ).encode("utf-8") + text_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
        
        req = urllib.request.Request(
            f"{BASE_URL}/predict",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST"
        )
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            print("   FAIL: Should have returned 400 for non-image file")
            return False
        except urllib.error.HTTPError as he:
            if he.code == 400:
                print("   Status: 400 - Correctly rejected non-image")
                print("   PASS")
                return True
            else:
                print("   FAIL: Expected 400, got", he.code)
                return False
    except Exception as e:
        print("   FAIL:", e)
        return False

print("=== FASTAPI BACKEND INTEGRATION TEST ===")
print("Target:", BASE_URL)
print()

results = {}
results["root"] = test_root()
print()
results["predict_healthy"] = test_predict_healthy()
print()
results["predict_invalid"] = test_predict_invalid_file()

print()
print("=== SUMMARY ===")
passed = sum(1 for v in results.values() if v)
total = len(results)
print(f"Passed: {passed}/{total}")
for name, ok in results.items():
    print("  ", name, "- PASS" if ok else "FAIL")
