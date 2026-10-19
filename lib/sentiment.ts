// Lexicon-based sentiment for finance headlines. Deliberately simple and
// transparent: a signed word list, negation handling, and averaging. This is
// NOT a trained NLP model — it is an explainable heuristic.

const POSITIVE: Record<string, number> = {
  surge: 1, surges: 1, surged: 1, jumps: 0.9, jump: 0.9, rally: 0.9, rallies: 0.9,
  gains: 0.7, gain: 0.7, rises: 0.6, rise: 0.6, climbs: 0.7, climb: 0.7,
  soar: 1, soars: 1, record: 0.8, high: 0.5, profit: 0.8, profits: 0.8,
  beats: 0.9, beat: 0.9, upgrade: 0.9, upgraded: 0.9, outperform: 0.9,
  growth: 0.6, grows: 0.6, strong: 0.6, robust: 0.7, bullish: 1, buy: 0.6,
  wins: 0.8, win: 0.8, award: 0.5, approval: 0.7, approved: 0.7, launch: 0.4,
  expansion: 0.6, expands: 0.6, dividend: 0.5, bonus: 0.5, acquires: 0.5,
  partnership: 0.5, deal: 0.4, order: 0.4, orders: 0.4, boost: 0.7, boosts: 0.7,
  rebound: 0.7, recovery: 0.6, optimism: 0.7, upbeat: 0.7, positive: 0.5,
}

const NEGATIVE: Record<string, number> = {
  plunge: 1, plunges: 1, plunged: 1, crash: 1, crashes: 1, slump: 0.9, slumps: 0.9,
  falls: 0.7, fall: 0.7, drops: 0.7, drop: 0.7, declines: 0.7, decline: 0.7,
  tumble: 0.9, tumbles: 0.9, sinks: 0.8, sink: 0.8, loss: 0.8, losses: 0.8,
  miss: 0.8, misses: 0.8, downgrade: 0.9, downgraded: 0.9, underperform: 0.9,
  weak: 0.6, bearish: 1, sell: 0.6, probe: 0.8, fraud: 1, scam: 1, scandal: 0.9,
  fine: 0.6, fined: 0.6, penalty: 0.7, lawsuit: 0.7, sues: 0.6, default: 0.9,
  cuts: 0.6, cut: 0.6, layoffs: 0.8, layoff: 0.8, warning: 0.6, warns: 0.6,
  debt: 0.5, slowdown: 0.7, recession: 0.8, concern: 0.5, concerns: 0.5,
  resign: 0.6, resigns: 0.6, resignation: 0.6, raid: 0.8, ban: 0.7, banned: 0.7,
  halt: 0.6, halted: 0.6, pessimism: 0.7, downturn: 0.7, negative: 0.5, risk: 0.3,
}

const NEGATORS = new Set(["no", "not", "never", "without", "fails", "fail", "cannot", "won't", "denies", "deny"])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

/** Sentiment of a single headline in [-1, 1]. */
export function scoreHeadline(title: string): number {
  const tokens = tokenize(title)
  let score = 0
  let hits = 0
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i]
    let s = 0
    if (POSITIVE[w] !== undefined) s = POSITIVE[w]
    else if (NEGATIVE[w] !== undefined) s = -NEGATIVE[w]
    if (s !== 0) {
      const prev = tokens[i - 1]
      if (prev && NEGATORS.has(prev)) s = -s * 0.8
      score += s
      hits++
    }
  }
  if (hits === 0) return 0
  // Average, then squash so a single strong word doesn't peg to ±1.
  return Math.tanh(score / Math.max(2, hits))
}

/** Aggregate sentiment of a set of headlines in [-1, 1]. */
export function aggregateSentiment(titles: string[]): number {
  if (titles.length === 0) return 0
  const scores = titles.map(scoreHeadline)
  const nonzero = scores.filter((s) => s !== 0)
  if (nonzero.length === 0) return 0
  return nonzero.reduce((a, b) => a + b, 0) / nonzero.length
}
