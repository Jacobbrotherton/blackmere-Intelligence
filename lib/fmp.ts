// Financial Modeling Prep API utility
// Budget: 250 requests/day — cache all responses for 1 hour

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

function getKey(): string {
  return process.env.FINANCIAL_MODDELING_PREP_API_KEY ?? "";
}

export async function getIncomeStatement(ticker: string, limit = 3) {
  const key = getKey();
  if (!key) return null;
  const res = await fetch(
    `${FMP_BASE}/income-statement/${ticker}?limit=${limit}&apikey=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getCompanyProfile(ticker: string) {
  const key = getKey();
  if (!key) return null;
  const res = await fetch(
    `${FMP_BASE}/profile/${ticker}?apikey=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getQuote(ticker: string) {
  const key = getKey();
  if (!key) return null;
  const res = await fetch(
    `${FMP_BASE}/quote/${ticker}?apikey=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getKeyMetrics(ticker: string, limit = 1) {
  const key = getKey();
  if (!key) return null;
  const res = await fetch(
    `${FMP_BASE}/key-metrics/${ticker}?limit=${limit}&apikey=${key}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  return res.json();
}
