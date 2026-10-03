/**
 * Patent Application NLP & Heuristic Classifier
 * Parses Title, Abstract, and Claims to predict USPTO Tech Center, Art Unit,
 * claim complexity index, and 35 U.S.C. §101 / §112 rejection risks.
 */

import { TECH_CENTERS } from './data.js';

const KEYWORD_MAPPINGS = [
  {
    tc: "1600",
    au: "1634",
    keywords: ["crispr", "cas9", "cas13", "rna", "dna", "nucleic", "antibody", "antigen", "peptide", "protein", "monoclonal", "vector", "plasmid", "cell", "therapeutic", "virus", "enzyme", "assay", "in vitro", "polypeptide", "mrna", "gene", "biomarker"]
  },
  {
    tc: "1700",
    au: "1721",
    keywords: ["electrolyte", "battery", "anode", "cathode", "lithium", "solid-state", "polymer", "nanoparticle", "catalyst", "ceramic", "composite", "alloy", "coating", "chemical", "solvent", "metallurgy", "exothermic", "monomer"]
  },
  {
    tc: "2100",
    au: "2121",
    keywords: ["neural network", "machine learning", "deep learning", "inference", "artificial intelligence", "tensor", "model", "processor", "gpu", "cpu", "memory controller", "cache", "compiler", "instruction set", "instruction pipeline", "fpga", "accelerator", "cloud", "virtual machine"]
  },
  {
    tc: "2400",
    au: "2441",
    keywords: ["cryptographic", "cipher", "encryption", "decryption", "zero-knowledge", "authentication", "packet", "routing", "switch", "router", "firewall", "wireless", "5g", "6g", "lte", "handshake", "peer-to-peer", "gateway", "latency"]
  },
  {
    tc: "2600",
    au: "2624",
    keywords: ["image processing", "pixel", "display", "oled", "camera", "sensor", "lens", "codec", "video encoding", "audio", "h.265", "av1", "optical", "holographic", "color gamut", "filtering"]
  },
  {
    tc: "2800",
    au: "2811",
    keywords: ["semiconductor", "wafer", "finfet", "transistor", "gate", "drain", "source", "lithography", "etching", "dielectric", "photolithography", "silicon", "doping", "substrate", "interconnect", "gan", "sic", "mosfet"]
  },
  {
    tc: "3600",
    au: "3689",
    keywords: ["transaction", "blockchain", "smart contract", "payment", "financial", "trading", "e-commerce", "billing", "settlement", "liquidity", "auction", "order", "inventory", "vehicle powertrain", "automotive chassis"]
  },
  {
    tc: "3700",
    au: "3731",
    keywords: ["catheter", "surgical", "robotic arm", "end-effector", "implant", "laparoscopic", "stent", "needle", "prosthetic", "actuator", "nozzle", "turbine", "valve", "hydraulics", "mechanical linkage", "torque", "gearbox"]
  }
];

export function analyzePatentText(text, indepClaimsCount = 3, totalClaimsCount = 20) {
  const normalized = (text || "").toLowerCase();
  
  // 1. Scoring Tech Centers based on keyword occurrences
  const scores = {};
  Object.keys(TECH_CENTERS).forEach(tc => scores[tc] = 0);
  let bestAU = null;
  let highestScore = 0;
  let detectedTC = "2100"; // fallback

  KEYWORD_MAPPINGS.forEach(mapping => {
    let count = 0;
    mapping.keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = normalized.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    scores[mapping.tc] = (scores[mapping.tc] || 0) + count;
    if (scores[mapping.tc] > highestScore) {
      highestScore = scores[mapping.tc];
      detectedTC = mapping.tc;
      bestAU = mapping.au;
    }
  });

  // If no keywords matched, default to 2100
  if (highestScore === 0) {
    detectedTC = "2100";
    bestAU = "2121";
  }

  // 2. Claim Complexity Metrics
  const words = normalized.split(/\s+/).filter(w => w.length > 0).length;
  const whereinCount = (normalized.match(/\bwherein\b/gi) || []).length;
  const comprisingCount = (normalized.match(/\bcomprising\b/gi) || []).length;
  const meansCount = (normalized.match(/\bmeans for\b/gi) || []).length; // 112(f) risk!

  let complexityLevel = "Standard";
  let complexityScore = 50;

  if (totalClaimsCount > 25 || whereinCount > 15 || words > 1200) {
    complexityScore = 85;
    complexityLevel = "High";
  } else if (totalClaimsCount > 35 || whereinCount > 25 || words > 2000) {
    complexityScore = 95;
    complexityLevel = "Very High";
  } else if (totalClaimsCount < 15 && words < 600) {
    complexityScore = 30;
    complexityLevel = "Low";
  }

  // 3. Statutory Risk Checks
  // § 101 Risk (Alice / Abstract Idea)
  let section101Risk = "Low";
  let section101Description = "Low abstract idea vulnerability under 35 U.S.C. 101.";
  if (detectedTC === "3600" || (detectedTC === "2100" && !normalized.includes("hardware") && !normalized.includes("circuit") && !normalized.includes("processor"))) {
    section101Risk = "High";
    section101Description = "Vulnerable to Mayo/Alice Step 2B abstract idea rejection. Add hardware-tied improvements to technical process.";
  } else if (detectedTC === "2100") {
    section101Risk = "Moderate";
    section101Description = "Ensure algorithmic claims recite specific computational improvements over existing computer functionality.";
  }

  // § 112 Risk (Definiteness / Means-plus-Function / Written Description)
  let section112Risk = "Low";
  let section112Description = "Claim terms appear adequately grounded with structural support.";
  if (meansCount > 0) {
    section112Risk = "High";
    section112Description = `Detected ${meansCount} "means for" clause(s). Invokes 35 U.S.C. 112(f) requiring strict specification structural correspondence.`;
  } else if (detectedTC === "1600" && words < 500) {
    section112Risk = "Moderate";
    section112Description = "Biotechnology genus claims require rigorous enablement across full range of disclosed variants.";
  }

  // Recommendations
  const recommendations = [];
  if (totalClaimsCount > 20) {
    recommendations.push(`Reduce total claims from ${totalClaimsCount} to ≤20 to avoid USPTO excess claims surcharges ($${(totalClaimsCount - 20) * 100} large entity fee).`);
  }
  if (indepClaimsCount > 3) {
    recommendations.push(`Limit independent claims to 3 to eliminate statutory independent excess fees ($${(indepClaimsCount - 3) * 480} large entity).`);
  }
  if (section101Risk === "High") {
    recommendations.push("Frame claims around measurable technical improvements (e.g. latency reduction, memory footprint) to overcome Alice §101 rejections.");
  }
  if (section112Risk === "High") {
    recommendations.push("Replace functional 'means for' clauses with concrete structural terms (e.g., 'controller configured to', 'asynchronous tensor pipeline').");
  }
  if (recommendations.length === 0) {
    recommendations.push("Claim structure is well-optimized within standard statutory thresholds (3 independent / 20 total).");
  }

  return {
    detectedTechCenterId: detectedTC,
    detectedTechCenter: TECH_CENTERS[detectedTC],
    suggestedArtUnitId: bestAU,
    wordCount: words,
    whereinCount,
    comprisingCount,
    meansCount,
    complexityScore,
    complexityLevel,
    statutoryRisks: {
      section101: {
        risk: section101Risk,
        description: section101Description
      },
      section112: {
        risk: section112Risk,
        description: section112Description
      }
    },
    recommendations
  };
}
