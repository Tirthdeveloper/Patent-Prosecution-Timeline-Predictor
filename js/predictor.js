/**
 * Patent Prosecution Timeline & Cost Predictor
 * Computes calendar milestone schedules, multi-track comparisons, and financial budget projections.
 */

import { TECH_CENTERS, TRACKS, BASE_FEES, ATTORNEY_ESTIMATES, ENTITY_TYPES } from './data.js';
import { runMonteCarloSimulation } from './monte_carlo.js';

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add fractional months to a date
 */
export function addMonths(date, months) {
  const d = new Date(date);
  const totalDays = Math.round(months * 30.4375);
  d.setDate(d.getDate() + totalDays);
  return d;
}

/**
 * Format currency in USD
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate statutory USPTO official fees and legal cost estimates
 */
export function calculateBudget(params) {
  const entity = params.entity || 'small';
  const track = params.track || 'standard';
  const totalClaims = Math.max(1, params.totalClaims || 20);
  const indepClaims = Math.max(1, params.indepClaims || 3);
  
  // Official USPTO fee components
  let ptoFiling = BASE_FEES.filingSearchExam[entity];
  
  // Excess claims fees
  const excessIndep = Math.max(0, indepClaims - 3);
  const excessTotal = Math.max(0, totalClaims - 20);
  const excessIndepFee = excessIndep * BASE_FEES.excessIndependentClaim[entity];
  const excessTotalFee = excessTotal * BASE_FEES.excessTotalClaim[entity];
  
  // Track One fee if selected
  const trackOneFee = track === 'trackOne' ? BASE_FEES.trackOneFee[entity] : 0;
  
  // Initial filing stage PTO total
  const initialPtoTotal = ptoFiling + excessIndepFee + excessTotalFee + trackOneFee;
  
  // Legal attorney fee for preparation, drafting & filing
  const legalDrafting = ATTORNEY_ESTIMATES.draftingAndFiling;
  
  // Office Action response estimates (assume avg ~1.5 - 2 OAs)
  const isBiotechOrSoftware = ['1600', '2100', '3600'].includes(params.techCenterId);
  const oaLegalUnit = isBiotechOrSoftware ? ATTORNEY_ESTIMATES.foaResponseComplexityBase * 1.15 : ATTORNEY_ESTIMATES.foaResponseComplexityBase;
  const expectedOAResponseLegal = oaLegalUnit * 1.5;
  
  // RCE fees (risk-adjusted expectation)
  const rcePto = BASE_FEES.firstRceFee[entity];
  const rceLegal = ATTORNEY_ESTIMATES.finalOaRceResponse;
  
  // Issue fee
  const issuePto = BASE_FEES.noticeOfAllowance[entity];
  const issueLegal = ATTORNEY_ESTIMATES.issueFormalities;
  
  // Baseline Expected Budget (Total)
  const expectedTotalPTO = Math.round(initialPtoTotal + (rcePto * 0.35) + issuePto);
  const expectedTotalLegal = Math.round(legalDrafting + expectedOAResponseLegal + (rceLegal * 0.35) + issueLegal);
  const expectedTotalOverall = expectedTotalPTO + expectedTotalLegal;

  // Breakdown by timeline milestones
  const milestoneExpenses = [
    {
      stage: "Filing Stage",
      ptoFee: initialPtoTotal,
      legalFee: legalDrafting,
      total: initialPtoTotal + legalDrafting,
      description: "USPTO filing, search, exam, excess claim surcharges + drafting attorney costs"
    },
    {
      stage: "First Office Action (FOA)",
      ptoFee: 0,
      legalFee: Math.round(oaLegalUnit),
      total: Math.round(oaLegalUnit),
      description: "Prior art search analysis, claim amendments, 35 U.S.C. 102/103/112 formal response"
    },
    {
      stage: "Subsequent Action / RCE (Expected)",
      ptoFee: Math.round(rcePto * 0.35),
      legalFee: Math.round(rceLegal * 0.35),
      total: Math.round((rcePto + rceLegal) * 0.35),
      description: "Probability-weighted RCE filing and secondary examiner interview"
    },
    {
      stage: "Allowance & Issuance",
      ptoFee: issuePto,
      legalFee: issueLegal,
      total: issuePto + issueLegal,
      description: "Statutory issue fee + formal patent assignment and certificate issuance"
    }
  ];

  return {
    initialPtoTotal,
    trackOneFee,
    excessClaimsFee: excessIndepFee + excessTotalFee,
    expectedTotalPTO,
    expectedTotalLegal,
    expectedTotalOverall,
    milestoneExpenses
  };
}

/**
 * Predict full prosecution milestones across Median, Accelerated, and Conservative paths
 */
export function predictTimeline(params) {
  const filingDate = params.filingDate ? new Date(params.filingDate) : new Date();
  const sim = runMonteCarloSimulation(params, 2500);
  const budget = calculateBudget(params);
  const tc = TECH_CENTERS[params.techCenterId] || TECH_CENTERS["2100"];
  const track = TRACKS[params.track] || TRACKS.standard;

  // 18-month statutory publication milestone
  const pubDate = addMonths(filingDate, 18.0);

  // Median / Expected Path milestones
  const foaMonthsMedian = params.track === 'trackOne' ? 3.6 : (sim.metrics.median * 0.58);
  const foaDateMedian = addMonths(filingDate, foaMonthsMedian);
  const respDateMedian = addMonths(foaDateMedian, 3.0);
  const noaDateMedian = addMonths(filingDate, Math.max(foaMonthsMedian + 4.5, sim.metrics.median - 3.2));
  const grantDateMedian = addMonths(filingDate, sim.metrics.median);

  // Accelerated / Best-Case Path milestones (P25 or Track One optimum)
  const durationP25 = sim.metrics.p25;
  const foaDateP25 = addMonths(filingDate, Math.max(3.0, foaMonthsMedian * 0.7));
  const grantDateP25 = addMonths(filingDate, durationP25);

  // Conservative / P90 Path milestones (with RCE)
  const durationP90 = sim.metrics.p90;
  const foaDateP90 = addMonths(filingDate, foaMonthsMedian * 1.3);
  const rceDateP90 = addMonths(foaDateP90, 7.5);
  const grantDateP90 = addMonths(filingDate, durationP90);

  const milestones = [
    {
      id: "filing",
      name: "Application Filing",
      description: "Official non-provisional application deposited at USPTO",
      expectedMonths: 0,
      expectedDate: formatDate(filingDate),
      status: "completed",
      costStage: "Filing Stage"
    },
    {
      id: "publication",
      name: "18-Month Publication",
      description: "Public disclosure under 35 U.S.C. 122(b) & provisional rights established",
      expectedMonths: 18.0,
      expectedDate: formatDate(pubDate),
      status: "scheduled",
      costStage: "Public Inspection"
    },
    {
      id: "foa",
      name: "First Office Action (FOA)",
      description: "Examiner's initial detailed merits review (102/103 prior art cited)",
      expectedMonths: Math.round(foaMonthsMedian * 10) / 10,
      expectedDate: formatDate(foaDateMedian),
      status: "pending",
      costStage: "First Office Action"
    },
    {
      id: "applicant_response",
      name: "Applicant Response & Amendments",
      description: "Formal claim amendments and traverse arguments submitted",
      expectedMonths: Math.round((foaMonthsMedian + 3.0) * 10) / 10,
      expectedDate: formatDate(respDateMedian),
      status: "pending",
      costStage: "Office Action Response"
    },
    {
      id: "noa",
      name: "Notice of Allowance (NOA)",
      description: "Examiner closes prosecution; all pending claims held patentable",
      expectedMonths: Math.round((sim.metrics.median - 3.2) * 10) / 10,
      expectedDate: formatDate(noaDateMedian),
      status: "pending",
      costStage: "Allowance"
    },
    {
      id: "grant",
      name: "Patent Grant & Issuance",
      description: "Letters Patent officially issued with Patent Number",
      expectedMonths: Math.round(sim.metrics.median * 10) / 10,
      expectedDate: formatDate(grantDateMedian),
      status: "pending",
      costStage: "Issuance"
    }
  ];

  // Multi-Track Comparison Matrix
  const trackComparison = Object.keys(TRACKS).map(trackKey => {
    const trackOpt = TRACKS[trackKey];
    const trackSim = runMonteCarloSimulation({ ...params, track: trackKey }, 1200);
    const trackBudget = calculateBudget({ ...params, track: trackKey });
    return {
      trackKey,
      trackName: trackOpt.name,
      badge: trackOpt.badge,
      medianMonths: trackSim.metrics.median,
      p90Months: trackSim.metrics.p90,
      foaMonths: trackKey === 'trackOne' ? 3.6 : Math.round((trackSim.metrics.median * 0.58) * 10) / 10,
      grantProbability: trackSim.metrics.grantProbability,
      totalExpectedCost: trackBudget.expectedTotalOverall,
      ptoCost: trackBudget.expectedTotalPTO,
      legalCost: trackBudget.expectedTotalLegal
    };
  });

  return {
    params,
    techCenter: tc,
    trackInfo: track,
    sim,
    budget,
    milestones,
    scenarios: {
      accelerated: {
        label: "Best-Case / Fast-Track (P25)",
        durationMonths: durationP25,
        grantDate: formatDate(grantDateP25),
        foaDate: formatDate(foaDateP25)
      },
      median: {
        label: "Expected Median Path (P50)",
        durationMonths: sim.metrics.median,
        grantDate: formatDate(grantDateMedian),
        foaDate: formatDate(foaDateMedian)
      },
      conservative: {
        label: "Conservative / Backlog Path (P90)",
        durationMonths: durationP90,
        grantDate: formatDate(grantDateP90),
        foaDate: formatDate(foaDateP90),
        rceDate: formatDate(rceDateP90)
      }
    },
    trackComparison
  };
}
