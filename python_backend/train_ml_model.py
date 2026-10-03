"""
Machine Learning Model Training Pipeline for Patent Prosecution Timeline Prediction
Trains RandomForest and GradientBoosting regressors on patent docket features
and evaluates performance metrics (MAE, RMSE, R²).
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from dataset_generator import generate_dataset

# Load environment configuration if available
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except ImportError:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip() and not line.startswith("#") and "=" in line:
                        k, v = line.strip().split("=", 1)
                        if k.strip() not in os.environ:
                            os.environ[k.strip()] = v.strip().strip("'\"")

load_env()
DATASET_SIZE = int(os.getenv("DATASET_SIZE", 10000))

def train_models():
    csv_file = os.path.join(os.path.dirname(__file__), "uspto_prosecution_dataset.csv")
    if not os.path.exists(csv_file):
        generate_dataset(DATASET_SIZE, csv_file)

    print("Loading USPTO Prosecution Dataset...")
    df = pd.read_csv(csv_file)
    print(f"Loaded {len(df)} rows. Sample columns: {list(df.columns)}")

    # Feature Engineering
    feature_cols = [
        "tech_center", "track", "entity_size", "examiner_difficulty",
        "indep_claims", "total_claims", "prior_art_citations", "time_to_foa_months"
    ]
    
    X_raw = df[feature_cols]
    y = df["total_pendency_months"]

    # One-Hot Encoding for categorical features
    X = pd.get_dummies(X_raw, columns=["tech_center", "track", "entity_size", "examiner_difficulty"], drop_first=False)
    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples.")

    # Train Random Forest Regressor
    print("Training Random Forest Regressor...")
    rf_model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)

    # Train Gradient Boosting Regressor
    print("Training Gradient Boosting Regressor...")
    gb_model = GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    gb_model.fit(X_train, y_train)

    # Evaluate Models
    rf_pred = rf_model.predict(X_test)
    gb_pred = gb_model.predict(X_test)

    rf_mae = mean_absolute_error(y_test, rf_pred)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
    rf_r2 = r2_score(y_test, rf_pred)

    gb_mae = mean_absolute_error(y_test, gb_pred)
    gb_rmse = np.sqrt(mean_squared_error(y_test, gb_pred))
    gb_r2 = r2_score(y_test, gb_pred)

    print("\n================ MODEL PERFORMANCE EVALUATION ================")
    print(f"Random Forest Regressor:")
    print(f"  - Mean Absolute Error (MAE): {rf_mae:.2f} months")
    print(f"  - Root Mean Squared Error (RMSE): {rf_rmse:.2f} months")
    print(f"  - R² Score: {rf_r2:.4f}")

    print(f"\nGradient Boosting Regressor:")
    print(f"  - Mean Absolute Error (MAE): {gb_mae:.2f} months")
    print(f"  - Root Mean Squared Error (RMSE): {gb_rmse:.2f} months")
    print(f"  - R² Score: {gb_r2:.4f}")

    # Feature Importance Ranking
    importances = gb_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_ranking = [
        {"feature": feature_names[i], "importance": round(float(importances[i]), 4)}
        for i in sorted_idx
    ]

    print("\nTop 7 Predictive Feature Importances:")
    for item in feature_ranking[:7]:
        print(f"  - {item['feature']}: {item['importance']*100:.1f}%")

    # Serialize Best Model and Metadata
    output_dir = os.path.dirname(__file__)
    model_path = os.path.join(output_dir, "patent_predictor_model.pkl")
    joblib.dump({"model": gb_model, "feature_names": feature_names}, model_path)
    print(f"\nModel saved successfully to {model_path}")

    metrics_path = os.path.join(output_dir, "model_metrics.json")
    metrics_data = {
        "dataset_size": len(df),
        "test_size": len(X_test),
        "best_model": "GradientBoostingRegressor",
        "metrics": {
            "mae_months": round(float(gb_mae), 2),
            "rmse_months": round(float(gb_rmse), 2),
            "r2_score": round(float(gb_r2), 4)
        },
        "random_forest_comparison": {
            "mae_months": round(float(rf_mae), 2),
            "rmse_months": round(float(rf_rmse), 2),
            "r2_score": round(float(rf_r2), 4)
        },
        "top_feature_importances": feature_ranking[:10]
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_models()
