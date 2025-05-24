import axios from 'axios';

const API_URL = 'https://api.exchangerate.host/latest';
const cache: Record<string, number> = {};
let lastBase = '';
let lastRates: Record<string, number> = {};
let lastFetched = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
let lastSyncTime = 0;

export async function refreshRates(base: string = 'USD', symbols: string[] = []): Promise<void> {
  try {
    const res = await axios.get(API_URL, { params: { base, symbols: symbols.join(',') } });
    lastBase = base;
    lastRates = res.data.rates;
    lastFetched = Date.now();
    lastSyncTime = Date.now();
    // Save to localStorage for offline fallback
    localStorage.setItem('currencyRates', JSON.stringify({ base, rates: lastRates, fetched: lastFetched }));
    localStorage.setItem('currencyLastSync', lastSyncTime.toString());
  } catch (e) {
    // If API fails, keep old rates
    console.warn('Failed to refresh rates, using cached rates.');
  }
}

export function getLastSyncTime(): number {
  return lastSyncTime || parseInt(localStorage.getItem('currencyLastSync') || '0', 10);
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount;
  const now = Date.now();
  // Try to use cached rates from localStorage if available
  if (!lastRates[to] && localStorage.getItem('currencyRates')) {
    const cached = JSON.parse(localStorage.getItem('currencyRates')!);
    if (cached.base === from && cached.rates[to]) {
      lastRates = cached.rates;
      lastBase = cached.base;
      lastFetched = cached.fetched;
    }
  }
  if (lastBase === from && lastRates[to] && now - lastFetched < CACHE_DURATION) {
    return amount * lastRates[to];
  }
  try {
    const res = await axios.get(API_URL, { params: { base: from, symbols: to } });
    const rate = res.data.rates[to];
    lastBase = from;
    lastRates = res.data.rates;
    lastFetched = now;
    lastSyncTime = now;
    // Save to localStorage for offline fallback
    localStorage.setItem('currencyRates', JSON.stringify({ base: from, rates: lastRates, fetched: lastFetched }));
    localStorage.setItem('currencyLastSync', lastSyncTime.toString());
    return amount * rate;
  } catch (e) {
    // If API fails, use cached rates if available
    if (lastRates[to]) {
      return amount * lastRates[to];
    }
    if (localStorage.getItem('currencyRates')) {
      const cached = JSON.parse(localStorage.getItem('currencyRates')!);
      if (cached.base === from && cached.rates[to]) {
        return amount * cached.rates[to];
      }
    }
    throw new Error('Currency conversion failed and no cached rates available.');
  }
} 