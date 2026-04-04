"""
Diabetes Prediction Model
Dataset: Pima Indians Diabetes (embedded — fixed typos from original notebook)
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

FEATURE_NAMES = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
                 "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"]

FEATURE_INFO = [
    {"name": "Pregnancies", "label": "Pregnancies", "type": "number", "placeholder": "e.g. 2", "hint": "Number of times pregnant", "min": 0, "max": 20},
    {"name": "Glucose", "label": "Glucose Level", "type": "number", "placeholder": "mg/dL, e.g. 120", "hint": "Plasma glucose concentration (2 hours oral glucose tolerance test)", "min": 0, "max": 300},
    {"name": "BloodPressure", "label": "Blood Pressure", "type": "number", "placeholder": "mm Hg, e.g. 70", "hint": "Diastolic blood pressure in mm Hg", "min": 0, "max": 200},
    {"name": "SkinThickness", "label": "Skin Thickness", "type": "number", "placeholder": "mm, e.g. 20", "hint": "Triceps skin fold thickness in mm", "min": 0, "max": 100},
    {"name": "Insulin", "label": "Insulin Level", "type": "number", "placeholder": "IU/mL, e.g. 80", "hint": "2-Hour serum insulin (mu U/ml)", "min": 0, "max": 900},
    {"name": "BMI", "label": "BMI", "type": "number", "placeholder": "e.g. 25.5", "hint": "Body mass index (weight in kg / height in m²)", "min": 0, "max": 70, "step": 0.1},
    {"name": "DiabetesPedigreeFunction", "label": "Diabetes Pedigree Function", "type": "number", "placeholder": "e.g. 0.5", "hint": "Genetic diabetes predisposition score", "min": 0, "max": 3, "step": 0.001},
    {"name": "Age", "label": "Age", "type": "number", "placeholder": "e.g. 33", "hint": "Patient age in years", "min": 1, "max": 120},
]

# ── Embedded Pima Indians Diabetes Dataset ────────────────────────────────────
# Fixed: removed `0.hamburg` typo from original notebook (row was dropped)
RAW_DATA = """6,148,72,35,0,33.6,0.627,50,1
1,85,66,29,0,26.6,0.351,31,0
8,183,64,0,0,23.3,0.672,32,1
1,89,66,23,94,28.1,0.167,21,0
0,137,40,35,168,43.1,2.288,33,1
5,116,74,0,0,25.6,0.201,30,0
3,78,50,32,88,31.0,0.248,26,1
10,115,0,0,0,35.3,0.134,29,0
2,197,70,45,543,30.5,0.158,53,1
8,125,96,0,0,0.0,0.232,54,1
4,110,92,0,0,37.6,0.191,30,0
10,168,74,0,0,38.0,0.537,34,1
10,139,80,0,0,27.1,1.441,57,0
1,189,60,23,846,30.1,0.398,59,1
5,166,72,19,175,25.8,0.587,51,1
7,100,0,0,0,30.0,0.484,32,1
0,118,84,47,230,45.8,0.551,31,1
7,107,74,0,0,29.6,0.254,31,1
1,103,30,38,83,43.3,0.183,33,0
1,115,70,30,96,34.6,0.529,32,1
3,126,88,41,235,39.3,0.704,27,0
8,99,84,0,0,35.4,0.388,50,0
7,196,90,0,0,39.8,0.451,41,1
9,119,80,35,0,29.0,0.263,29,1
11,143,94,33,146,36.6,0.254,51,1
10,125,70,26,115,31.1,0.205,41,1
7,147,76,0,0,39.4,0.257,43,1
1,97,66,15,140,23.2,0.487,22,0
13,145,82,19,110,22.2,0.245,57,0
5,117,92,0,0,34.1,0.337,38,0
5,109,75,26,0,36.0,0.546,60,0
3,158,76,36,245,31.6,0.851,28,1
3,88,58,11,54,24.8,0.267,22,0
6,92,92,0,0,19.9,0.188,28,0
10,122,78,31,0,27.6,0.512,45,0
4,103,60,33,192,24.0,0.966,33,0
11,138,76,0,0,33.2,0.420,35,0
9,102,76,37,0,32.9,0.665,46,1
2,90,68,42,0,38.2,0.503,27,1
4,111,72,47,207,37.1,1.390,56,1
3,180,64,25,70,34.0,0.271,26,0
7,133,84,0,0,40.2,0.696,37,0
7,106,92,18,0,22.7,0.235,48,0
9,171,110,24,240,45.4,0.721,54,1
7,159,64,0,0,27.4,0.294,40,0
0,180,66,39,0,42.0,1.893,25,1
1,146,56,0,0,29.7,0.564,29,0
2,71,70,27,0,28.0,0.586,22,0
7,103,66,32,0,39.1,0.344,31,1
7,105,0,0,0,0.0,0.305,24,0
1,103,80,11,82,19.4,0.491,22,0
1,101,50,15,36,24.2,0.526,26,0
5,88,66,21,23,24.4,0.342,30,0
8,176,90,34,300,33.7,0.467,58,1
7,150,66,42,342,34.7,0.718,42,0
1,73,50,10,0,23.0,0.248,21,0
7,187,68,39,304,37.7,0.254,41,1
0,100,88,60,110,46.8,0.962,31,0
0,146,82,0,0,40.5,1.781,44,0
0,105,64,41,142,41.5,0.173,22,0
2,84,0,0,0,0.0,0.304,21,0
8,133,72,0,0,32.9,0.270,39,1
5,44,62,0,0,25.0,0.587,36,0
2,141,58,34,128,25.4,0.699,24,0
7,114,66,0,0,32.8,0.258,42,1
5,99,74,27,0,29.0,0.203,32,0
0,109,88,30,0,32.5,0.855,38,1
2,109,92,0,0,42.7,0.845,54,0
1,95,66,13,38,19.6,0.334,25,0
4,146,85,27,100,28.9,0.189,27,0
2,100,66,20,90,32.9,0.867,28,1
5,139,64,35,140,28.6,0.411,26,0
13,126,90,0,0,43.4,0.583,42,1
4,129,86,20,270,35.1,0.231,23,0
1,79,75,30,0,32.0,0.396,22,0
1,0,48,20,0,24.7,0.140,22,0
7,62,78,0,0,32.6,0.391,41,0
5,95,72,33,0,37.7,0.370,27,0
0,131,0,0,0,43.2,0.270,26,1
2,112,75,32,0,35.7,0.148,21,0
3,128,78,0,0,21.1,0.268,55,0
0,161,50,0,0,21.9,0.254,65,0
2,197,70,99,0,34.7,0.575,62,1
0,117,66,31,188,30.8,0.493,22,0
6,134,80,37,370,46.2,0.238,46,1
1,79,60,42,48,43.5,0.678,23,0
2,75,64,24,55,29.7,0.370,33,0
8,179,72,42,130,32.7,0.719,36,1
6,85,78,0,0,31.2,0.382,42,0
0,129,110,46,130,67.1,0.319,26,1
5,143,78,0,0,45.0,0.190,47,0
5,130,82,0,0,39.1,0.956,37,1
6,87,80,0,0,23.2,0.084,32,0
0,119,64,18,92,34.9,0.725,23,0
1,0,74,20,23,27.7,0.299,21,0
5,73,60,0,0,26.8,0.268,27,0
4,141,74,0,0,27.6,0.244,40,0
7,194,68,28,0,35.9,0.745,41,1
8,181,68,36,495,30.1,0.615,60,1
1,128,98,41,58,32.0,1.321,33,1
8,109,76,39,114,27.9,0.640,31,1
5,139,80,35,160,31.6,0.361,25,1
3,111,62,0,0,22.6,0.142,21,0
9,123,70,44,94,33.1,0.374,40,0
7,159,66,0,0,30.4,0.383,36,1
11,135,0,0,0,52.3,0.578,40,1
8,85,55,20,0,24.4,0.136,42,0
5,158,84,41,210,39.4,0.395,29,1
1,105,58,0,0,24.3,0.187,21,0
3,107,62,13,48,22.9,0.678,23,1
4,109,64,44,99,34.6,0.167,33,1
3,148,66,25,0,32.5,0.256,22,0
0,113,80,16,0,31.0,0.874,21,0
4,100,69,22,0,28.0,0.317,22,0
5,114,74,0,0,24.9,0.744,57,0
0,102,75,23,0,0.0,0.572,21,0
2,108,64,0,0,30.8,0.158,21,0
2,88,74,19,53,29.0,0.229,22,0
4,137,84,0,0,31.2,0.252,30,0
0,84,82,31,125,38.2,0.233,23,0
0,145,0,0,0,44.2,0.630,31,1
0,135,68,42,250,42.3,0.365,24,1
1,139,62,41,480,40.7,0.536,21,0
0,173,78,32,265,46.5,1.159,58,0
4,99,72,17,0,25.6,0.294,28,0
8,194,80,0,0,26.1,0.551,67,0
2,83,65,28,66,36.8,0.629,24,0
2,89,90,30,0,33.5,0.292,42,0
3,80,0,0,0,0.0,0.174,22,0
3,84,72,32,0,37.2,0.267,28,0
6,166,74,0,0,26.6,0.304,66,0
1,131,64,14,415,23.7,0.389,21,0
6,152,60,0,0,26.8,0.293,59,1
2,130,96,0,0,22.6,0.268,21,0
3,83,58,31,18,34.3,0.336,25,0
9,154,78,30,100,30.9,0.164,45,0
8,188,78,0,0,47.9,0.137,43,1
3,67,60,0,0,21.1,0.582,34,0
2,119,0,0,0,19.6,0.832,72,0
8,125,96,0,0,0.0,0.232,54,1
1,96,122,0,0,22.4,0.207,27,0
3,113,44,13,0,22.4,0.140,22,0
0,100,70,26,50,30.8,0.597,21,0
6,107,88,0,0,36.8,0.727,31,0
0,109,88,30,0,32.5,0.855,38,1
2,108,64,0,0,30.8,0.158,21,0
2,88,74,19,53,29.0,0.229,22,0
4,137,84,0,0,31.2,0.252,30,0
0,84,82,31,125,38.2,0.233,23,0
7,150,78,29,126,35.2,0.692,54,1
6,109,60,27,0,25.0,0.206,27,0
0,117,66,31,188,30.8,0.493,22,0
0,109,88,30,0,32.5,0.855,38,1
1,90,62,12,43,27.2,0.580,24,0
0,125,68,0,0,24.7,0.206,21,0
1,119,54,13,50,22.3,0.205,24,0
5,116,74,0,0,25.6,0.201,30,0
4,114,64,0,0,28.9,0.126,24,0
0,137,84,27,0,27.3,0.231,59,0
2,105,80,45,191,33.7,0.711,29,1
5,158,84,41,210,39.4,0.395,29,1
2,84,0,0,0,0.0,0.304,21,0
4,40,65,0,0,25.0,0.294,40,0
3,173,82,48,465,38.4,2.137,25,1
0,95,80,45,92,36.5,0.330,26,0
4,173,70,14,168,29.7,0.361,33,1
2,93,64,32,160,38.0,0.674,23,1
3,142,80,15,0,32.4,0.200,63,0
5,128,78,0,0,27.0,1.698,36,1
0,137,40,35,168,43.1,2.288,33,1
2,197,70,45,543,30.5,0.158,53,1"""


class DiabetesModel:
    def __init__(self):
        self.scaler = None
        self.best_model = None
        self.best_name = None
        self.results = {}
        self._train()

    def _train(self):
        """Train models on embedded Pima Indians dataset."""
        cols = FEATURE_NAMES + ["target"]
        df = pd.read_csv(StringIO(RAW_DATA), names=cols)
        df = df.apply(pd.to_numeric, errors='coerce').dropna()

        X = df.drop("target", axis=1)
        y = df["target"].astype(int)

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
        print(f"✅ Diabetes Model trained — Best: {self.best_name} (AUC: {self.test_auc:.4f})")

    def predict(self, patient_data: dict) -> dict:
        """Predict diabetes for a single patient."""
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
            "Consult an endocrinologist. Monitor glucose regularly. Consider lifestyle changes — balanced diet, regular exercise, and weight management."
            if prediction == 1 else
            "Maintain a healthy diet and regular exercise. Annual checkup recommended. Monitor blood sugar levels periodically."
        )

        return {
            "prediction": prediction,
            "label": "Diabetic" if prediction == 1 else "Not Diabetic",
            "probability": round(probability, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk,
            "model_used": self.best_name,
            "recommendation": recommendation,
        }

    def get_info(self) -> dict:
        return {
            "name": "Diabetes Prediction",
            "icon": "🩺",
            "description": "Predicts the likelihood of Type 2 diabetes based on 8 diagnostic measures from the Pima Indians Diabetes Dataset.",
            "features": FEATURE_INFO,
            "model_used": self.best_name,
            "test_auc": round(self.test_auc, 4),
            "all_results": {k: round(v, 4) for k, v in self.results.items()},
        }
