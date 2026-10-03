/**
 * Monte Carlo Survival Simulation Engine for Patent Prosecution
 * Utilizes calibrated Weibull and Log-Normal renewal distributions for USPTO docket cycles.
 */

import { TECH_CENTERS, TRACKS } from './data.js';

/**
 * Box-Muller Gaussian random number generator
 */
function randomGaussian(mean = 0, stdDev = 1) {
  let u1 = Math.random();
  let u2 = Math.random();
  while (u1 === 0) u1 = Math.random(); // avoid log(0)
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Weibull random variable generator
 * Formula: X = scale * (-ln(1 - U))^(1 / shape)
 */
function randomWeibull(shape, scale) {
  const u = Math.random();
  return scale * Math.pow(-Math.log(1 - u), 1 / shape);
}

/**
 * Clamp a number within [min, max]
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Run Monte Carlo simulation over N iterations
 * @param {Object} params - Application input parameters
 * @param {number} iterations - Number of stochastic trials (default 2000)
 */
export function runMonteCarloSimulation(params, iterations = 2000) {
  const tc = TECH_CENTERS[params.techCenterId] || TECH_CENTERS["2100"];
  const track = TRACKS[params.track] || TRACKS.standard;
  
  // Specific Art Unit modifier if available
  let artUnitAllowance = tc.allowanceRate;
  let artUnitFOA = tc.avgFOAMonths;
  if (params.artUnitId) {
    const au = tc.artUnits.find(a => a.id === params.artUnitId);
    if (au) {
      artUnitAllowance = au.allowanceRate;
      artUnitFOA = au.avgFOA;
    }
  }

  // Examiner profile multiplier
  // lenient: +15% allowance, -10% time
  // moderate: baseline
  // strict: -20% allowance, +18% time
  let examinerSpeedMult = 1.0;
  let examinerAllowanceDelta = 0.0;
  if (params.examinerProfile === "lenient") {
    examinerSpeedMult = 0.90;
    examinerAllowanceDelta = 0.12;
  } else if (params.examinerProfile === "strict") {
    examinerSpeedMult = 1.18;
    examinerAllowanceDelta = -0.15;
  }

  // Claim complexity penalty: more claims = longer examination and higher OA risk
  const indepClaims = Math.max(1, params.indepClaims || 3);
  const totalClaims = Math.max(indepClaims, params.totalClaims || 20);
  const claimPenalty = Math.max(0, (totalClaims - 20) * 0.015 + (indepClaims - 3) * 0.03);

  // Effective Base Allowance Probability
  const effectiveAllowanceProb = clamp(
    artUnitAllowance + track.allowanceBoost + examinerAllowanceDelta - claimPenalty,
    0.20,
    0.95
  );

  // Effective Time to First Office Action (FOA)
  let baseFOAMean = artUnitFOA * examinerSpeedMult;
  if (track.id === "trackOne") {
    baseFOAMean = 3.6; // Track One target FOA is ~3-4 months
  } else if (track.id === "pph") {
    baseFOAMean = Math.max(5.5, baseFOAMean * 0.55);
  } else if (track.id === "accelerated") {
    baseFOAMean = Math.max(4.5, baseFOAMean * 0.45);
  }

  const results = [];
  let grantCount = 0;
  let zeroRceCount = 0;
  let oneRceCount = 0;
  let multiRceCount = 0;
  let abandonedCount = 0;
  let totalOACountSum = 0;

  for (let i = 0; i < iterations; i++) {
    // 1. Time from filing to First Office Action
    const foaStd = track.id === "trackOne" ? 0.8 : (tc.stdDevFOA * examinerSpeedMult * 0.9);
    const foaMonths = Math.max(2.5, randomGaussian(baseFOAMean, foaStd));

    // 2. First action outcome
    // Direct allowance on first action occurs ~5-15% based on track and tech center
    const firstActionAllowanceProb = (track.id === "pph" ? 0.18 : 0.06) + (params.examinerProfile === "lenient" ? 0.05 : 0);
    const isFirstActionAllowance = Math.random() < firstActionAllowanceProb;

    let totalDurationMonths = foaMonths;
    let oaCount = 1;
    let rceCount = 0;
    let isGranted = false;

    if (isFirstActionAllowance) {
      isGranted = true;
      // Time from allowance to issue (~2.5 - 3.5 months)
      totalDurationMonths += randomGaussian(3.0, 0.4);
      zeroRceCount++;
    } else {
      // Non-final rejection -> applicant response (2.5 - 3.5 months)
      const responseTime = randomGaussian(2.8, 0.5);
      totalDurationMonths += Math.max(1.5, responseTime);

      // Examiner reviews response: either Notice of Allowance or Final Rejection
      // Probability of allowance after 1st response
      const allowanceAfterRespProb = effectiveAllowanceProb * 0.65;
      const isAllowedRound1 = Math.random() < allowanceAfterRespProb;

      if (isAllowedRound1) {
        isGranted = true;
        totalDurationMonths += randomGaussian(3.0, 0.5);
        zeroRceCount++;
      } else {
        // Final Office Action issued
        oaCount++;
        const finalOaReviewTime = randomGaussian(2.4, 0.6);
        totalDurationMonths += Math.max(1.2, finalOaReviewTime);

        // Applicant decides: File RCE (65%), Appeal (12%), or Abandon (23%)
        const postFinalRoll = Math.random();
        if (postFinalRoll < 0.65) {
          // File RCE
          rceCount++;
          // RCE docket cycle adds ~8 - 14 months
          const rceCycle = randomWeibull(2.4, track.id === "trackOne" ? 5.5 : 10.5);
          totalDurationMonths += Math.max(4.0, rceCycle);
          oaCount++;

          // RCE outcome
          const rceAllowanceProb = effectiveAllowanceProb * 0.75;
          if (Math.random() < rceAllowanceProb) {
            isGranted = true;
            oneRceCount++;
            totalDurationMonths += randomGaussian(3.0, 0.5);
          } else {
            // Second Final Rejection
            if (Math.random() < 0.40) {
              // 2nd RCE
              rceCount++;
              oaCount++;
              multiRceCount++;
              totalDurationMonths += randomWeibull(2.2, 9.5);
              if (Math.random() < effectiveAllowanceProb * 0.6) {
                isGranted = true;
                totalDurationMonths += randomGaussian(3.0, 0.5);
              } else {
                abandonedCount++;
              }
            } else {
              abandonedCount++;
            }
          }
        } else if (postFinalRoll < 0.77) {
          // PTAB Appeal
          // Adds 18 to 28 months
          const appealDuration = randomGaussian(22.0, 4.0);
          totalDurationMonths += Math.max(12.0, appealDuration);
          // Board win rate ~40%
          if (Math.random() < 0.42) {
            isGranted = true;
            totalDurationMonths += 3.0;
            zeroRceCount++;
          } else {
            abandonedCount++;
          }
        } else {
          // Abandonment
          abandonedCount++;
        }
      }
    }

    if (isGranted) grantCount++;
    totalOACountSum += oaCount;

    results.push({
      duration: Math.round(totalDurationMonths * 10) / 10,
      foaDuration: Math.round(foaMonths * 10) / 10,
      oaCount,
      rceCount,
      isGranted
    });
  }

  // Sort durations to calculate percentiles
  results.sort((a, b) => a.duration - b.duration);

  const getPercentile = (p) => {
    const idx = Math.floor(results.length * p);
    return results[Math.min(idx, results.length - 1)].duration;
  };

  const p10 = getPercentile(0.10);
  const p25 = getPercentile(0.25);
  const median = getPercentile(0.50);
  const p75 = getPercentile(0.75);
  const p90 = getPercentile(0.90);

  const sum = results.reduce((acc, r) => acc + r.duration, 0);
  const mean = Math.round((sum / results.length) * 10) / 10;

  // Build histogram distribution (bins of 3 months from 6 to 60)
  const minBin = 6;
  const maxBin = 60;
  const binStep = 3;
  const bins = [];
  for (let b = minBin; b <= maxBin; b += binStep) {
    bins.push({
      label: `${b}-${b + binStep}m`,
      start: b,
      end: b + binStep,
      count: 0
    });
  }

  results.forEach(r => {
    for (const bin of bins) {
      if (r.duration >= bin.start && r.duration < bin.end) {
        bin.count++;
        break;
      }
    }
  });

  return {
    iterations,
    metrics: {
      mean,
      median,
      p10,
      p25,
      p75,
      p90,
      grantProbability: Math.round((grantCount / iterations) * 100),
      abandonmentRisk: Math.round((abandonedCount / iterations) * 100),
      expectedOACount: Math.round((totalOACountSum / iterations) * 10) / 10,
      breakdown: {
        zeroRceGrantPct: Math.round((zeroRceCount / iterations) * 100),
        oneRceGrantPct: Math.round((oneRceCount / iterations) * 100),
        multiRceGrantPct: Math.round((multiRceCount / iterations) * 100)
      }
    },
    histogram: bins.map(b => ({
      label: b.label,
      percentage: Math.round((b.count / iterations) * 1000) / 10
    })),
    rawSamples: results.slice(0, 100) // sample slice for preview
  };
}
