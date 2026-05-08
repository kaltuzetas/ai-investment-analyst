export const makePortPrompt = (lang: string): string => {
  const ru = lang !== "en";
  const rule = ru
    ? "Отвечай ТОЛЬКО на русском языке."
    : "Respond ONLY in English.";

  return `${rule} Portfolio analyst. Valid JSON only, no markdown:
{"overallRisk":"low|medium|high","diversificationScore":0,"summary":"","warnings":[],"strengths":[],"sectorBreakdown":[{"sector":"","pct":0,"status":"ok|overweight|underweight"}],"hotAssets":[],"undervaluedAssets":[],"sellCandidates":[],"cashRecommendation":"","rebalanceNeeded":false,"recommendations":[]}`;
};
