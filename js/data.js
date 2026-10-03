/**
 * Patent Prosecution Timeline Predictor - Domain Knowledge & Benchmark Data
 * Calibrated against USPTO Data Visualization Center & PatentsView Historical Statistics
 */

export const TECH_CENTERS = {
  "1600": {
    id: "1600",
    name: "Biotechnology and Organic Chemistry",
    shortName: "Biotech / Pharma",
    avgFOAMonths: 22.4,
    stdDevFOA: 5.6,
    avgTotalMonths: 36.8,
    allowanceRate: 0.63,
    rceRate: 0.38,
    avgOACount: 2.3,
    weibullShape: 2.8,
    weibullScale: 38.0,
    artUnits: [
      { id: "1611", name: "Immunology and Immunotherapy", allowanceRate: 0.58, avgFOA: 23.1 },
      { id: "1634", name: "Molecular Biology & CRISPR Recombinants", allowanceRate: 0.61, avgFOA: 24.5 },
      { id: "1652", name: "Organic Compounds & Small Molecule Therapeutics", allowanceRate: 0.69, avgFOA: 20.2 }
    ]
  },
  "1700": {
    id: "1700",
    name: "Chemical and Materials Engineering",
    shortName: "Chemical / Materials",
    avgFOAMonths: 19.1,
    stdDevFOA: 4.8,
    avgTotalMonths: 31.4,
    allowanceRate: 0.71,
    rceRate: 0.31,
    avgOACount: 2.1,
    weibullShape: 3.1,
    weibullScale: 32.5,
    artUnits: [
      { id: "1721", name: "Solid-State Batteries & Electrochemistry", allowanceRate: 0.73, avgFOA: 18.5 },
      { id: "1745", name: "Polymer Composites & Nanomaterials", allowanceRate: 0.70, avgFOA: 19.4 },
      { id: "1782", name: "Metallurgy & Advanced Alloys", allowanceRate: 0.74, avgFOA: 18.0 }
    ]
  },
  "2100": {
    id: "2100",
    name: "Computer Architecture and Software",
    shortName: "Computer Architecture & AI",
    avgFOAMonths: 21.8,
    stdDevFOA: 5.2,
    avgTotalMonths: 35.6,
    allowanceRate: 0.67,
    rceRate: 0.35,
    avgOACount: 2.2,
    weibullShape: 2.9,
    weibullScale: 36.5,
    artUnits: [
      { id: "2121", name: "Machine Learning & Neural Network Accelerators", allowanceRate: 0.64, avgFOA: 22.0 },
      { id: "2145", name: "Distributed Cloud Architecture & Virtualization", allowanceRate: 0.68, avgFOA: 21.2 },
      { id: "2176", name: "Compiler Optimization & Parallel Processing", allowanceRate: 0.72, avgFOA: 20.1 }
    ]
  },
  "2400": {
    id: "2400",
    name: "Networking, Multiplexing, Cable, and Computer Security",
    shortName: "Networking & Cybersecurity",
    avgFOAMonths: 20.5,
    stdDevFOA: 4.9,
    avgTotalMonths: 33.2,
    allowanceRate: 0.70,
    rceRate: 0.32,
    avgOACount: 2.15,
    weibullShape: 3.0,
    weibullScale: 34.0,
    artUnits: [
      { id: "2441", name: "Cryptographic Protocols & Zero-Trust Security", allowanceRate: 0.66, avgFOA: 21.3 },
      { id: "2462", name: "5G/6G Wireless Telecommunications & PHY Layer", allowanceRate: 0.74, avgFOA: 19.8 },
      { id: "2488", name: "SDN Network Routing & Edge Gateway Systems", allowanceRate: 0.71, avgFOA: 20.0 }
    ]
  },
  "2600": {
    id: "2600",
    name: "Communications, Image Analysis, and Display Systems",
    shortName: "Communications & Image Processing",
    avgFOAMonths: 18.7,
    stdDevFOA: 4.3,
    avgTotalMonths: 30.5,
    allowanceRate: 0.74,
    rceRate: 0.28,
    avgOACount: 2.0,
    weibullShape: 3.2,
    weibullScale: 31.2,
    artUnits: [
      { id: "2624", name: "Computer Vision & Autonomous Perception", allowanceRate: 0.71, avgFOA: 19.0 },
      { id: "2651", name: "OLED / Micro-LED Display Technology", allowanceRate: 0.76, avgFOA: 18.2 },
      { id: "2678", name: "Digital Signal Processing & Audio Encoding", allowanceRate: 0.77, avgFOA: 17.8 }
    ]
  },
  "2800": {
    id: "2800",
    name: "Semiconductors, Electrical, and Optical Systems",
    shortName: "Semiconductors & Optics",
    avgFOAMonths: 16.4,
    stdDevFOA: 3.8,
    avgTotalMonths: 27.2,
    allowanceRate: 0.81,
    rceRate: 0.22,
    avgOACount: 1.85,
    weibullShape: 3.4,
    weibullScale: 28.0,
    artUnits: [
      { id: "2811", name: "FinFET / Gate-All-Around (GAA) Lithography", allowanceRate: 0.83, avgFOA: 15.9 },
      { id: "2835", name: "Photonic Integrated Circuits (PIC) & Lasers", allowanceRate: 0.79, avgFOA: 16.8 },
      { id: "2863", name: "Power MOSFETs & Silicon Carbide Inverters", allowanceRate: 0.82, avgFOA: 16.2 }
    ]
  },
  "3600": {
    id: "3600",
    name: "Transportation, Construction, E-Commerce, and Business Methods",
    shortName: "Transport & Business Methods (Alice / §101)",
    avgFOAMonths: 25.2,
    stdDevFOA: 6.8,
    avgTotalMonths: 41.5,
    allowanceRate: 0.52,
    rceRate: 0.46,
    avgOACount: 2.65,
    weibullShape: 2.5,
    weibullScale: 43.0,
    artUnits: [
      { id: "3689", name: "FinTech, Electronic Trading & Blockchains (§101 Alice Risk)", allowanceRate: 0.34, avgFOA: 28.4 },
      { id: "3652", name: "Electric Vehicle Powertrains & Chassis Dynamics", allowanceRate: 0.75, avgFOA: 20.8 },
      { id: "3621", name: "E-Commerce Logistics & Warehouse Automation", allowanceRate: 0.59, avgFOA: 24.1 }
    ]
  },
  "3700": {
    id: "3700",
    name: "Mechanical Engineering, Manufacturing, and Medical Devices",
    shortName: "Mechanical & Medical Devices",
    avgFOAMonths: 17.8,
    stdDevFOA: 4.1,
    avgTotalMonths: 29.8,
    allowanceRate: 0.76,
    rceRate: 0.26,
    avgOACount: 1.95,
    weibullShape: 3.3,
    weibullScale: 30.5,
    artUnits: [
      { id: "3731", name: "Surgical Robotics & Minimally Invasive Implants", allowanceRate: 0.72, avgFOA: 18.9 },
      { id: "3764", name: "Aerospace Propulsion & Turbine Aerodynamics", allowanceRate: 0.78, avgFOA: 17.2 },
      { id: "3782", name: "Additive 3D Metal Printing & Industrial Tooling", allowanceRate: 0.81, avgFOA: 16.8 }
    ]
  }
};

export const TRACKS = {
  standard: {
    id: "standard",
    name: "Standard Examination",
    badge: "Standard Utility",
    timeMultiplier: 1.0,
    foaShiftMonths: 0,
    allowanceBoost: 0,
    officialFeeCode: "standard",
    description: "Standard regular docket queue. Time to first action depends on Art Unit backlog."
  },
  trackOne: {
    id: "trackOne",
    name: "Track One (Prioritized Examination)",
    badge: "Prioritized (<12 Mo Target)",
    timeMultiplier: 0.35,
    foaShiftMonths: -15.5,
    minFOAMonths: 3.2,
    allowanceBoost: 0.08,
    officialFeeCode: "trackOne",
    description: "USPTO statutory prioritized program under 37 CFR 1.102(e). Fast-tracks final disposition within 12 months."
  },
  pph: {
    id: "pph",
    name: "Patent Prosecution Highway (PPH)",
    badge: "PPH Accelerated",
    timeMultiplier: 0.55,
    foaShiftMonths: -11.0,
    minFOAMonths: 5.5,
    allowanceBoost: 0.12,
    officialFeeCode: "standard", // No extra PTO petition fee for PPH
    description: "Accelerated prosecution leveraging favorable search/examination work-products from partner patent offices (EPO, JPO, etc.)."
  },
  accelerated: {
    id: "accelerated",
    name: "Accelerated Examination (Petition)",
    badge: "Accelerated Petition",
    timeMultiplier: 0.45,
    foaShiftMonths: -13.0,
    minFOAMonths: 4.5,
    allowanceBoost: 0.05,
    officialFeeCode: "accelerated",
    description: "Applicant files pre-examination search document (ESD) under 37 CFR 1.102(d)."
  }
};

export const ENTITY_TYPES = {
  large: { id: "large", label: "Large Entity (Undiscounted)", feeMultiplier: 1.0 },
  small: { id: "small", label: "Small Entity (60% Discount)", feeMultiplier: 0.4 },
  micro: { id: "micro", label: "Micro Entity (80% Discount)", feeMultiplier: 0.2 }
};

// USPTO Fee Schedules (USD) calibrated to current fee codes
export const BASE_FEES = {
  filingSearchExam: {
    name: "Filing, Search & Examination Fees",
    large: 1820,
    small: 728,
    micro: 364
  },
  trackOneFee: {
    name: "Track One Prioritized Petition Fee",
    large: 4200,
    small: 1680,
    micro: 840
  },
  excessIndependentClaim: {
    name: "Fee per Independent Claim over 3",
    large: 480,
    small: 192,
    micro: 96
  },
  excessTotalClaim: {
    name: "Fee per Total Claim over 20",
    large: 100,
    small: 40,
    micro: 20
  },
  firstRceFee: {
    name: "Request for Continued Examination (1st RCE)",
    large: 1360,
    small: 544,
    micro: 272
  },
  subsequentRceFee: {
    name: "Second and Subsequent RCE",
    large: 2000,
    small: 800,
    micro: 400
  },
  noticeOfAllowance: {
    name: "Issue Fee (Grant)",
    large: 1200,
    small: 480,
    micro: 240
  },
  appealNotice: {
    name: "Notice of Appeal to PTAB",
    large: 840,
    small: 336,
    micro: 168
  }
};

// Legal & Professional Attorney Benchmark Rates (Industry Average Estimates)
export const ATTORNEY_ESTIMATES = {
  draftingAndFiling: 9500,
  foaResponseComplexityBase: 3200,
  finalOaRceResponse: 2800,
  ptabAppealBrief: 7500,
  issueFormalities: 900
};

// Preloaded Realistic College Demonstration Case Studies
export const SAMPLE_CASE_STUDIES = [
  {
    id: "case-ai-edge",
    title: "Edge-AI Neural Accelerator for Autonomous Unmanned Aerial Vehicles",
    inventor: "RoboAero Intelligence Labs",
    techCenterId: "2100",
    artUnitId: "2121",
    track: "trackOne",
    entity: "small",
    totalClaims: 18,
    indepClaims: 3,
    claimComplexity: "Medium-High",
    priorArtCount: 14,
    examinerProfile: "moderate", // "lenient" | "moderate" | "strict"
    abstract: "A low-latency neuromorphic inference accelerator chip embedded on unmanned aerial vehicles (UAVs) featuring asynchronous spiking tensor cores, selective event-driven sparse matrix quantization, and real-time onboard obstacle collision avoidance."
  },
  {
    id: "case-biotech-crispr",
    title: "Allosterically Regulated CRISPR-Cas13 Ribonuclease System for RNA Viral Targeting",
    inventor: "BioGenome Therapeutics Inc.",
    techCenterId: "1600",
    artUnitId: "1634",
    track: "standard",
    entity: "large",
    totalClaims: 24,
    indepClaims: 4,
    claimComplexity: "High",
    priorArtCount: 38,
    examinerProfile: "strict",
    abstract: "Engineered CRISPR-Cas13 variants with high-fidelity allosteric cleavage switches, optimized guide RNA hairpin structures, and lipid nanoparticle delivery for targeted destruction of pathogenic mammalian RNA viruses without off-target collateral transcript degradation."
  },
  {
    id: "case-solid-state-battery",
    title: "Sulfide-Based Solid Electrolyte with In-Situ Cathode-Electrolyte Interphase Stabilization",
    inventor: "NextVolt Solid State Energy",
    techCenterId: "1700",
    artUnitId: "1721",
    track: "pph",
    entity: "small",
    totalClaims: 16,
    indepClaims: 3,
    claimComplexity: "Medium",
    priorArtCount: 9,
    examinerProfile: "lenient",
    abstract: "A composite solid-state lithium-metal battery separator comprising a lithium-arganodite sulfide electrolyte film coated with an amorphous ionic conductive fluorinated protective layer preventing dendrite propagation at ultra-high current densities."
  },
  {
    id: "case-fintech-zkp",
    title: "Cryptographic Zero-Knowledge Cross-Chain Settlement Engine with §101 Mitigation",
    inventor: "Nexus Decentralized Systems",
    techCenterId: "3600",
    artUnitId: "3689",
    track: "standard",
    entity: "micro",
    totalClaims: 22,
    indepClaims: 3,
    claimComplexity: "Very High",
    priorArtCount: 22,
    examinerProfile: "strict",
    abstract: "A verifiable cryptographic state-transition mechanism for executing non-repudiable atomic cross-chain liquidity swaps using recursive zk-SNARK rollups, with technical improvements in memory memory-access latency."
  },
  {
    id: "case-med-robotics",
    title: "Multi-Degree-of-Freedom Articulated End-Effector for Laparoscopic Micro-Surgery",
    inventor: "SurgiPrecision Dynamics",
    techCenterId: "3700",
    artUnitId: "3731",
    track: "standard",
    entity: "large",
    totalClaims: 15,
    indepClaims: 2,
    claimComplexity: "Medium",
    priorArtCount: 11,
    examinerProfile: "moderate",
    abstract: "A robotic end-effector instrument featuring concentric pre-curved nitinol wrist linkages, optical fiber haptic force feedback sensors, and dual-axis cable tension equalization for tremor-free microsurgical suturing in restricted cavity spaces."
  }
];
