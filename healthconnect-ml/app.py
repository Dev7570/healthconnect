"""
HealthConnect ML API Server
Flask microservice exposing prediction endpoints for Heart Disease, Breast Cancer, and Diabetes.
Runs on port 5001 alongside the Node.js backend (port 5000).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

# ── Load models at startup ────────────────────────────────────────────────────
print("🧠 Loading ML models...")
start = time.time()

from models.heart_model import HeartDiseaseModel
from models.cancer_model import BreastCancerModel
from models.diabetes_model import DiabetesModel

heart_model = HeartDiseaseModel()
cancer_model = BreastCancerModel()
diabetes_model = DiabetesModel()

elapsed = time.time() - start
print(f"✅ All models loaded in {elapsed:.1f}s\n")

MODEL_MAP = {
    "heart": heart_model,
    "cancer": cancer_model,
    "diabetes": diabetes_model,
}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    """Health check — shows server status and model info."""
    return jsonify({
        "status": "running",
        "service": "HealthConnect ML API",
        "models_loaded": list(MODEL_MAP.keys()),
        "message": "🧠 ML Prediction Server is ready!",
    })


@app.route("/models", methods=["GET"])
def list_models():
    """List all available models with their feature info."""
    models_info = {}
    for key, model in MODEL_MAP.items():
        models_info[key] = model.get_info()
    return jsonify({"success": True, "models": models_info})


@app.route("/predict/<disease>", methods=["POST"])
def predict(disease):
    """
    Predict disease risk.
    URL: POST /predict/heart | /predict/cancer | /predict/diabetes
    Body: JSON with feature values, e.g. {"age": 55, "sex": 1, ...}
    """
    if disease not in MODEL_MAP:
        return jsonify({
            "success": False,
            "error": f"Unknown model '{disease}'. Available: {list(MODEL_MAP.keys())}"
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No JSON body provided"}), 400

    try:
        model = MODEL_MAP[disease]
        result = model.predict(data)
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 55)
    print("  🧠  HealthConnect ML API Server")
    print("=" * 55)
    print(f"  Models : Heart Disease, Breast Cancer, Diabetes")
    print(f"  Port   : 5001")
    print(f"  Endpoints:")
    print(f"    GET  /           — Health check")
    print(f"    GET  /models     — List models + features")
    print(f"    POST /predict/heart    — Heart disease prediction")
    print(f"    POST /predict/cancer   — Breast cancer prediction")
    print(f"    POST /predict/diabetes — Diabetes prediction")
    print("=" * 55)
    app.run(host="0.0.0.0", port=5001, debug=False)
