/**
 * Patent Prosecution Visual Analytics & Charting Engine
 * Native high-DPI Canvas & SVG rendering for Gantt timelines, Monte Carlo histograms,
 * Kaplan-Meier survival curves, and cashflow projections.
 */

/**
 * Render Interactive Gantt Timeline
 */
export function renderGanttTimeline(containerId, predictionData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scenarios = predictionData.scenarios;
  const maxMonths = Math.max(48, scenarios.conservative.durationMonths + 4);

  const tracks = [
    {
      label: scenarios.accelerated.label,
      duration: scenarios.accelerated.durationMonths,
      color: "var(--accent-emerald)",
      foa: Math.min(predictionData.sim.metrics.foaDuration || 4, scenarios.accelerated.durationMonths * 0.4),
      pub: 18,
      grantDate: scenarios.accelerated.grantDate,
      badge: "Fast Track"
    },
    {
      label: scenarios.median.label,
      duration: scenarios.median.durationMonths,
      color: "var(--accent-cyan)",
      foa: scenarios.median.durationMonths * 0.58,
      pub: 18,
      grantDate: scenarios.median.grantDate,
      badge: "Target Baseline"
    },
    {
      label: scenarios.conservative.label,
      duration: scenarios.conservative.durationMonths,
      color: "var(--accent-amber)",
      foa: scenarios.conservative.durationMonths * 0.52,
      pub: 18,
      grantDate: scenarios.conservative.grantDate,
      badge: "Risk Adjusted (RCE)"
    }
  ];

  let html = `
    <div class="gantt-wrapper">
      <div class="gantt-header-row">
        <div class="gantt-track-label-col">Prosecution Path</div>
        <div class="gantt-timeline-scale">
          <div class="gantt-tick-mark" style="left: 0%"><span>0m (Filing)</span></div>
          <div class="gantt-tick-mark" style="left: ${(12 / maxMonths) * 100}%"><span>12m</span></div>
          <div class="gantt-tick-mark" style="left: ${(18 / maxMonths) * 100}%"><span>18m (Pub)</span></div>
          <div class="gantt-tick-mark" style="left: ${(24 / maxMonths) * 100}%"><span>24m</span></div>
          <div class="gantt-tick-mark" style="left: ${(36 / maxMonths) * 100}%"><span>36m</span></div>
          <div class="gantt-tick-mark" style="left: ${(48 / maxMonths) * 100}%"><span>48m</span></div>
        </div>
      </div>
  `;

  tracks.forEach(t => {
    const totalPct = Math.min(100, (t.duration / maxMonths) * 100);
    const foaPct = Math.min(100, (t.foa / maxMonths) * 100);
    const pubPct = Math.min(100, (18 / maxMonths) * 100);

    html += `
      <div class="gantt-row">
        <div class="gantt-track-info">
          <div class="gantt-track-name">${t.label}</div>
          <div class="gantt-track-badge" style="border-color: ${t.color}; color: ${t.color}">${t.badge}</div>
          <div class="gantt-track-duration"><strong>${t.duration}</strong> months (Est. Grant: ${t.grantDate})</div>
        </div>
        <div class="gantt-track-bar-area">
          <div class="gantt-grid-line" style="left: 0%"></div>
          <div class="gantt-grid-line" style="left: ${(12 / maxMonths) * 100}%"></div>
          <div class="gantt-grid-line" style="left: ${(18 / maxMonths) * 100}%"></div>
          <div class="gantt-grid-line" style="left: ${(24 / maxMonths) * 100}%"></div>
          <div class="gantt-grid-line" style="left: ${(36 / maxMonths) * 100}%"></div>
          <div class="gantt-grid-line" style="left: ${(48 / maxMonths) * 100}%"></div>

          <!-- Active Prosecution Span Bar -->
          <div class="gantt-bar-fill" style="width: ${totalPct}%; background: linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, ${t.color}44 70%, ${t.color} 100%);">
            
            <!-- FOA Milestone Pin -->
            <div class="gantt-pin foa-pin" style="left: ${(foaPct / totalPct) * 100}%" title="First Office Action: ~${Math.round(t.foa)}m">
              <span class="pin-dot"></span>
              <span class="pin-text">FOA</span>
            </div>

            <!-- Publication Pin (if within total) -->
            ${t.duration >= 18 ? `
              <div class="gantt-pin pub-pin" style="left: ${(pubPct / totalPct) * 100}%" title="18-Month Statutory Publication">
                <span class="pin-dot pub-dot"></span>
                <span class="pin-text">18M Pub</span>
              </div>
            ` : ''}

            <!-- Grant Pin -->
            <div class="gantt-pin grant-pin" style="left: 100%" title="Notice of Allowance & Grant: ${t.duration}m">
              <span class="pin-dot grant-dot"></span>
              <span class="pin-text">Grant</span>
            </div>

          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render Monte Carlo Duration Histogram
 */
export function renderMonteCarloHistogram(canvasId, simData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // High-DPI Canvas scaling
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 25, right: 30, bottom: 45, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const bins = simData.histogram || [];
  if (bins.length === 0) return;

  const maxPct = Math.max(...bins.map(b => b.percentage), 15);

  // Background grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = (maxPct / gridSteps) * i;
    const y = padding.top + chartH - (i / gridSteps) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(yVal)}%`, padding.left - 8, y + 4);
  }

  // Draw Bars
  const barGap = 6;
  const barWidth = (chartW / bins.length) - barGap;

  bins.forEach((b, idx) => {
    const x = padding.left + idx * (barWidth + barGap);
    const barHeight = (b.percentage / maxPct) * chartH;
    const y = padding.top + chartH - barHeight;

    // Gradient for bars
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.9)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.4)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    // Bar border highlight
    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // X-axis label (every alternate label to avoid clutter)
    if (idx % 2 === 0 || idx === bins.length - 1) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.label, x + barWidth / 2, h - padding.bottom + 16);
    }
  });

  // Vertical Percentile Markers
  const metrics = simData.metrics;
  const drawMarker = (valMonths, label, color) => {
    // Map valMonths (6 to 60) to x-pixel
    const minM = 6;
    const maxM = 60;
    const ratio = Math.max(0, Math.min(1, (valMonths - minM) / (maxM - minM)));
    const markerX = padding.left + ratio * chartW;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(markerX, padding.top);
    ctx.lineTo(markerX, padding.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Callout badge
    ctx.fillStyle = color;
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${label}: ${valMonths}m`, markerX, padding.top - 8);
  };

  drawMarker(metrics.median, "Median", "#38bdf8");
  drawMarker(metrics.p90, "P90", "#f59e0b");

  // X Axis Title
  ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Total Prosecution Duration (Months from Filing)", padding.left + chartW / 2, h - 8);
}

/**
 * Render Kaplan-Meier Style Survival Curve
 */
export function renderSurvivalCurve(canvasId, simData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 25, right: 30, bottom: 45, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  // Compute Empirical Survival Function S(t) = P(Duration > t)
  const sorted = [...(simData.rawSamples || [])].map(s => s.duration).sort((a, b) => a - b);
  const timePoints = [];
  for (let m = 0; m <= 60; m += 1) {
    let pendingCount = 0;
    sorted.forEach(d => {
      if (d > m) pendingCount++;
    });
    const survivalProb = sorted.length > 0 ? (pendingCount / sorted.length) : 0;
    timePoints.push({ month: m, survivalProb });
  }

  // Grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  for (let p = 0; p <= 100; p += 25) {
    const y = padding.top + chartH - (p / 100) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${p}%`, padding.left - 8, y + 4);
  }

  // Draw Area fill under curve
  ctx.beginPath();
  timePoints.forEach((tp, idx) => {
    const x = padding.left + (tp.month / 60) * chartW;
    const y = padding.top + chartH - (tp.survivalProb * chartH);
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();

  const fillGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  fillGradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  fillGradient.addColorStop(1, "rgba(16, 185, 129, 0.02)");
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // Draw Survival Line
  ctx.beginPath();
  timePoints.forEach((tp, idx) => {
    const x = padding.left + (tp.month / 60) * chartW;
    const y = padding.top + chartH - (tp.survivalProb * chartH);
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // X Axis Ticks
  [0, 12, 18, 24, 36, 48, 60].forEach(m => {
    const x = padding.left + (m / 60) * chartW;
    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${m}m`, x, h - padding.bottom + 16);
  });

  // Labels
  ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Prosecution Timeline (Months)", padding.left + chartW / 2, h - 8);

  ctx.save();
  ctx.translate(14, padding.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Active Pendency Probability S(t)", 0, 0);
  ctx.restore();
}

/**
 * Render Cumulative Cost Forecast Waterfall
 */
export function renderCostChart(containerId, budgetData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const expenses = budgetData.milestoneExpenses || [];
  let cumulative = 0;

  let html = `
    <div class="cost-schedule-table">
      <div class="cost-header-row">
        <span>Prosecution Milestone</span>
        <span>USPTO Official Fee</span>
        <span>Legal / Attorney</span>
        <span>Stage Total</span>
        <span>Cumulative Total</span>
      </div>
  `;

  expenses.forEach(item => {
    cumulative += item.total;
    html += `
      <div class="cost-row">
        <div class="cost-milestone-title">
          <strong>${item.stage}</strong>
          <small>${item.description}</small>
        </div>
        <div class="cost-col pto-fee">$${item.ptoFee.toLocaleString()}</div>
        <div class="cost-col legal-fee">$${item.legalFee.toLocaleString()}</div>
        <div class="cost-col stage-total"><strong>$${item.total.toLocaleString()}</strong></div>
        <div class="cost-col cumulative-total"><span class="badge-total">$${cumulative.toLocaleString()}</span></div>
      </div>
    `;
  });

  html += `
      <div class="cost-summary-bar">
        <div class="cost-summary-item">
          <span class="label">Total Official PTO Fees:</span>
          <span class="val">$${budgetData.expectedTotalPTO.toLocaleString()}</span>
        </div>
        <div class="cost-summary-item">
          <span class="label">Total Attorney & Legal Fees:</span>
          <span class="val">$${budgetData.expectedTotalLegal.toLocaleString()}</span>
        </div>
        <div class="cost-summary-item highlight">
          <span class="label">Overall Estimated Budget:</span>
          <span class="val">$${budgetData.expectedTotalOverall.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}
