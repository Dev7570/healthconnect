"""
Breast Cancer Prediction Model
Dataset: sklearn built-in load_breast_cancer() (569 samples, 30 features)
Models: Logistic Regression, Random Forest, XGBoost → auto-selects best by ROC-AUC
"""

import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score

# The 30 features with user-friendly labels
FEATURE_INFO = [
    {"name": "mean radius", "label": "Mean Radius", "type": "number", "placeholder": "e.g. 14.1", "hint": "Mean of distances from center to perimeter", "step": 0.01},
    {"name": "mean texture", "label": "Mean Texture", "type": "number", "placeholder": "e.g. 19.3", "hint": "Standard deviation of gray-scale values", "step": 0.01},
    {"name": "mean perimeter", "label": "Mean Perimeter", "type": "number", "placeholder": "e.g. 91.7", "hint": "Mean perimeter of the cell nucleus", "step": 0.01},
    {"name": "mean area", "label": "Mean Area", "type": "number", "placeholder": "e.g. 654.9", "hint": "Mean area of the cell nucleus", "step": 0.1},
    {"name": "mean smoothness", "label": "Mean Smoothness", "type": "number", "placeholder": "e.g. 0.096", "hint": "Local variation in radius lengths", "step": 0.001},
    {"name": "mean compactness", "label": "Mean Compactness", "type": "number", "placeholder": "e.g. 0.104", "hint": "Perimeter² / Area - 1.0", "step": 0.001},
    {"name": "mean concavity", "label": "Mean Concavity", "type": "number", "placeholder": "e.g. 0.089", "hint": "Severity of concave portions of the contour", "step": 0.001},
    {"name": "mean concave points", "label": "Mean Concave Points", "type": "number", "placeholder": "e.g. 0.049", "hint": "Number of concave portions of the contour", "step": 0.001},
    {"name": "mean symmetry", "label": "Mean Symmetry", "type": "number", "placeholder": "e.g. 0.181", "hint": "Symmetry of the nucleus", "step": 0.001},
    {"name": "mean fractal dimension", "label": "Mean Fractal Dimension", "type": "number", "placeholder": "e.g. 0.063", "hint": "Coastline approximation - 1", "step": 0.001},
    {"name": "radius error", "label": "Radius Error (SE)", "type": "number", "placeholder": "e.g. 0.405", "hint": "Standard error of radius", "step": 0.001},
    {"name": "texture error", "label": "Texture Error (SE)", "type": "number", "placeholder": "e.g. 1.216", "hint": "Standard error of texture", "step": 0.001},
    {"name": "perimeter error", "label": "Perimeter Error (SE)", "type": "number", "placeholder": "e.g. 2.866", "hint": "Standard error of perimeter", "step": 0.001},
    {"name": "area error", "label": "Area Error (SE)", "type": "number", "placeholder": "e.g. 40.34", "hint": "Standard error of area", "step": 0.01},
    {"name": "smoothness error", "label": "Smoothness Error (SE)", "type": "number", "placeholder": "e.g. 0.007", "hint": "Standard error of smoothness", "step": 0.0001},
    {"name": "compactness error", "label": "Compactness Error (SE)", "type": "number", "placeholder": "e.g. 0.025", "hint": "Standard error of compactness", "step": 0.001},
    {"name": "concavity error", "label": "Concavity Error (SE)", "type": "number", "placeholder": "e.g. 0.032", "hint": "Standard error of concavity", "step": 0.001},
    {"name": "concave points error", "label": "Concave Points Error (SE)", "type": "number", "placeholder": "e.g. 0.012", "hint": "Standard error of concave points", "step": 0.001},
    {"name": "symmetry error", "label": "Symmetry Error (SE)", "type": "number", "placeholder": "e.g. 0.021", "hint": "Standard error of symmetry", "step": 0.001},
    {"name": "fractal dimension error", "label": "Fractal Dim Error (SE)", "type": "number", "placeholder": "e.g. 0.004", "hint": "Standard error of fractal dimension", "step": 0.0001},
    {"name": "worst radius", "label": "Worst Radius", "type": "number", "placeholder": "e.g. 16.3", "hint": "Largest mean radius value", "step": 0.01},
    {"name": "worst texture", "label": "Worst Texture", "type": "number", "placeholder": "e.g. 25.7", "hint": "Largest mean texture value", "step": 0.01},
    {"name": "worst perimeter", "label": "Worst Perimeter", "type": "number", "placeholder": "e.g. 107.3", "hint": "Largest mean perimeter value", "step": 0.01},
    {"name": "worst area", "label": "Worst Area", "type": "number", "placeholder": "e.g. 880.6", "hint": "Largest mean area value", "step": 0.1},
    {"name": "worst smoothness", "label": "Worst Smoothness", "type": "number", "placeholder": "e.g. 0.132", "hint": "Largest mean smoothness value", "step": 0.001},
    {"name": "worst compactness", "label": "Worst Compactness", "type": "number", "placeholder": "e.g. 0.254", "hint": "Largest mean compactness value", "step": 0.001},
    {"name": "worst concavity", "label": "Worst Concavity", "type": "number", "placeholder": "e.g. 0.272", "hint": "Largest mean concavity value", "step": 0.001},
    {"name": "worst concave points", "label": "Worst Concave Points", "type": "number", "placeholder": "e.g. 0.114", "hint": "Largest mean concave points value", "step": 0.001},
    {"name": "worst symmetry", "label": "Worst Symmetry", "type": "number", "placeholder": "e.g. 0.290", "hint": "Largest mean symmetry value", "step": 0.001},
    {"name": "worst fractal dimension", "label": "Worst Fractal Dimension", "type": "number", "placeholder": "e.g. 0.084", "hint": "Largest mean fractal dimension value", "step": 0.001},
]


class BreastCancerModel:
    def __init__(self):
        self.scaler = None
        self.best_model = None
        self.best_name = None
        self.results = {}
        self.feature_names = []
        self._train()

    def _train(self):
        """Train models on sklearn breast cancer dataset."""
        data = load_breast_cancer()
        df = pd.DataFrame(data.data, columns=data.feature_names)
        df["target"] = data.target  # 1 = Benign, 0 = Malignant

        self.feature_names = list(data.feature_names)

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
        print(f"✅ Breast Cancer Model trained — Best: {self.best_name} (AUC: {self.test_auc:.4f})")

    def predict(self, patient_data: dict) -> dict:
        """Predict breast cancer for given tumor measurements."""
        values = [float(patient_data.get(f, 0)) for f in self.feature_names]
        df = pd.DataFrame([values], columns=self.feature_names)
        scaled = self.scaler.transform(df)

        prediction = int(self.best_model.predict(scaled)[0])
        proba = self.best_model.predict_proba(scaled)[0]
        mal_prob = float(proba[0])  # probability of malignant
        ben_prob = float(proba[1])  # probability of benign

        if mal_prob < 0.3:
            risk = "LOW"
        elif mal_prob < 0.6:
            risk = "MODERATE"
        else:
            risk = "HIGH"

        is_malignant = prediction == 0
        confidence = mal_prob if is_malignant else ben_prob

        recommendation = (
            "Immediate oncologist consultation required. Further biopsy and imaging tests are strongly advised."
            if is_malignant else
            "Tumor appears benign. Regular monitoring and follow-up mammograms are recommended."
        )

        return {
            "prediction": 1 if is_malignant else 0,
            "label": "Malignant (Cancerous)" if is_malignant else "Benign (Non-cancerous)",
            "probability": round(mal_prob, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk,
            "model_used": self.best_name,
            "recommendation": recommendation,
        }

    def get_info(self) -> dict:
        return {
            "name": "Breast Cancer Prediction",
            "icon": "🎗️",
            "description": "Predicts whether a breast tumor is Malignant or Benign based on 30 tumor cell nucleus measurements from the Wisconsin Diagnostic Dataset.",
            "features": FEATURE_INFO,
            "model_used": self.best_name,
            "test_auc": round(self.test_auc, 4),
            "all_results": {k: round(v, 4) for k, v in self.results.items()},
        }
