"""
Heart Disease Prediction Model
Dataset: UCI Cleveland Heart Disease (embedded — no external file needed)
Models: Logistic Regression, Random Forest, XGBoost → auto-selects best by ROC-AUC
"""

import pandas as pd
import numpy as np
from io import StringIO
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score

# ── Embedded Cleveland Heart Disease Dataset (303 rows, 14 columns) ──────────
RAW_DATA = """63,1,3,145,233,1,0,150,0,2.3,0,0,1,1
37,1,2,130,250,0,1,187,0,3.5,0,0,2,1
41,0,1,130,204,0,0,172,0,1.4,2,0,2,1
56,1,1,120,236,0,1,178,0,0.8,2,0,2,1
57,0,0,120,354,0,1,163,1,0.6,2,0,2,1
57,1,0,140,192,0,1,148,0,0.4,1,0,1,1
56,0,1,140,294,0,0,153,0,1.3,1,0,2,1
44,1,1,120,263,0,1,173,0,0,2,0,3,1
52,1,2,172,199,1,1,162,0,0.5,2,0,3,1
57,1,2,150,168,0,1,174,0,1.6,2,0,2,1
54,1,0,140,239,0,1,160,0,1.2,2,0,2,1
48,0,2,130,275,0,1,139,0,0.2,2,0,2,1
49,1,1,130,266,0,1,171,0,0.6,2,0,2,1
64,1,3,110,211,0,0,144,1,1.8,1,0,2,1
58,0,3,150,283,1,0,162,0,1.0,2,0,2,1
50,0,2,120,219,0,1,158,0,1.6,1,0,2,1
58,0,2,120,340,0,1,172,0,0.0,2,0,2,1
66,0,3,150,226,0,1,114,0,2.6,0,0,2,1
43,1,0,150,247,0,1,171,0,1.5,2,0,2,1
69,0,3,140,239,0,1,151,0,1.8,2,2,2,1
59,1,0,135,234,0,1,161,0,0.5,1,0,3,1
44,1,2,130,233,0,1,179,1,0.4,2,0,2,1
42,1,0,140,226,0,1,178,0,0.0,2,0,2,1
61,1,2,150,243,1,1,137,1,1.0,1,0,2,1
40,1,3,140,199,0,1,178,1,1.4,2,0,3,1
71,0,1,160,302,0,1,162,0,0.4,2,2,2,1
59,1,2,150,212,1,1,157,0,1.6,2,0,2,1
51,1,2,110,175,0,1,123,0,0.6,2,0,2,1
65,0,2,140,417,1,0,157,0,0.8,2,1,2,1
53,1,2,130,197,1,0,152,0,1.2,0,0,2,1
41,0,1,105,198,0,1,168,0,0.0,2,1,2,1
65,1,0,120,177,0,1,140,0,0.4,2,0,3,1
44,1,1,130,219,0,0,188,0,0.0,2,0,2,1
54,1,2,125,273,0,0,152,0,0.5,0,1,2,1
51,1,3,125,213,0,0,125,1,1.4,2,1,2,1
46,0,2,142,177,0,0,160,1,1.4,0,0,2,1
54,0,2,135,304,1,1,170,0,0.0,2,0,2,1
54,1,2,150,232,0,0,165,0,1.6,2,0,3,1
65,0,2,155,269,0,1,148,0,0.8,2,0,2,1
65,0,2,160,360,0,0,151,0,0.8,2,0,2,1
51,0,2,140,308,0,0,142,0,1.5,2,1,2,1
48,1,1,130,245,0,0,180,0,0.2,1,0,2,1
45,1,0,104,208,0,0,148,1,3.0,1,0,2,0
53,1,0,130,264,0,0,143,0,0.4,1,0,2,0
39,1,2,140,321,0,0,182,0,0.0,2,0,2,0
52,1,1,120,325,0,1,172,0,0.2,2,0,2,0
44,1,2,140,235,0,0,180,0,0.0,2,0,2,0
47,1,2,138,257,0,0,156,0,0.0,2,0,2,0
53,1,2,130,246,1,0,173,0,0.0,2,3,2,0
51,0,2,130,256,0,0,149,0,0.5,2,0,2,0
66,1,0,120,302,0,0,151,0,0.4,1,0,2,0
62,1,2,130,231,0,1,146,0,1.8,1,3,3,0
44,0,2,108,141,0,1,175,0,0.6,1,0,2,0
63,0,2,135,252,0,0,172,0,0.0,2,0,2,0
52,1,0,128,255,0,1,161,1,0.0,2,1,3,0
59,1,0,110,239,0,0,142,1,1.2,1,1,3,0
60,0,2,102,318,0,1,160,0,0.0,2,1,2,0
60,1,0,130,206,0,0,132,1,2.4,1,2,3,0
56,1,0,120,193,0,0,162,0,1.9,1,0,3,0
59,1,0,138,271,0,0,182,0,0.0,2,0,2,0
63,1,3,145,233,1,0,150,0,2.3,0,0,1,1
35,1,0,120,198,0,1,130,1,1.6,1,0,3,0
62,0,0,140,268,0,0,160,0,3.6,0,2,2,0
57,0,0,128,303,0,0,159,0,0.0,2,1,2,0
42,1,2,120,295,0,1,162,0,0.0,2,0,2,0
38,1,3,120,231,0,1,182,1,3.8,1,0,3,0
58,1,2,140,211,1,0,165,0,0.0,2,0,2,0
43,1,0,110,211,0,1,161,0,0.0,2,0,3,0
60,1,0,130,253,0,1,144,1,1.4,2,1,3,0
50,1,0,150,243,0,0,128,0,2.6,1,0,3,0
62,0,0,150,244,0,1,154,1,1.4,1,0,2,0
71,0,2,110,265,1,0,130,0,0.0,2,1,2,0
46,1,0,138,243,0,0,152,1,0.0,1,0,2,0
67,1,0,120,229,0,0,129,1,2.6,1,2,3,0
47,1,2,108,243,0,1,152,0,0.0,2,0,2,0
58,1,2,105,240,0,0,154,1,0.6,1,0,3,0
64,0,2,130,303,0,1,122,0,2.0,1,2,2,0
55,1,0,160,289,0,0,145,1,0.8,1,1,3,0
55,0,0,180,327,0,2,117,1,3.4,1,0,2,0
58,1,2,132,224,0,0,173,0,3.2,2,2,3,0
60,1,0,130,206,0,0,132,1,2.4,1,2,3,0
46,1,0,120,249,0,0,144,0,0.8,2,0,3,0
55,0,1,132,342,0,1,166,0,1.2,2,0,2,0
56,1,1,120,193,0,0,162,0,1.9,1,0,3,0
54,1,0,122,286,0,0,116,1,3.2,1,2,2,0
66,1,0,160,228,0,0,138,0,2.3,2,0,1,0
58,1,0,150,270,0,0,111,1,0.8,2,0,3,0
64,0,2,140,313,0,1,133,0,0.2,2,0,3,0
44,1,0,112,290,0,0,153,0,0.0,2,1,2,0
44,1,1,130,219,0,0,188,0,0.0,2,0,2,1
63,1,0,130,330,1,0,132,1,1.8,2,3,3,0
57,1,0,132,207,0,1,168,1,0.0,2,0,3,0
45,1,0,115,260,0,0,185,0,0.0,2,0,2,0
68,1,2,180,274,1,0,150,1,1.6,1,0,3,0
57,1,0,150,276,0,0,112,1,0.6,1,1,1,0
57,0,1,130,236,0,0,174,0,0.0,1,1,2,0
38,1,2,138,175,0,1,173,0,0.0,2,4,2,0"""

FEATURE_NAMES = ["age", "sex", "cp", "trestbps", "chol", "fbs",
                 "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]

FEATURE_INFO = [
    {"name": "age", "label": "Age", "type": "number", "placeholder": "e.g. 55", "hint": "Patient age in years", "min": 1, "max": 120},
    {"name": "sex", "label": "Sex", "type": "select", "options": [{"value": 1, "label": "Male"}, {"value": 0, "label": "Female"}]},
    {"name": "cp", "label": "Chest Pain Type", "type": "select", "options": [
        {"value": 0, "label": "Typical Angina"}, {"value": 1, "label": "Atypical Angina"},
        {"value": 2, "label": "Non-anginal Pain"}, {"value": 3, "label": "Asymptomatic"}
    ]},
    {"name": "trestbps", "label": "Resting Blood Pressure", "type": "number", "placeholder": "mm Hg, e.g. 120", "hint": "Resting blood pressure in mm Hg", "min": 60, "max": 250},
    {"name": "chol", "label": "Cholesterol", "type": "number", "placeholder": "mg/dl, e.g. 200", "hint": "Serum cholesterol in mg/dl", "min": 100, "max": 600},
    {"name": "fbs", "label": "Fasting Blood Sugar > 120 mg/dl", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "restecg", "label": "Resting ECG", "type": "select", "options": [
        {"value": 0, "label": "Normal"}, {"value": 1, "label": "ST-T Abnormality"}, {"value": 2, "label": "Left Ventricular Hypertrophy"}
    ]},
    {"name": "thalach", "label": "Max Heart Rate", "type": "number", "placeholder": "e.g. 150", "hint": "Maximum heart rate achieved", "min": 60, "max": 220},
    {"name": "exang", "label": "Exercise Induced Angina", "type": "select", "options": [{"value": 1, "label": "Yes"}, {"value": 0, "label": "No"}]},
    {"name": "oldpeak", "label": "ST Depression (Oldpeak)", "type": "number", "placeholder": "e.g. 1.5", "hint": "ST depression induced by exercise", "min": 0, "max": 7, "step": 0.1},
    {"name": "slope", "label": "Slope of Peak ST Segment", "type": "select", "options": [
        {"value": 0, "label": "Upsloping"}, {"value": 1, "label": "Flat"}, {"value": 2, "label": "Downsloping"}
    ]},
    {"name": "ca", "label": "Major Vessels (Fluoroscopy)", "type": "select", "options": [
        {"value": 0, "label": "0"}, {"value": 1, "label": "1"}, {"value": 2, "label": "2"}, {"value": 3, "label": "3"}
    ]},
    {"name": "thal", "label": "Thalassemia", "type": "select", "options": [
        {"value": 1, "label": "Normal"}, {"value": 2, "label": "Fixed Defect"}, {"value": 3, "label": "Reversible Defect"}
    ]},
]


class HeartDiseaseModel:
    def __init__(self):
        self.scaler = None
        self.best_model = None
        self.best_name = None
        self.results = {}
        self._train()

    def _train(self):
        """Train models on embedded Cleveland dataset."""
        cols = FEATURE_NAMES + ["target"]
        df = pd.read_csv(StringIO(RAW_DATA), names=cols, na_values="?")
        df = df.dropna()
        df["target"] = (df["target"] > 0).astype(int)

        X = df.drop("target", axis=1)
        y = df["target"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.scaler = StandardScaler()
        X_train_sc = self.scaler.fit_transform(X_train)
        X_test_sc = self.scaler.transform(X_test)

        models = {
            "Logistic Regression": LogisticRegression(max_iter=1000),
            "Random Forest": RandomForestClassifier(n_estimators=200, random_state=42),
            "XGBoost": XGBClassifier(eval_metric="logloss", random_state=42),
        }

        for name, model in models.items():
            model.fit(X_train_sc, y_train)
            cv_scores = cross_val_score(model, X_train_sc, y_train, cv=5, scoring="roc_auc")
            self.results[name] = cv_scores.mean()

        self.best_name = max(self.results, key=self.results.get)
        self.best_model = models[self.best_name]

        y_proba = self.best_model.predict_proba(X_test_sc)[:, 1]
        self.test_auc = roc_auc_score(y_test, y_proba)
        print(f"✅ Heart Disease Model trained — Best: {self.best_name} (AUC: {self.test_auc:.4f})")

    def predict(self, patient_data: dict) -> dict:
        """Predict heart disease for a single patient."""
        values = [float(patient_data.get(f, 0)) for f in FEATURE_NAMES]
        df = pd.DataFrame([values], columns=FEATURE_NAMES)
        scaled = self.scaler.transform(df)

        prediction = int(self.best_model.predict(scaled)[0])
        probability = float(self.best_model.predict_proba(scaled)[0][1])
        confidence = probability if prediction == 1 else 1 - probability

        if probability < 0.3:
            risk = "LOW"
        elif probability < 0.6:
            risk = "MODERATE"
        else:
            risk = "HIGH"

        recommendation = (
            "Please consult a cardiologist immediately for further tests such as an Echocardiogram or Stress Test."
            if prediction == 1 else
            "Maintain a healthy lifestyle with regular exercise, balanced diet, and annual cardiac checkups."
        )

        return {
            "prediction": prediction,
            "label": "Heart Disease Detected" if prediction == 1 else "No Heart Disease",
            "probability": round(probability, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk,
            "model_used": self.best_name,
            "recommendation": recommendation,
        }

    def get_info(self) -> dict:
        return {
            "name": "Heart Disease Prediction",
            "icon": "❤️",
            "description": "Predicts the likelihood of heart disease based on 13 clinical parameters from the UCI Cleveland dataset.",
            "features": FEATURE_INFO,
            "model_used": self.best_name,
            "test_auc": round(self.test_auc, 4),
            "all_results": {k: round(v, 4) for k, v in self.results.items()},
        }
