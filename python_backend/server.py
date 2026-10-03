"""
Patent Prosecution Timeline Predictor - Python HTTP & REST API Server
Integrated with .env configuration for environment-driven deployments.
Built with standard library HTTP server for 100% reliability and zero-dependency fallback.
"""

import os
import sys
import json
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Base Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ENV_PATH = os.path.join(PROJECT_ROOT, ".env")

# ------------------------------------------------------------------------------
# Environment Configuration (.env loader with zero-dependency fallback)
# ------------------------------------------------------------------------------
def load_env_file(filepath):
    """Load key-value pairs from .env into os.environ"""
    # 1. Try using python-dotenv if installed
    try:
        from dotenv import load_dotenv
        if os.path.exists(filepath):
            load_dotenv(filepath)
            print(f"[CONFIG] Loaded environment variables from {filepath} via python-dotenv.")
            return
    except ImportError:
        pass

    # 2. Built-in fallback parser if python-dotenv is not installed
    if os.path.exists(filepath):
        print(f"[CONFIG] Loading environment variables from {filepath} via built-in parser.")
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key not in os.environ:
                    os.environ[key] = val

load_env_file(ENV_PATH)

# Read Configuration from Environment
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8080))
DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
APP_NAME = os.getenv("APP_NAME", "Patent Prosecution Timeline Predictor")
APP_VERSION = os.getenv("APP_VERSION", "2.4.0")

MODEL_REL_PATH = os.getenv("ML_MODEL_PATH", "python_backend/patent_predictor_model.pkl")
METRICS_REL_PATH = os.getenv("METRICS_PATH", "python_backend/model_metrics.json")
MODEL_PATH = os.path.join(PROJECT_ROOT, MODEL_REL_PATH)
METRICS_PATH = os.path.join(PROJECT_ROOT, METRICS_REL_PATH)

# Try loading joblib ML model if available
ml_pipeline = None
try:
    import joblib
    import numpy as np
    import pandas as pd
    if os.path.exists(MODEL_PATH):
        ml_pipeline = joblib.load(MODEL_PATH)
        print(f"[INFO] Serialized Scikit-learn model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"[NOTE] Running in standard analytical mode ({e})")

class PatentApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve static frontend files from project root
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        if parsed.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            payload = {
                "status": "online",
                "app_name": APP_NAME,
                "version": APP_VERSION,
                "environment": ENVIRONMENT,
                "port": PORT,
                "host": HOST,
                "debug_mode": DEBUG,
                "ml_model_loaded": ml_pipeline is not None,
                "env_file_detected": os.path.exists(ENV_PATH)
            }
            self.wfile.write(json.dumps(payload, indent=2).encode("utf-8"))
            return

        if parsed.path == "/api/metrics":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            else:
                self.wfile.write(json.dumps({"error": "Metrics not generated yet"}).encode("utf-8"))
            return

        # Fallback to standard static file serving (index.html, css, js)
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/predict":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode("utf-8"))
            except Exception:
                data = {}

            tc = data.get("tech_center", "2100")
            track = data.get("track", "standard")
            indep = int(data.get("indep_claims", 3))
            total = int(data.get("total_claims", 20))
            prior_art = int(data.get("prior_art_citations", 12))
            examiner = data.get("examiner_difficulty", "moderate")

            # Benchmark base calculation
            tc_base = {
                "1600": 36.8, "1700": 31.4, "2100": 35.6, "2400": 33.2,
                "2600": 30.5, "2800": 27.2, "3600": 41.5, "3700": 29.8
            }
            base_months = tc_base.get(tc, 34.0)

            # Track and Examiner adjustments
            track_mult = 0.35 if track == "trackOne" else (0.55 if track == "pph" else 1.0)
            examiner_mult = 0.90 if examiner == "lenient" else (1.18 if examiner == "strict" else 1.0)
            claims_adj = max(0, (total - 20) * 0.15 + (indep - 3) * 0.4)

            predicted_months = round(base_months * track_mult * examiner_mult + claims_adj, 1)

            # If Scikit-learn model loaded, execute inference
            if ml_pipeline:
                try:
                    model = ml_pipeline["model"]
                    feature_names = ml_pipeline["feature_names"]
                    foa_time = 3.6 if track == "trackOne" else (base_months * 0.58)

                    row = {
                        "indep_claims": [indep],
                        "total_claims": [total],
                        "prior_art_citations": [prior_art],
                        "time_to_foa_months": [foa_time]
                    }
                    for fn in feature_names:
                        if fn.startswith("tech_center_"):
                            row[fn] = [1 if fn == f"tech_center_{tc}" else 0]
                        elif fn.startswith("track_"):
                            row[fn] = [1 if fn == f"track_{track}" else 0]
                        elif fn.startswith("entity_size_"):
                            row[fn] = [1 if fn == f"entity_size_{data.get('entity_size', 'small')}" else 0]
                        elif fn.startswith("examiner_difficulty_"):
                            row[fn] = [1 if fn == f"examiner_difficulty_{examiner}" else 0]

                    import pandas as pd
                    df_row = pd.DataFrame(row)[feature_names]
                    ml_pred = float(model.predict(df_row)[0])
                    predicted_months = round(ml_pred, 1)
                except Exception as ex:
                    print(f"[WARN] ML inference error: {ex}")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            resp = {
                "predicted_pendency_months": predicted_months,
                "confidence_interval_90": {
                    "p10": round(max(3.0, predicted_months * 0.72), 1),
                    "median": predicted_months,
                    "p90": round(predicted_months * 1.38, 1)
                },
                "input_parameters": data,
                "environment": ENVIRONMENT
            }
            self.wfile.write(json.dumps(resp).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, PatentApiHandler)
    print("\n" + "=" * 66)
    print(f" {APP_NAME} v{APP_VERSION} [{ENVIRONMENT.upper()}]")
    print(f" Server running at: http://{HOST}:{PORT}")
    print(f" Loaded from .env:  HOST={HOST}, PORT={PORT}, DEBUG={DEBUG}")
    print(f" API Health:        http://{HOST}:{PORT}/api/health")
    print(f" API Metrics:       http://{HOST}:{PORT}/api/metrics")
    print("=" * 66 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
