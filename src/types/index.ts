export type Lang = "ru" | "en";

export type Action = "buy" | "hold" | "sell" | "watch";
export type Risk = "low" | "medium" | "high";
export type Trend = "bullish" | "bearish" | "sideways";
export type KPhase = "spring" | "summer" | "autumn" | "winter";
export type MacroScore = "bullish" | "neutral" | "bearish";
export type Valuation = "undervalued" | "overvalued" | "fair";
export type HeatIndex = "cold" | "normal" | "warm" | "hot" | "overheated";
export type CyclePos = "early" | "mid" | "late" | "peak" | "correction" | "bottom";
export type Sentiment = "bullish" | "bearish" | "neutral";
export type FearGreed = "extreme fear" | "fear" | "neutral" | "greed" | "extreme greed";

export interface AnalysisData {
  dataAsOf: string;
  asset: {
    name: string;
    ticker: string;
    type: string;
    assetClass: "stocks" | "crypto";
    sector: string;
    companyType: string;
    stabilityScore: Risk;
    businessModel: string;
    mainProduct: string;
    marketSize: string;
    industryGrowth: string;
    marketShare: string;
    competitors: string[];
    moat: string;
    quality: "strong" | "medium" | "weak";
    qualityReason: string;
    risks: string[];
  };
  valuation: {
    currentPrice: number;
    fairPrice: number;
    currency: string;
    priceDiff: number;
    status: Valuation;
    growthPotential: number;
    marginOfSafety: number;
    bubbleRisk: string;
    longTermProjection: string;
    canDouble: boolean;
    canDoubleTimeframe: string;
    metrics: {
      pe: number | null;
      ps: number | null;
      evEbitda: number | null;
      revenueGrowth: string;
      profitGrowth: string;
      margin: string;
      marketCap: string;
      debtToEquity: string;
    };
    marketHeatIndex: HeatIndex;
    marketHeatReason: string;
  };
  trendAnalysis: {
    dataAsOf: string;
    price3y: number | null;
    price3yDate: string;
    price5y: number | null;
    price5yDate: string;
    price10y: number | null;
    price10yDate: string;
    return3y: string;
    return5y: string;
    return10y: string;
    revenue3y: string;
    revenue5y: string;
    revenue10y: string;
    revenueCAGR5y: string;
    profitTrend: "growing" | "stable" | "declining";
    keyMilestones: Array<{ year: string; event: string; impact: "positive" | "negative" | "neutral" }>;
    trendConclusion: string;
  };
  macro: {
    dataAsOf: string;
    globalContext: string;
    interestRates: { fedRate: string; trend: "rising" | "falling" | "stable"; impactNote: string };
    inflation: { usCPI: string; trend: "rising" | "falling" | "stable"; impactNote: string };
    geopolitics: Array<{ event: string; relevance: "high" | "medium" | "low"; impact: "positive" | "negative" | "neutral"; date: string }>;
    sectorMacro: string;
    recession: { probability: Risk; note: string };
    commodities: { oil: string; gold: string; relevance: string };
    newsBackground: Array<{ title: string; summary: string; date: string; sentiment: "positive" | "negative" | "neutral"; source: string }>;
    macroScore: MacroScore;
    macroConclusion: string;
  };
  kondratiev: {
    dataAsOf: string;
    currentPhase: KPhase;
    phaseDescription: string;
    waveTechnology: string;
    assetFit: "strong" | "moderate" | "weak";
    assetFitReason: string;
    historicalAnalogy: string;
    riskFromCycle: string;
    opportunityFromCycle: string;
    kondratievConclusion: string;
  };
  technical: {
    trend: Trend;
    trendStrength: "strong" | "moderate" | "weak";
    rsi: number | null;
    rsiStatus: "overbought" | "normal" | "oversold";
    supportLevel: number | null;
    resistanceLevel: number | null;
    buySignal: "yes" | "no" | "watch";
    sellSignal: "yes" | "no" | "watch";
    institutionalActivity: "accumulating" | "distributing" | "neutral";
    volumeTrend: "increasing" | "decreasing" | "neutral";
    accumulationPhase: boolean;
    technicalNote: string;
  };
  growth: {
    revenueGrowthYoY: string;
    profitGrowthYoY: string;
    userGrowth: string;
    growthDrivers: string[];
    innovationIndex: "high" | "medium" | "low";
  };
  historical: {
    ath: number | null;
    athDate: string;
    atl: number | null;
    atlDate: string;
    maxDrawdown: string;
    avgRecoveryMonths: number | null;
    cyclePosition: CyclePos;
    crisisBehavior: string;
    macroSensitivity: "high" | "medium" | "low";
  };
  sentiment: {
    overall: Sentiment;
    hypeIndex: "low" | "medium" | "high" | "extreme";
    fearGreedValue: number;
    fearGreedLabel: FearGreed;
    institutionalFlow: "inflow" | "outflow" | "neutral";
    whaleActivity: "accumulating" | "selling" | "neutral";
    marketCycleStage: "accumulation" | "markup" | "distribution" | "markdown";
    fomo: boolean;
    sentimentNote: string;
  };
  riskProfile: {
    score: Risk;
    downsideRisk: string;
    volatility: Risk;
    liquidity: "high" | "medium" | "low";
    debtLevel: "low" | "medium" | "high" | "critical";
    geopoliticalRisk: Risk;
    regulationRisk: Risk;
    factors: string[];
  };
  cryptoMetrics: {
    networkUsage: string;
    activeAddresses: string;
    transactions: string;
    tvl: string;
    ecosystem: string[];
    nvt: number | null;
    stakingYield: string;
    tokenomics: string;
    adoptionScore: number;
  } | null;
  recommendation: {
    action: Action;
    buyZoneLow: number | null;
    buyZoneHigh: number | null;
    sellTarget: number | null;
    stopLoss: number | null;
    timeHorizon: string;
    confidence: "high" | "medium" | "low";
    summary: string;
    keyPoints: string[];
  };
  sources: Array<{ name: string; url: string; data: string; date: string }>;
  _meta?: { hasRealTA?: boolean };
}

export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  qty: number | null;
  avgPrice: number | null;
  currency: string;
  addedAt: string;
  lastAnalysis: AnalysisData | null;
  analyzedAt: string | null;
}

export interface PortfolioIntelligence {
  overallRisk: Risk;
  diversificationScore: number;
  summary: string;
  warnings: string[];
  strengths: string[];
  sectorBreakdown: Array<{ sector: string; pct: number; status: "ok" | "overweight" | "underweight" }>;
  hotAssets: string[];
  undervaluedAssets: string[];
  sellCandidates: string[];
  cashRecommendation: string;
  rebalanceNeeded: boolean;
  recommendations: string[];
}
