# Patent Prosecution Timeline Predictor ⚖️🚀
### Stochastic Survival Modeling & Machine Learning for Forecasting Patent Examination Milestones, Grant Probabilities, and Budgets

> **A Complete Final-Year / Capstone Engineering & Data Science Project**  
> Calibrated against USPTO Data Visualization Center & PatentsView Historical Docket Records.

---

## 🌟 Executive Overview
Filing a patent application is an expensive ($10,000 to $50,000+) and temporally uncertain endeavor. Non-provisional patent applications routinely take between **18 and 60+ months** before reaching final disposition (grant or abandonment). Delays stem from Technology Center docket backlogs, examiner disposition variances, claim complexity, and procedural impasses necessitating Requests for Continued Examination (RCEs).

The **Patent Prosecution Timeline Predictor** solves this challenge by combining:
1. **Multi-Stage Stochastic Survival Analysis**: Calibrated Weibull and Log-Normal renewal distributions modeling the examination hazard rate $h(t)$.
2. **Monte Carlo Simulation Engine**: Executes 1,000 to 5,000 trials to compute non-parametric confidence intervals (P10, P25, Median, P75, P90).
3. **Supervised Machine Learning Regressors**: Gradient Boosting and Random Forest models trained on 10,000 synthetic USPTO application trajectories.
4. **NLP Claim & 35 U.S.C. Legal Risk Analyzer**: Semantic classification predicting Tech Centers, Art Units, and flagging § 101 (Alice) / § 112 (Enablement) vulnerabilities.
5. **Interactive Executive Web Dashboard**: Featuring high-DPI Canvas/SVG Gantt schedules, Kaplan-Meier survival curves, milestone calendars, and lifecycle budget forecasts.

---

## 🚀 Quick Start Guide

### Option 1: Instant Launch (Zero Setup Required)
Because the frontend is built using modern vanilla ES Modules, you can simply open the dashboard directly:
1. Double-click `index.html` in your file explorer, OR
2. In your terminal:
   ```powershell
   Start-Process index.html
   ```

### Option 2: Run with Python & Environment (.env)
1. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
2. Configure settings in [`.env`](file:///c:/DESKTOP%20FILES/COLLEGE%20PROJECT/.env) (pre-configured with sensible defaults):
   ```ini
   HOST=127.0.0.1
   PORT=8080
   DEBUG=True
   DATASET_SIZE=10000
   ```
3. Launch the Backend Server:
   ```powershell
   python python_backend/server.py
   ```
- **Web Dashboard**:  https://patent-prosecution-timeline-predict.vercel.app/
- **API Health**: https://patent-prosecution-timeline-predict.vercel.app/api/health
- **Model Metrics**: https://patent-prosecution-timeline-predict.vercel.app/api/metrics

### Option 3: Retrain the Machine Learning Models
```powershell
python python_backend/train_ml_model.py
```
This script will:
- Generate 10,000 simulated patent application records (`uspto_prosecution_dataset.csv`).
- Train and compare `RandomForestRegressor` vs. `GradientBoostingRegressor`.
- Evaluate MAE, RMSE, and $R^2$ scores on a 20% holdout test set.
- Save the serialized model (`patent_predictor_model.pkl`) and feature rankings (`model_metrics.json`).

---

## 📊 Key Features & Capabilities

| Module | Description |
| :--- | :--- |
| **Interactive Gantt Timeline** | Visualizes accelerated, median, and conservative paths simultaneously with milestone pins (Filing $\to$ 18M Pub $\to$ First Office Action $\to$ Response $\to$ Grant). |
| **Monte Carlo Engine** | Runs 2,500 stochastic trials using inverse Weibull transform, generating duration density histograms and Kaplan-Meier survival curves $S(t)$. |
| **Multi-Track Matrix** | Side-by-side comparison of **Standard Non-Provisional**, **Track One Prioritized (&lt;12m)**, **PPH (Patent Prosecution Highway)**, and **Accelerated Examination**. |
| **Budget & Cash Flow Forecaster** | Itemizes statutory USPTO fees (37 CFR 1.16/1.18 for Large, Small, and Micro entities) plus legal attorney costs across each milestone. |
| **Examiner & AU Profiling** | Simulates examiner disposition effects (+12% allowance for lenient vs. -15% allowance and 18% slower reviews for strict examiners). |
| **NLP Claim Risk Analyzer** | Analyzes title, abstract, or claims to predict Technology Center and detect 35 U.S.C. §101 (Alice) and §112(f) "means-plus-function" rejections. |
| **Preloaded Case Studies** | 1-click loading of realistic real-world patents (Edge-AI UAVs, CRISPR-Cas13, Solid-State Batteries, FinTech ZKP, Medical Robotics). |
| **Export Engine** | 1-click export to **JSON**, **CSV**, or print-ready corporate **Executive Dossier (PDF)**. |

---

## 🗂️ Project File Structure

```
COLLEGE PROJECT/
├── index.html                   # Main interactive web dashboard application
├── css/
│   └── styles.css               # Modern dark-mode glassmorphic design system
├── js/
│   ├── data.js                  # USPTO benchmark parameters, fee schedules & case studies
│   ├── monte_carlo.js           # Weibull stochastic survival simulation engine
│   ├── predictor.js             # Milestone calendar scheduler & budget calculator
│   ├── charts.js                # High-DPI Canvas & SVG Gantt, histogram & survival curve visualizers
│   ├── nlp_analyzer.js          # NLP claim complexity & 35 U.S.C. 101/112 risk classifier
│   ├── export.js                # JSON, CSV, and print/PDF report generator
│   └── app.js                   # Application state manager and UI orchestrator
├── python_backend/
│   ├── dataset_generator.py     # Generates 10,000 synthetic USPTO prosecution docket records
│   ├── train_ml_model.py        # Trains Random Forest and Gradient Boosting regressors
│   ├── server.py                # FastAPI REST API & static server
│   ├── uspto_prosecution_dataset.csv # Generated 10,000-record dataset
│   ├── patent_predictor_model.pkl    # Serialized trained ML model
│   └── model_metrics.json       # Evaluated test metrics (MAE, RMSE, R²)
├── docs/
│   ├── PROJECT_REPORT.md        # Complete academic IEEE-style project report
│   └── VIVA_QUESTIONS_AND_ANSWERS.md # 25 viva voce questions and comprehensive answers
└── README.md                    # Project documentation and quick start guide
```

---

## 📐 Mathematical Formulation

### 1. Weibull Hazard Rate for Docket Renewal
$$\lambda(t) = \frac{k}{\lambda} \left(\frac{t}{\lambda}\right)^{k-1}$$
- **Scale parameter ($\lambda$)**: Calibrated to Technology Center baseline backlogs (e.g., 28.0 months for TC 2800 vs. 43.0 months for TC 3600).
- **Shape parameter ($k$)**: $k > 1$ represents increasing hazard over time due to internal USPTO production quotas.

### 2. Monte Carlo Stochastic Sampling
For each iteration $i$:
$$T_i = \lambda_{\text{eff}} \cdot (-\ln(1 - U_i))^{1/k}, \quad U_i \sim \mathcal{U}(0, 1)$$

### 3. Statutory Fee Computation (37 CFR 1.16 & 1.18)
$$\text{Cost}_{\text{PTO}} = \beta_{\text{entity}} \cdot \left[ F_{\text{base}} + \max(0, C_{\text{indep}} - 3) \cdot F_{\text{indep}} + \max(0, C_{\text{total}} - 20) \cdot F_{\text{total}} + \mathbb{I}_{\text{Track1}} \cdot F_{\text{Track1}} + N_{\text{RCE}} \cdot F_{\text{RCE}} + F_{\text{issue}} \right]$$
Where $\beta_{\text{entity}} = 1.0$ (Large), $0.40$ (Small), and $0.20$ (Micro).

---

## 🎓 Academic Presentation & Viva Preparation
Review the comprehensive guides in the `docs/` folder:
- **Project Report**: [`docs/PROJECT_REPORT.md`](file:///c:/DESKTOP%20FILES/COLLEGE%20PROJECT/docs/PROJECT_REPORT.md)
- **Viva Q&A Guide**: [`docs/VIVA_QUESTIONS_AND_ANSWERS.md`](file:///c:/DESKTOP%20FILES/COLLEGE%20PROJECT/docs/VIVA_QUESTIONS_AND_ANSWERS.md)
