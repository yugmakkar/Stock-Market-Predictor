// Seed universe: Nifty 50 constituents (NSE symbols). Users can search beyond
// this list, but these power the default browse experience.

export interface SeedStock {
  symbol: string // Yahoo symbol, e.g. "RELIANCE.NS"
  name: string
  sector: string
}

export const NIFTY50: SeedStock[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG" },
  { symbol: "ITC.NS", name: "ITC", sector: "FMCG" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Financials" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", sector: "Auto" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto" },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Cement" },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Utilities" },
  { symbol: "NTPC.NS", name: "NTPC", sector: "Utilities" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corp", sector: "Energy" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", sector: "Financials" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", sector: "Diversified" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ", sector: "Infrastructure" },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Energy" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", sector: "Cement" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", sector: "Banking" },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", sector: "Auto" },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma" },
  { symbol: "TATACONSUM.NS", name: "Tata Consumer Products", sector: "FMCG" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", sector: "Healthcare" },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto" },
  { symbol: "SBILIFE.NS", name: "SBI Life Insurance", sector: "Insurance" },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Insurance" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT" },
  { symbol: "LTIM.NS", name: "LTIMindtree", sector: "IT" },
  { symbol: "SHRIRAMFIN.NS", name: "Shriram Finance", sector: "Financials" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto" },
  { symbol: "JIOFIN.NS", name: "Jio Financial Services", sector: "Financials" },
  { symbol: "ADANIGREEN.NS", name: "Adani Green Energy", sector: "Utilities" },
  { symbol: "DMART.NS", name: "Avenue Supermarts (DMart)", sector: "Retail" },
]

const BY_SYMBOL = new Map(NIFTY50.map((s) => [s.symbol.toUpperCase(), s]))

export function seedBySymbol(symbol: string): SeedStock | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase())
}

export function searchSeed(query: string): SeedStock[] {
  const q = query.trim().toLowerCase()
  if (!q) return NIFTY50
  return NIFTY50.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.symbol.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q),
  )
}
