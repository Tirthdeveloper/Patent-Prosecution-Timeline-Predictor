/**
 * Main Application Orchestrator for Patent Prosecution Timeline Predictor
 */

import { TECH_CENTERS, TRACKS, ENTITY_TYPES, SAMPLE_CASE_STUDIES } from './data.js';
import { predictTimeline, formatDate } from './predictor.js';
import { renderGanttTimeline, renderMonteCarloHistogram, renderSurvivalCurve, renderCostChart } from './charts.js';
import { analyzePatentText } from './nlp_analyzer.js';
import { exportToJson, exportToCsv, printExecutiveDossier } from './export.js';

// Application State
const state = {
  currentPrediction: null,
  activeTab: 'timeline',
  nlpAnalysis: null
};

// Form Elements Cache
let elements = {};

function initElements() {
  elements = {
    techCenterSelect: document.getElementById('techCenterSelect'),
    artUnitSelect: document.getElementById('artUnitSelect'),
    trackSelect: document.getElementById('trackSelect'),
    entitySelect: document.getElementById('entitySelect'),
    filingDateInput: document.getElementById('filingDateInput'),
    indepClaimsInput: document.getElementById('indepClaimsInput'),
    indepClaimsVal: document.getElementById('indepClaimsVal'),
    totalClaimsInput: document.getElementById('totalClaimsInput'),
    totalClaimsVal: document.getElementById('totalClaimsVal'),
    priorArtInput: document.getElementById('priorArtInput'),
    priorArtVal: document.getElementById('priorArtVal'),
    examinerSelect: document.getElementById('examinerSelect'),
    mcIterationsSelect: document.getElementById('mcIterationsSelect'),
    caseStudySelect: document.getElementById('caseStudySelect'),
    btnRecalculate: document.getElementById('btnRecalculate'),
    btnReset: document.getElementById('btnReset'),
    btnExportJson: document.getElementById('btnExportJson'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnPrintDossier: document.getElementById('btnPrintDossier'),
    // NLP Tab
    patentTextInput: document.getElementById('patentTextInput'),
    btnAnalyzeText: document.getElementById('btnAnalyzeText'),
    btnApplyNlpTechCenter: document.getElementById('btnApplyNlpTechCenter')
  };
}

/**
 * Populate Technology Center and Art Unit dropdowns
 */
function populateTechCenters() {
  if (!elements.techCenterSelect) return;
  elements.techCenterSelect.innerHTML = '';
  
  Object.keys(TECH_CENTERS).forEach(key => {
    const tc = TECH_CENTERS[key];
    const opt = document.createElement('option');
    opt.value = tc.id;
    opt.textContent = `TC ${tc.id}: ${tc.name}`;
    elements.techCenterSelect.appendChild(opt);
  });

  updateArtUnits();
}

function updateArtUnits() {
  if (!elements.artUnitSelect) return;
  const currentTC = elements.techCenterSelect.value;
  const tc = TECH_CENTERS[currentTC];
  elements.artUnitSelect.innerHTML = '';

  if (tc && tc.artUnits) {
    tc.artUnits.forEach(au => {
      const opt = document.createElement('option');
      opt.value = au.id;
      opt.textContent = `Art Unit ${au.id}: ${au.name} (${Math.round(au.allowanceRate * 100)}% allowance)`;
      elements.artUnitSelect.appendChild(opt);
    });
  }
}

/**
 * Populate Case Studies Dropdown
 */
function populateCaseStudies() {
  if (!elements.caseStudySelect) return;
  elements.caseStudySelect.innerHTML = '<option value="">-- Load Preloaded Case Study --</option>';
  SAMPLE_CASE_STUDIES.forEach(cs => {
    const opt = document.createElement('option');
    opt.value = cs.id;
    opt.textContent = `${cs.title.substring(0, 52)}... [${cs.techCenterId}]`;
    elements.caseStudySelect.appendChild(opt);
  });
}

/**
 * Load a specific case study into form inputs
 */
function loadCaseStudy(caseId) {
  const cs = SAMPLE_CASE_STUDIES.find(c => c.id === caseId);
  if (!cs) return;

  elements.techCenterSelect.value = cs.techCenterId;
  updateArtUnits();
  if (cs.artUnitId) {
    elements.artUnitSelect.value = cs.artUnitId;
  }
  elements.trackSelect.value = cs.track;
  elements.entitySelect.value = cs.entity;
  elements.indepClaimsInput.value = cs.indepClaims;
  elements.indepClaimsVal.textContent = cs.indepClaims;
  elements.totalClaimsInput.value = cs.totalClaims;
  elements.totalClaimsVal.textContent = cs.totalClaims;
  elements.priorArtInput.value = cs.priorArtCount;
  elements.priorArtVal.textContent = cs.priorArtCount;
  elements.examinerSelect.value = cs.examinerProfile;

  if (elements.patentTextInput) {
    elements.patentTextInput.value = `${cs.title}\n\nAbstract:\n${cs.abstract}`;
  }

  // Trigger recalculation
  runPrediction();
}

/**
 * Collect parameters from UI form
 */
function getFormParameters() {
  return {
    techCenterId: elements.techCenterSelect.value || "2100",
    artUnitId: elements.artUnitSelect.value,
    track: elements.trackSelect.value || "standard",
    entity: elements.entitySelect.value || "small",
    filingDate: elements.filingDateInput.value || formatDate(new Date()),
    indepClaims: parseInt(elements.indepClaimsInput.value, 10) || 3,
    totalClaims: parseInt(elements.totalClaimsInput.value, 10) || 20,
    priorArtCount: parseInt(elements.priorArtInput.value, 10) || 12,
    examinerProfile: elements.examinerSelect.value || "moderate",
    iterations: parseInt(elements.mcIterationsSelect.value, 10) || 2500
  };
}

/**
 * Execute Timeline Prediction and Update UI
 */
export function runPrediction() {
  const params = getFormParameters();
  
  // Show quick loading indicator or subtle transition
  const card = document.querySelector('.main-dashboard');
  if (card) card.classList.add('computing');

  setTimeout(() => {
    state.currentPrediction = predictTimeline(params);
    updateDashboardUI(state.currentPrediction);
    if (card) card.classList.remove('computing');
  }, 100);
}

/**
 * Update all metric cards, timeline, and charts
 */
function updateDashboardUI(data) {
  const metrics = data.sim.metrics;
  const budget = data.budget;

  // KPI Metric Cards
  const kpiMedian = document.getElementById('kpiMedianMonths');
  const kpiGrantProb = document.getElementById('kpiGrantProb');
  const kpiFoaMonths = document.getElementById('kpiFoaMonths');
  const kpiBudget = document.getElementById('kpiTotalBudget');
  const kpiExpectedOAs = document.getElementById('kpiExpectedOAs');

  if (kpiMedian) kpiMedian.textContent = `${metrics.median} mo`;
  if (kpiGrantProb) kpiGrantProb.textContent = `${metrics.grantProbability}%`;
  if (kpiFoaMonths) {
    const foaM = data.trackInfo.id === 'trackOne' ? '3.6 mo' : `${Math.round(metrics.median * 0.58)} mo`;
    kpiFoaMonths.textContent = foaM;
  }
  if (kpiBudget) kpiBudget.textContent = `$${budget.expectedTotalOverall.toLocaleString()}`;
  if (kpiExpectedOAs) kpiExpectedOAs.textContent = `${metrics.expectedOACount} actions`;

  // Update Scenario Callouts
  const scAccelerated = document.getElementById('scAcceleratedVal');
  const scMedian = document.getElementById('scMedianVal');
  const scConservative = document.getElementById('scConservativeVal');
  if (scAccelerated) scAccelerated.textContent = `${data.scenarios.accelerated.durationMonths} months (${data.scenarios.accelerated.grantDate})`;
  if (scMedian) scMedian.textContent = `${data.scenarios.median.durationMonths} months (${data.scenarios.median.grantDate})`;
  if (scConservative) scConservative.textContent = `${data.scenarios.conservative.durationMonths} months (${data.scenarios.conservative.grantDate})`;

  // Render Gantt Timeline
  renderGanttTimeline('ganttContainer', data);

  // Render Milestone Schedule Table
  renderMilestoneTable(data.milestones);

  // Render Monte Carlo Histogram & Survival Curve
  renderMonteCarloHistogram('monteCarloHistogramCanvas', data.sim);
  renderSurvivalCurve('survivalCurveCanvas', data.sim);

  // Render Percentiles Breakdown Table
  renderPercentilesTable(data.sim.metrics);

  // Render Cost Chart
  renderCostChart('costChartContainer', data.budget);

  // Render Multi-Track Comparison Table
  renderTrackComparisonTable(data.trackComparison);

  // Render Examiner Impact Tab
  renderExaminerTab(data);
}

function renderMilestoneTable(milestones) {
  const container = document.getElementById('milestoneTableContainer');
  if (!container) return;

  let html = `
    <table class="milestone-table">
      <thead>
        <tr>
          <th>Stage</th>
          <th>Milestone Name</th>
          <th>Expected Elapsed</th>
          <th>Projected Calendar Date</th>
          <th>Statutory / Legal Basis</th>
        </tr>
      </thead>
      <tbody>
  `;

  milestones.forEach((m, idx) => {
    html += `
      <tr>
        <td><span class="step-num">${idx + 1}</span></td>
        <td>
          <strong>${m.name}</strong>
          <div class="table-subtext">${m.description}</div>
        </td>
        <td><span class="badge-elapsed">${m.expectedMonths} mo</span></td>
        <td><span class="badge-date">${m.expectedDate}</span></td>
        <td><span class="badge-stage">${m.costStage}</span></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderPercentilesTable(metrics) {
  const container = document.getElementById('percentilesTableContainer');
  if (!container) return;

  const rows = [
    { label: "P10 (Hyper-Optimized / Direct Allowance)", val: `${metrics.p10} months`, desc: "Top 10% fastest prosecution with zero rejections" },
    { label: "P25 (First Quartile / Swift Resolution)", val: `${metrics.p25} months`, desc: "Single non-final office action resolved promptly" },
    { label: "P50 (Median Baseline)", val: `${metrics.median} months`, desc: "Standard expected case trajectory for this Art Unit" },
    { label: "P75 (Third Quartile / Heavy Amendments)", val: `${metrics.p75} months`, desc: "Multiple office action cycles or candidate RCE" },
    { label: "P90 (Conservative / Extended Backlog)", val: `${metrics.p90} months`, desc: "Required RCE filing or extended examiner impasse" }
  ];

  let html = `
    <table class="milestone-table">
      <thead>
        <tr>
          <th>Confidence Percentile</th>
          <th>Prosecution Duration</th>
          <th>Clinical Prosecution Interpretation</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    html += `
      <tr>
        <td><strong>${r.label}</strong></td>
        <td><span class="badge-elapsed bold-highlight">${r.val}</span></td>
        <td class="table-subtext">${r.desc}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderTrackComparisonTable(trackComparison) {
  const container = document.getElementById('trackComparisonContainer');
  if (!container) return;

  let html = `
    <table class="milestone-table">
      <thead>
        <tr>
          <th>Filing Track Program</th>
          <th>Target Speed</th>
          <th>Expected Median</th>
          <th>P90 Backlog</th>
          <th>Grant Probability</th>
          <th>Est. Official PTO</th>
          <th>Total Expected Budget</th>
        </tr>
      </thead>
      <tbody>
  `;

  trackComparison.forEach(t => {
    html += `
      <tr>
        <td>
          <strong>${t.trackName}</strong>
          <span class="track-tag">${t.badge}</span>
        </td>
        <td>First Action in ~${t.foaMonths} mo</td>
        <td><span class="badge-elapsed bold-highlight">${t.medianMonths} mo</span></td>
        <td>${t.p90Months} mo</td>
        <td><span class="badge-prob">${t.grantProbability}%</span></td>
        <td>$${t.ptoCost.toLocaleString()}</td>
        <td><strong>$${t.totalExpectedCost.toLocaleString()}</strong></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function renderExaminerTab(data) {
  const container = document.getElementById('examinerAnalyticsContainer');
  if (!container) return;

  const tc = data.techCenter;
  const currentAU = tc.artUnits.find(a => a.id === data.params.artUnitId) || tc.artUnits[0];

  container.innerHTML = `
    <div class="examiner-grid">
      <div class="examiner-stat-card">
        <h3>Art Unit ${currentAU.id} Benchmark</h3>
        <p class="stat-highlight">${currentAU.name}</p>
        <div class="stat-row">
          <span>Historical Allowance Rate:</span>
          <strong>${Math.round(currentAU.allowanceRate * 100)}%</strong>
        </div>
        <div class="stat-row">
          <span>Average First Action Docket Time:</span>
          <strong>${currentAU.avgFOA} months</strong>
        </div>
        <div class="stat-row">
          <span>Tech Center Average Duration:</span>
          <strong>${tc.avgTotalMonths} months</strong>
        </div>
        <div class="stat-row">
          <span>Average Office Actions to Grant:</span>
          <strong>${tc.avgOACount} actions</strong>
        </div>
      </div>

      <div class="examiner-stat-card">
        <h3>Simulated Examiner Severity Impact</h3>
        <p class="stat-highlight">Selected Profile: <span class="capitalize">${data.params.examinerProfile}</span></p>
        <div class="stat-row">
          <span>Examiner Allowance Delta:</span>
          <strong>${data.params.examinerProfile === 'lenient' ? '+12%' : data.params.examinerProfile === 'strict' ? '-15%' : '0% (Baseline)'}</strong>
        </div>
        <div class="stat-row">
          <span>Review Speed Velocity:</span>
          <strong>${data.params.examinerProfile === 'lenient' ? '10% Faster' : data.params.examinerProfile === 'strict' ? '18% Slower' : 'Normal Queue'}</strong>
        </div>
        <div class="stat-row">
          <span>RCE Trigger Likelihood:</span>
          <strong>${data.params.examinerProfile === 'strict' ? 'Elevated (48%)' : 'Moderate (28%)'}</strong>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle NLP Text Analysis
 */
function handleNlpAnalysis() {
  const text = elements.patentTextInput ? elements.patentTextInput.value : '';
  const indepCount = parseInt(elements.indepClaimsInput.value, 10) || 3;
  const totalCount = parseInt(elements.totalClaimsInput.value, 10) || 20;

  if (!text || text.trim().length === 0) {
    alert("Please enter or paste patent application title, abstract, or claims to run NLP diagnosis.");
    return;
  }

  const analysis = analyzePatentText(text, indepCount, totalCount);
  state.nlpAnalysis = analysis;

  const resultContainer = document.getElementById('nlpResultsContainer');
  if (!resultContainer) return;

  let recsHtml = analysis.recommendations.map(r => `<li>${r}</li>`).join('');

  resultContainer.innerHTML = `
    <div class="nlp-card">
      <div class="nlp-header">
        <h3>NLP Technical Classification & Claim Complexity Report</h3>
        <button id="btnAutoTuneParams" class="btn btn-secondary btn-sm">Auto-Apply to Predictor</button>
      </div>

      <div class="nlp-grid">
        <div class="nlp-metric-box">
          <span class="label">Predicted Technology Center</span>
          <span class="val">TC ${analysis.detectedTechCenterId}</span>
          <small>${analysis.detectedTechCenter.name}</small>
        </div>

        <div class="nlp-metric-box">
          <span class="label">Suggested Art Unit</span>
          <span class="val">AU ${analysis.suggestedArtUnitId}</span>
          <small>Highest semantic similarity match</small>
        </div>

        <div class="nlp-metric-box">
          <span class="label">Claim Complexity Score</span>
          <span class="val">${analysis.complexityScore} / 100</span>
          <small>Complexity Level: <strong>${analysis.complexityLevel}</strong> (${analysis.whereinCount} 'wherein' clauses)</small>
        </div>

        <div class="nlp-metric-box">
          <span class="label">35 U.S.C. 101 (Alice) Risk</span>
          <span class="val ${analysis.statutoryRisks.section101.risk.toLowerCase()}">${analysis.statutoryRisks.section101.risk}</span>
          <small>${analysis.statutoryRisks.section101.description}</small>
        </div>

        <div class="nlp-metric-box">
          <span class="label">35 U.S.C. 112 (Enablement) Risk</span>
          <span class="val ${analysis.statutoryRisks.section112.risk.toLowerCase()}">${analysis.statutoryRisks.section112.risk}</span>
          <small>${analysis.statutoryRisks.section112.description}</small>
        </div>
      </div>

      <div class="nlp-recs">
        <h4>Optimization Recommendations for Accelerating Prosecution</h4>
        <ul>${recsHtml}</ul>
      </div>
    </div>
  `;

  const btnAutoTune = document.getElementById('btnAutoTuneParams');
  if (btnAutoTune) {
    btnAutoTune.addEventListener('click', () => {
      elements.techCenterSelect.value = analysis.detectedTechCenterId;
      updateArtUnits();
      if (analysis.suggestedArtUnitId) {
        elements.artUnitSelect.value = analysis.suggestedArtUnitId;
      }
      // Switch back to timeline tab and run prediction
      switchTab('timeline');
      runPrediction();
    });
  }
}

/**
 * Tab Switching Controller
 */
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  });

  // Re-render canvases if switching to monte carlo tab
  if (tabId === 'monte-carlo' && state.currentPrediction) {
    setTimeout(() => {
      renderMonteCarloHistogram('monteCarloHistogramCanvas', state.currentPrediction.sim);
      renderSurvivalCurve('survivalCurveCanvas', state.currentPrediction.sim);
    }, 50);
  }
}

/**
 * Event Listeners Initialization
 */
function bindEvents() {
  // Tech center change triggers art unit update and auto-recalculation
  elements.techCenterSelect.addEventListener('change', () => {
    updateArtUnits();
    runPrediction();
  });

  elements.artUnitSelect.addEventListener('change', runPrediction);
  elements.trackSelect.addEventListener('change', runPrediction);
  elements.entitySelect.addEventListener('change', runPrediction);
  elements.examinerSelect.addEventListener('change', runPrediction);
  elements.filingDateInput.addEventListener('change', runPrediction);
  elements.mcIterationsSelect.addEventListener('change', runPrediction);

  // Sliders
  elements.indepClaimsInput.addEventListener('input', (e) => {
    elements.indepClaimsVal.textContent = e.target.value;
    runPrediction();
  });

  elements.totalClaimsInput.addEventListener('input', (e) => {
    elements.totalClaimsVal.textContent = e.target.value;
    runPrediction();
  });

  elements.priorArtInput.addEventListener('input', (e) => {
    elements.priorArtVal.textContent = e.target.value;
    runPrediction();
  });

  elements.btnRecalculate.addEventListener('click', runPrediction);
  
  elements.btnReset.addEventListener('click', () => {
    elements.techCenterSelect.value = "2100";
    updateArtUnits();
    elements.trackSelect.value = "standard";
    elements.entitySelect.value = "small";
    elements.indepClaimsInput.value = 3;
    elements.indepClaimsVal.textContent = 3;
    elements.totalClaimsInput.value = 20;
    elements.totalClaimsVal.textContent = 20;
    elements.priorArtInput.value = 12;
    elements.priorArtVal.textContent = 12;
    elements.examinerSelect.value = "moderate";
    elements.caseStudySelect.value = "";
    runPrediction();
  });

  // Case Study Selector
  elements.caseStudySelect.addEventListener('change', (e) => {
    if (e.target.value) {
      loadCaseStudy(e.target.value);
    }
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // NLP Analyzer button
  if (elements.btnAnalyzeText) {
    elements.btnAnalyzeText.addEventListener('click', handleNlpAnalysis);
  }

  // Export buttons
  elements.btnExportJson.addEventListener('click', () => {
    if (state.currentPrediction) exportToJson(state.currentPrediction);
  });

  elements.btnExportCsv.addEventListener('click', () => {
    if (state.currentPrediction) exportToCsv(state.currentPrediction);
  });

  elements.btnPrintDossier.addEventListener('click', printExecutiveDossier);

  // Window resize re-renders canvas charts
  window.addEventListener('resize', () => {
    if (state.currentPrediction) {
      renderMonteCarloHistogram('monteCarloHistogramCanvas', state.currentPrediction.sim);
      renderSurvivalCurve('survivalCurveCanvas', state.currentPrediction.sim);
    }
  });
}

/**
 * Application Entry Point
 */
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  
  // Set default filing date to today
  if (elements.filingDateInput) {
    elements.filingDateInput.value = formatDate(new Date());
  }

  populateTechCenters();
  populateCaseStudies();
  bindEvents();

  // Run initial baseline prediction
  runPrediction();
});
