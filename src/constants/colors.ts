export const HEAT = {
  cold:       { c: "#4fc3f7", b: 10 },
  normal:     { c: "#00d084", b: 30 },
  warm:       { c: "#f5a623", b: 55 },
  hot:        { c: "#ff8c42", b: 75 },
  overheated: { c: "#ff4d4d", b: 95 },
} as const;

export const RISKC = {
  low:    { c: "#00d084" },
  medium: { c: "#f5a623" },
  high:   { c: "#ff4d4d" },
} as const;

export const TRENDC = {
  bullish:  { c: "#00d084" },
  bearish:  { c: "#ff4d4d" },
  sideways: { c: "#f5a623" },
} as const;

export const CYCLEC = {
  early:      { c: "#00d084", p: 15 },
  mid:        { c: "#4fc3f7", p: 40 },
  late:       { c: "#f5a623", p: 65 },
  peak:       { c: "#ff8c42", p: 85 },
  correction: { c: "#ff4d4d", p: 95 },
  bottom:     { c: "#8b9cf7", p: 5  },
} as const;

export const KWAVEC = {
  spring: { c: "#00d084" },
  summer: { c: "#f5a623" },
  autumn: { c: "#ff8c42" },
  winter: { c: "#8b9cf7" },
} as const;

export const MACROC = {
  bullish: { c: "#00d084" },
  neutral: { c: "#f5a623" },
  bearish: { c: "#ff4d4d" },
} as const;

export const ACTC = {
  buy:   { c: "#00d084", bg: "rgba(0,208,132,0.12)",  br: "#00d084" },
  hold:  { c: "#f5a623", bg: "rgba(245,166,35,0.12)", br: "#f5a623" },
  sell:  { c: "#ff4d4d", bg: "rgba(255,77,77,0.12)",  br: "#ff4d4d" },
  watch: { c: "#8b9cf7", bg: "rgba(139,156,247,0.12)",br: "#8b9cf7" },
} as const;

export const QUALC = {
  strong: { c: "#00d084", i: "🟢" },
  medium: { c: "#f5a623", i: "🟡" },
  weak:   { c: "#ff4d4d", i: "🔴" },
} as const;

export const STATC = {
  undervalued: { c: "#00d084", s: "↓" },
  overvalued:  { c: "#ff4d4d", s: "+" },
  fair:        { c: "#f5a623", s: "≈" },
} as const;

export const IMP = {
  positive: "#00d084",
  negative: "#ff4d4d",
  neutral:  "#f5a623",
} as const;
