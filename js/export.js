/**
 * Export & Report Generation Utility
 * Generates print/PDF dossiers, JSON data exports, and CSV milestone schedules.
 */

export function exportToJson(predictionData) {
  const exportPayload = {
    exportDate: new Date().toISOString(),
    project: "Patent Prosecution Timeline Predictor",
    version: "2.4.0",
    applicationParameters: predictionData.params,
    technologyCenter: predictionData.techCenter,
    track: predictionData.trackInfo,
    simulationMetrics: predictionData.sim.metrics,
    budgetForecast: predictionData.budget,
    milestones: predictionData.milestones,
    scenarios: predictionData.scenarios,
    trackComparison: predictionData.trackComparison
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  const filename = `Patent_Timeline_Forecast_${predictionData.params.techCenterId}_${Date.now()}.json`;
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsv(predictionData) {
  const rows = [
    ["Patent Prosecution Timeline & Budget Forecast"],
    ["Generated At", new Date().toLocaleString()],
    ["Technology Center", `${predictionData.techCenter.id} - ${predictionData.techCenter.name}`],
    ["Filing Track", predictionData.trackInfo.name],
    ["Entity Size", predictionData.params.entity],
    ["Expected Median Duration (Months)", predictionData.sim.metrics.median],
    ["Grant Probability (%)", `${predictionData.sim.metrics.grantProbability}%`],
    ["Total Estimated Budget (USD)", `$${predictionData.budget.expectedTotalOverall}`],
    [],
    ["Milestone Schedule"],
    ["Milestone", "Expected Months from Filing", "Projected Date", "Description", "Stage Budget"]
  ];

  predictionData.milestones.forEach(m => {
    rows.push([
      `"${m.name}"`,
      m.expectedMonths,
      m.expectedDate,
      `"${m.description}"`,
      `"${m.costStage}"`
    ]);
  });

  rows.push([]);
  rows.push(["Multi-Track Comparison"]);
  rows.push(["Track Name", "Median Duration (Months)", "P90 Backlog (Months)", "Grant Probability (%)", "Expected Cost (USD)"]);
  predictionData.trackComparison.forEach(tc => {
    rows.push([
      `"${tc.trackName}"`,
      tc.medianMonths,
      tc.p90Months,
      `${tc.grantProbability}%`,
      `$${tc.totalExpectedCost}`
    ]);
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Patent_Prosecution_Schedule_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function printExecutiveDossier() {
  window.print();
}
