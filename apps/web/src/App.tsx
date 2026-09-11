import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import './App.css';

// ============================================================================
// SVG ICON SYSTEM — All inline, stroke-based, Lucide/Feather style
// ============================================================================
const Icons = {
  nova: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.5 2.8-1.3 3.8A5 5 0 0 1 17 14.5 5 5 0 0 1 14 19v3" />
      <path d="M10 22v-3a5 5 0 0 1-5-4.5 5 5 0 0 1 1.3-3.7A5 5 0 0 1 7 7a5 5 0 0 1 5-5" />
      <path d="M8 14a3 3 0 0 0 4 0" />
    </svg>
  ),
  trendingUp: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  barChart: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  bookOpen: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  square: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  messageCircle: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  alertTriangle: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

// ============================================================================
// TYPES
// ============================================================================
export type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  imageUri?: string;
  timestamp: string;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: 'general' | 'trading';
  messages: UiMessage[];
};

export type AgentMode = 'max' | 'fast' | 'auto';

// ============================================================================
// CONFIRM MODAL COMPONENT
// ============================================================================
function ConfirmModal({
  open, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className={`confirm-dialog ${variant}`} onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon-ring ${variant}`}>
          {variant === 'danger' ? Icons.alertTriangle : Icons.zap}
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            {cancelLabel || 'Batal'}
          </button>
          <button className={`confirm-btn ${variant === 'danger' ? 'danger' : 'confirm'}`} onClick={onConfirm}>
            {confirmLabel || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// API KEYS & CONFIG
// ============================================================================
const DEFAULT_B64_KEYS = [
  'c2stb3ItdjEtMjc0YmU4Y2QyMjJkMDIyM2Q2MjE2ZTg1MzZiYjRhZGE3M2M4ZGZmMzI1OWQ3YzczNDQ4N2I4MzkyYTcxNTc1Yg==',
  'c2stb3ItdjEtNmI3MTg2ZTk2ODFjMzQwNGQ1NzY2ODQ5MDc4MjhhM2ZjNzFmNmI5MjgzZmIyMTQ3MGI1YTUwNzVhM2Y2NWY4MQ==',
  'c2stb3ItdjEtMDU1MmIyNDY4OGY3ZDkyZmI4YWY5YTUzMjI0Yjg0ZGZhNWEzOTI5MjE5NzM5YWUxZGMwMmM1OTQxNWI0MmU1Mg==',
  'c2stb3ItdjEtNTFhMmNhOWZmNGI2NDhjZThiNTA4NjUzOTcxOTdhOGUwYTE4ZTNlOTg3ZjBjNzcwOTgwZmNiYzcxZWYxOGY3Nw=='
];

export function getOpenRouterKeys(): string[] {
  const verifiedDefaults = DEFAULT_B64_KEYS.map((b) => atob(b));
  let customKeys: string[] = [];
  try {
    const saved = localStorage.getItem('@nova_custom_api_keys');
    if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch {}
  let envKeys: string[] = [];
  try {
    const rawEnv = ((import.meta as any).env?.VITE_OPENROUTER_KEYS || '');
    if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch {}
  const validCustom = customKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  const validEnv = envKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  const pool = Array.from(new Set([...verifiedDefaults, ...validCustom, ...validEnv]));
  return pool.length > 0 ? pool : verifiedDefaults;
}

const SESSIONS_KEY = '@nova_web_sessions_v1';
const ACTIVE_SESSION_KEY = '@nova_web_active_id_v1';

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================
const GENERAL_SYSTEM_PROMPT = `# Identitas & Prinsip NOVA (General Intelligence)
Kamu adalah NOVA, asisten AI otonom mutakhir yang berfokus pada kecerdasan komprehensif, penalaran logis, rekayasa kode, penulisan mendalam, dan analisis visual.

## Prinsip Operasional:
1. Alami & Objektif: Jawab secara cerdas, jujur, terstruktur, dan ramah tanpa basa-basi berlebihan.
2. Multidisiplin: Siap membantu coding (debugging, arsitektur, refactor), pemecahan masalah matematika/logika, riset, penulisan artikel, dan analisis dokumen.
3. Bebas Asumsi Finansial: Jangan paksa menggunakan istilah trading atau pasar keuangan jika pengguna tidak menanyakannya secara spesifik.
4. Epistemik Jujur: Jika fakta tidak pasti, nyatakan keterbatasan informasi secara transparan.`;

const NEUROBRO_TRADING_PROMPT = `# NOVA Trading Agent — Pedoman & Aturan Baku Neurobro

Dokumen ini adalah buku pedoman eksekusi dan aturan baku mutlak yang WAJIB ditaati dalam menganalisis chart trading, pasar kripto, forex, atau saham.

## Filosofi & Arsitektur AI
1. JANGAN PERNAH MENEBAK DATA (NO HALLUCINATION):
   - Selalu konfirmasi ke data absolut atau chart visual yang terlampir. Jika data tidak terlihat, bilang "Data tidak terlihat/tidak tahu".
2. PISAHKAN KALKULASI DARI INTERPRETASI:
   - Baca reaksi harga faktual dan indikator yang terlihat, bukan menghitung asumsi sendiri.

## Rahasia Dapur Eksekusi & Hirarki Konfluensi
1. HIRARKI ANALISA: Struktur > Volume > Momentum. Momentum (RSI/MACD) tanpa konfirmasi Struktur mutlak di-SKIP.
2. MEMBACA LONG/SHORT RATIO (CONTRARIAN):
   - Rasio ekstrem retail adalah filter skeptis tambahan, BUKAN pemicu open posisi. Struktur patah + rasio ekstrem = Valid.
3. BREAKOUT VS FAKEOUT (LIQUIDITY GRAB):
   - Menembus level hanya dengan wick candle adalah Liquidity Grab. Wajib tunggu candle close dan retest dengan konfirmasi volume.

## Parameter Indikator Baku
- MACD: 12 / 26 / 9 (EMA, Source Close) — Wajib tunggu candle close.
- RSI: Length 14 (SMA 14) — DILARANG short membabi buta hanya karena RSI > 70.
- Volume: MA Length 20 — Konfirmasi validitas breakout dengan membandingkan terhadap rata-rata 20 candle.

## Analisa Multi-Timeframe (Top-Down Approach)
- H4: Arah Utama (Bias Makro, S/R mayor, Swing High/Low).
- M15: Area Setup (Pullback, Penembusan, Pengujian ulang / Retest).
- M5: Konfirmasi Entry (Validasi struktur mikro, lonjakan volume, candle close).
- M1: DIABAIKAN (terlalu noisy).
SOP: H4 (Bias) → M15 (Setup) → M5 (Eksekusi). Jika arah timeframe bertentangan, SKIP.

## Kritik Eksekusi & Validasi Neurobro
1. MATEMATIKA R:R (MINIMAL 1:2): Rasio 1:2 adalah batas minimal mutlak. Entry, SL, dan TP wajib mengunci R:R >= 1:2.
2. FAKTA VS NARASI: DILARANG menggunakan narasi spekulatif ("smart money menjebak ritel"). Chart hanya menampilkan reaksi harga mekanis.
3. EKSEKUSI KONDISIONAL: Dilarang order buta full size. Entry wajib kondisional menunggu konfirmasi candle close di M15/M5 dengan volume searah meningkat.
4. STOP LOSS LOGIS: Stop-loss ditempatkan di luar titik invalidasi absolut struktur chart exchange (Binance).
5. CONVICTION CALL & BATAS BATAL: Setiap setup wajib punya SATU panggilan (BUY, SELL, atau HOLD) dan menyertakan angka konkret Batas Batal (Invalidasi Close).

## Korelasi Pasar & Cuaca Bitcoin (BTC)
- Hukum Besi Kripto: Bitcoin adalah indeks utama. Algoritma bot mengikat seluruh altcoin ke pergerakan BTC.
- Selalu cek Cuaca BTC sebelum analisa altcoin. DILARANG Long altcoin jika BTC sedang breakdown/dump agresif!`;

// Model chains
const TEXT_MODELS: Record<AgentMode, string[]> = {
  max: [
    'nex-agi/nex-n2.5-pro:free',
    'google/gemma-4-31b-it:free',
    'inclusionai/ling-3.0-flash-fin:free',
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-6-astra',
    'anthropic/claude-sonnet-5'
  ],
  fast: [
    'nex-agi/nex-n2.5-mini:free',
    'nex-agi/nex-n2.5-pro:free',
    'google/gemma-4-31b-it:free',
    'liquid/lfm-2.5-2.6b:free',
    'google/gemini-3.8-flash',
    'openai/gpt-5.6-luna'
  ],
  auto: [
    'nex-agi/nex-n2.5-pro:free',
    'google/gemma-4-31b-it:free',
    'inclusionai/ling-3.0-flash-fin:free',
    'nex-agi/nex-n2.5-mini:free',
    'liquid/lfm-2.5-2.6b:free',
    'nvidia/nemotron-3.5-lightning:free',
    'anthropic/claude-sonnet-5',
    'openai/gpt-6-astra'
  ]
};

function getFormattedTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================================================
// INDICATOR CALCULATIONS
// ============================================================================
function calculateRsi(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses += Math.abs(diff);
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }
  if (avgLoss === 0) return 100;
  return Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100;
}

function calculateMa(volumes: number[], period: number = 20): number {
  if (volumes.length === 0) return 0;
  const slice = volumes.slice(-period);
  return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
}

// ============================================================================
// LIVE MARKET DATA FETCHER
// ============================================================================
export async function fetchLiveMarketData(symbol: string) {
  try {
    const sym = symbol.toUpperCase().replace('/', '').trim();
    const tickerRes = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${sym}`);
    if (!tickerRes.ok) return null;
    const ticker = await tickerRes.json();

    const [h4Res, m15Res, m5Res, btcRes] = await Promise.all([
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=4h&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=15m&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=5m&limit=25`),
      sym !== 'BTCUSDT' ? fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT`) : Promise.resolve(null)
    ]);

    const h4Data = await h4Res.json();
    const m15Data = await m15Res.json();
    const m5Data = await m5Res.json();
    const btcTicker = btcRes ? await btcRes.json() : null;

    const h4Closes = h4Data.map((k: any) => parseFloat(k[4]));
    const h4Highs = h4Data.map((k: any) => parseFloat(k[2]));
    const h4Lows = h4Data.map((k: any) => parseFloat(k[3]));
    const h4Close = h4Closes[h4Closes.length - 1];
    const h4High = Math.max(...h4Highs);
    const h4Low = Math.min(...h4Lows);

    const m15Closes = m15Data.map((k: any) => parseFloat(k[4]));
    const m15Volumes = m15Data.map((k: any) => parseFloat(k[5]));
    const m15Rsi = calculateRsi(m15Closes, 14);
    const m15VolMa = calculateMa(m15Volumes, 20);
    const m15VolRatio = m15VolMa > 0 ? Math.round((m15Volumes[m15Volumes.length - 1] / m15VolMa) * 100) / 100 : 1;

    const m5Closes = m5Data.map((k: any) => parseFloat(k[4]));
    const m5Opens = m5Data.map((k: any) => parseFloat(k[1]));
    const m5Rsi = calculateRsi(m5Closes, 14);
    const m5Candle = m5Closes[m5Closes.length - 1] >= m5Opens[m5Opens.length - 1] ? 'BULLISH' : 'BEARISH';

    let btcWeather;
    if (btcTicker) {
      const change = parseFloat(btcTicker.priceChangePercent);
      btcWeather = { price: parseFloat(btcTicker.lastPrice), change24h: change, status: change < -3.5 ? 'DUMP_ALERT' : 'NORMAL' };
    }

    return {
      symbol: sym, price: parseFloat(ticker.lastPrice), change24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice), low24h: parseFloat(ticker.lowPrice), volume24h: parseFloat(ticker.volume),
      h4: { lastClose: h4Close, high: h4High, low: h4Low, trend: h4Close > (h4High + h4Low) / 2 ? 'BULLISH' : 'BEARISH' },
      m15: { rsi: m15Rsi, volRatio: m15VolRatio }, m5: { rsi: m5Rsi, candle: m5Candle }, btcWeather
    };
  } catch (err) { console.error('Error fetching market data:', err); return null; }
}

// ============================================================================
// MARKDOWN FORMATTER
// ============================================================================
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    try { return marked.parse(content || '', { breaks: true, gfm: true }) as string; }
    catch { return content || ''; }
  }, [content]);
  return <div className="message-body prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentMode>('max');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<{ uri: string; base64: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const [showChartPanel, setShowChartPanel] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketStats, setMarketStats] = useState<any>(null);

  const [showSopModal, setShowSopModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [quotaData, setQuotaData] = useState<any[]>([]);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; variant: 'danger' | 'info';
    confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'info', onConfirm: () => {} });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const chatMode = activeSession?.mode || 'general';

  // Load Sessions
  useEffect(() => {
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(savedActiveId && parsed.some((s: any) => s.id === savedActiveId) ? savedActiveId : parsed[0].id);
          return;
        }
      } catch (e) {}
    }
    const initialSession: ChatSession = {
      id: `session_${Date.now()}`, title: 'Percakapan Baru', createdAt: Date.now(), updatedAt: Date.now(),
      mode: 'general', messages: [{
        id: 'welcome', role: 'assistant',
        content: 'Halo! Saya **NOVA**, asisten AI otonom mutakhir edisi Web & Laptop. Anda dapat berdiskusi rekayasa kode, logika komprehensif, atau mengaktifkan Mode Trading Neurobro untuk analisis pasar Top-Down real-time.',
        modelUsed: 'Claude Sonnet / GPT-6', timestamp: getFormattedTime()
      }]
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([initialSession]));
    localStorage.setItem(ACTIVE_SESSION_KEY, initialSession.id);
  }, []);

  const saveSessions = (updated: ChatSession[], activeId?: string) => {
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    if (activeId) { setCurrentSessionId(activeId); localStorage.setItem(ACTIVE_SESSION_KEY, activeId); }
  };

  // Live Market Stats
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => { const data = await fetchLiveMarketData(selectedSymbol); if (mounted) setMarketStats(data); };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [selectedSymbol]);

  // Auto Scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // ── Handlers ──
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`, title: 'Percakapan Baru', createdAt: Date.now(), updatedAt: Date.now(),
      mode: chatMode, messages: [{
        id: `welcome_${Date.now()}`, role: 'assistant',
        content: chatMode === 'trading'
          ? '**Mode Trading Neurobro Aktif.** Siap menganalisis chart pasar dengan SOP baku: Top-Down MTF (H4 → M15 → M5), Konfluensi Struktur > Volume > Momentum, R:R minimal 1:2, dan Validasi Batas Batal.'
          : 'Halo! Saya **NOVA**, asisten AI Anda. Apa yang ingin kita kerjakan hari ini?',
        modelUsed: 'Ready', timestamp: getFormattedTime()
      }]
    };
    saveSessions([newSession, ...sessions], newSession.id);
    setSidebarOpen(false);
  };

  const handleToggleMode = (newMode: 'general' | 'trading') => {
    const updated = sessions.map((s) => (s.id === currentSessionId ? { ...s, mode: newMode } : s));
    saveSessions(updated);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const session = sessions.find(s => s.id === id);
    setConfirmState({
      open: true, variant: 'danger',
      title: 'Hapus Percakapan',
      message: `Yakin ingin menghapus "${session?.title || 'Percakapan'}"? Semua pesan di sesi ini akan hilang secara permanen.`,
      confirmLabel: 'Hapus',
      onConfirm: () => {
        const updated = sessions.filter((s) => s.id !== id);
        if (updated.length === 0) { handleNewChat(); } else {
          const nextId = currentSessionId === id ? updated[0].id : currentSessionId;
          saveSessions(updated, nextId);
        }
        setConfirmState(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleClearAllSessions = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmState({
      open: true, variant: 'danger',
      title: 'Hapus Semua Riwayat',
      message: `Anda akan menghapus ${sessions.length} percakapan. Semua riwayat obrolan dan pesan akan hilang secara permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmLabel: 'Hapus Semua',
      onConfirm: () => {
        const initialSession: ChatSession = {
          id: `session_${Date.now()}`, title: 'Percakapan Baru', createdAt: Date.now(), updatedAt: Date.now(),
          mode: chatMode, messages: [{
            id: 'welcome', role: 'assistant',
            content: 'Seluruh riwayat obrolan telah dibersihkan. Apa yang ingin kita diskusikan hari ini?',
            modelUsed: 'Ready', timestamp: getFormattedTime()
          }]
        };
        saveSessions([initialSession], initialSession.id);
        setConfirmState(prev => ({ ...prev, open: false }));
      }
    });
  };

  // Speech Recognition
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Browser tidak mendukung Speech Recognition. Gunakan Chrome atau Edge.'); return; }
    if (isListening) { setIsListening(false); return; }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; recognition.continuous = false; recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.start();
    } catch (e) { setIsListening(false); }
  };

  // TTS
  const handleToggleTts = (msgId: string, text: string) => {
    if (speakingId === msgId) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel(); setSpeakingId(msgId);
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
    utterance.lang = 'id-ID'; utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null); utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachment({ uri: reader.result as string, base64, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Auto Analysis
  const triggerAutoAnalysis = async (symbol: string) => {
    if (chatMode !== 'trading') handleToggleMode('trading');
    setBusy(true);
    const userMessage: UiMessage = {
      id: `user_${Date.now()}`, role: 'user',
      content: `Analisis Otomatis Chart & Indikator ${symbol} (Top-Down MTF H4 → M15 → M5)`,
      timestamp: getFormattedTime()
    };
    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, title: `Analisa ${symbol}`, mode: 'trading', messages: currentMessages } : s)));

    try {
      const liveData = await fetchLiveMarketData(symbol);
      if (!liveData) throw new Error('Gagal menarik data live candlestick bursa.');
      const promptData = `[DATA ABSOLUT DARI LIVE CHART & INDIKATOR BINANCE (NO HALLUCINATION)]:
• Aset: ${liveData.symbol} | Harga Live: $${liveData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} | 24h Change: ${liveData.change24h > 0 ? '+' : ''}${liveData.change24h.toFixed(2)}%
• Rentang 24 Jam: Low $${liveData.low24h.toFixed(2)} — High $${liveData.high24h.toFixed(2)} | Volume 24h: ${liveData.volume24h.toFixed(1)}
• Multi-Timeframe (Top-Down):
  - [H4 BIAS]: Last Close $${liveData.h4.lastClose.toFixed(2)} | Range: $${liveData.h4.low.toFixed(2)} - $${liveData.h4.high.toFixed(2)} | Arah Makro: ${liveData.h4.trend}
  - [M15 SETUP]: RSI(14): ${liveData.m15.rsi} | Volume Ratio vs MA20: ${liveData.m15.volRatio}x
  - [M5 EKSEKUSI]: Candle Terakhir: ${liveData.m5.candle} | RSI(14): ${liveData.m5.rsi}
${liveData.btcWeather ? `• [CUACA BITCOIN INDEKS]: BTC Price $${liveData.btcWeather.price.toFixed(2)} (${liveData.btcWeather.change24h > 0 ? '+' : ''}${liveData.btcWeather.change24h.toFixed(2)}%) | Status: ${liveData.btcWeather.status}` : ''}

Tugas Anda:
Lakukan analisis trading sesuai Pedoman Neurobro:
1. Tentukan Bias H4
2. Identifikasi Area Setup M15 & Validasi Volume
3. Periksa Konfirmasi Entry M5 & Rejeksi
4. Hitung Rencana Posisi: Entry, Stop Loss Logis di luar invalidasi, Take Profit (R:R minimal 1:2), dan Angka Batas Batal.
5. Panggilan: BUY, SELL, atau HOLD.`;

      const result = await callOpenRouter(currentMessages, promptData, 'trading', mode);
      const assistantMessage: UiMessage = {
        id: `assistant_${Date.now()}`, role: 'assistant', content: result.content,
        modelUsed: result.model.split('/').pop() || result.model, timestamp: getFormattedTime()
      };
      saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, assistantMessage] } : s)));
    } catch (err: any) {
      const errMessage: UiMessage = {
        id: `error_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal memproses analisis live data.'}`,
        modelUsed: 'Error', timestamp: getFormattedTime()
      };
      saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, errMessage] } : s)));
    } finally { setBusy(false); }
  };

  // Call OpenRouter
  const callOpenRouter = async (history: UiMessage[], promptText: string, cMode: 'general' | 'trading', aMode: AgentMode, attach?: any) => {
    const models = TEXT_MODELS[aMode] || TEXT_MODELS.auto;
    let currentContent: any = promptText;
    if (attach?.base64) {
      currentContent = [
        { type: 'text', text: promptText.trim() || (cMode === 'trading' ? 'Analisis chart ini secara ketat dengan SOP Neurobro.' : 'Analisis gambar ini.') },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${attach.base64}` } }
      ];
    }
    const cleanHistory = history
      .filter((m) => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome' && m.content !== promptText)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const apiMessages = [
      { role: 'system', content: cMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT },
      ...cleanHistory, { role: 'user', content: currentContent }
    ];

    let lastErr: any = null;
    const activeKeys = getOpenRouterKeys();
    for (const modelCandidate of models) {
      for (const key of activeKeys) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 18000);
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST', signal: ctrl.signal,
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'NOVA Web' },
            body: JSON.stringify({ model: modelCandidate, temperature: cMode === 'trading' ? 0.15 : 0.4, max_tokens: 2500, messages: apiMessages })
          });
          clearTimeout(timer);
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            lastErr = new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
            if ([400, 401, 402, 404, 429, 500, 502, 503, 524].includes(res.status)) continue;
            throw lastErr;
          }
          const data = await res.json();
          if (data.error) { lastErr = new Error(data.error?.message || `Provider error (${data.error?.code || 500})`); break; }
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return { content: reply, model: data.model || modelCandidate };
          else { lastErr = new Error('Model mengembalikan respon kosong.'); break; }
        } catch (e: any) { lastErr = e; }
      }
    }
    throw lastErr || new Error('Gagal menghubungi OpenRouter.');
  };

  // Send Message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    if (busy) return;
    const match = trimmed.toUpperCase().match(/\b(BTC|ETH|SOL|BNB|XAU|EUR)(USDT)?\b/);
    if (chatMode === 'trading' && match && !attachment) {
      const sym = match[1] === 'EUR' ? 'EURUSDT' : `${match[1]}USDT`;
      setInput(''); await triggerAutoAnalysis(sym); return;
    }
    setBusy(true);
    const userMessage: UiMessage = {
      id: `user_${Date.now()}`, role: 'user', content: trimmed, imageUri: attachment?.uri, timestamp: getFormattedTime()
    };
    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    const sessionTitle = activeSession?.title === 'Percakapan Baru' ? (trimmed || 'Analisis Media').slice(0, 30) : activeSession?.title || 'Obrolan';
    saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, title: sessionTitle, messages: currentMessages } : s)));
    const currentAttachment = attachment; setInput(''); setAttachment(null);
    try {
      const result = await callOpenRouter(currentMessages, trimmed, chatMode, mode, currentAttachment);
      const assistantMessage: UiMessage = {
        id: `assistant_${Date.now()}`, role: 'assistant', content: result.content,
        modelUsed: result.model.split('/').pop() || result.model, timestamp: getFormattedTime()
      };
      saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, assistantMessage] } : s)));
    } catch (err: any) {
      const errMessage: UiMessage = {
        id: `error_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal menghubungi server OpenRouter.'}`,
        modelUsed: 'Error', timestamp: getFormattedTime()
      };
      saveSessions(sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, errMessage] } : s)));
    } finally { setBusy(false); }
  };

  // Load Quotas
  const loadQuotas = async () => {
    setLoadingQuota(true); setShowQuotaModal(true);
    try {
      const results = await Promise.all(
        getOpenRouterKeys().map(async (k: string) => {
          const masked = `${k.slice(0, 10)}...${k.slice(-6)}`;
          try {
            const res = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { 'Authorization': `Bearer ${k}` } });
            const json = await res.json();
            if (!res.ok) return { masked, status: res.status === 429 ? 'LIMIT 429' : 'ERROR', usage: 0, free: false };
            const d = json.data || {};
            return { masked: d.label || masked, status: '200 OK', usage: Number(d.usage || 0), free: Boolean(d.is_free_tier) };
          } catch { return { masked, status: 'ERROR', usage: 0, free: false }; }
        })
      );
      setQuotaData(results);
    } finally { setLoadingQuota(false); }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="app-shell">
      {/* ── CONFIRM MODAL ── */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />

      {/* ── FLOATING LOGO (sidebar collapsed) ── */}
      {sidebarCollapsed && (
        <button
          className="floating-logo-btn"
          onClick={() => setSidebarCollapsed(false)}
          title="Buka Sidebar"
        >
          {Icons.nova}
        </button>
      )}

      {/* ==================================================================== */}
      {/* SIDEBAR                                                              */}
      {/* ==================================================================== */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand-row">
          <div
            className="brand-logo-group"
            onClick={() => {
              if (window.innerWidth <= 768) setSidebarOpen(false);
              else setSidebarCollapsed(true);
            }}
            title="Tutup Sidebar"
          >
            <div className="brand-emblem">{Icons.nova}</div>
            <div className="brand-text">NOVA</div>
            <span className="brand-version">PRO</span>
          </div>
          {/* Mobile close only */}
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} title="Tutup Menu">
            {Icons.x}
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          {Icons.plus} Obrolan Baru
        </button>

        <div className="sidebar-section-title">Mode Asisten</div>
        <div className="mode-switcher-capsule">
          <button
            className={`mode-switcher-tab ${chatMode === 'general' ? 'active' : ''}`}
            onClick={() => handleToggleMode('general')}
          >
            {Icons.brain} Umum
          </button>
          <button
            className={`mode-switcher-tab ${chatMode === 'trading' ? 'trading-active' : ''}`}
            onClick={() => handleToggleMode('trading')}
          >
            {Icons.trendingUp} Neurobro
          </button>
        </div>

        <div className="sidebar-section-title">Alat & Pasar</div>
        <div className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${showChartPanel ? 'active' : ''}`}
            onClick={() => setShowChartPanel(!showChartPanel)}
          >
            {showChartPanel ? Icons.eyeOff : Icons.barChart}
            {showChartPanel ? 'Sembunyikan Chart' : 'Buka Live TradingView'}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowSopModal(true)}>
            {Icons.bookOpen} Pedoman Trading (SOP)
          </button>
          <button className="sidebar-nav-item" onClick={loadQuotas}>
            {Icons.zap} Status Kuota API
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowModelModal(true)}>
            {Icons.settings} Model AI ({mode.toUpperCase()})
          </button>
        </div>

        <div className="sidebar-history-header">
          <div className="sidebar-section-title">Riwayat ({sessions.length})</div>
          {sessions.length > 1 && (
            <button className="clear-all-sessions-btn" onClick={handleClearAllSessions} title="Hapus semua riwayat">
              Hapus Semua
            </button>
          )}
        </div>

        <div className="history-scroll-area">
          {sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                className={`history-item ${isActive ? 'active' : ''}`}
                onClick={() => { setCurrentSessionId(s.id); setSidebarOpen(false); }}
              >
                <div className="history-item-left">
                  <div className="history-item-title">
                    {s.mode === 'trading' ? Icons.trendingUp : Icons.messageCircle}
                    {s.title}
                  </div>
                  <div className="history-item-meta">{s.messages.length} pesan</div>
                </div>
                <button className="history-delete-btn" onClick={(e) => handleDeleteSession(s.id, e)} title="Hapus obrolan ini">
                  {Icons.x}
                </button>
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="status-dot-pulse" />
          <span>4 Kunci API · Live MTF Engine</span>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN CHAT ARENA                                                      */}
      {/* ==================================================================== */}
      <main className="main-arena">
        <header className="main-header">
          <div className="main-header-left">
            {/* Mobile only: open sidebar */}
            {window.innerWidth <= 768 && (
              <button
                className="header-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title="Menu"
                style={{ padding: '6px 8px' }}
              >
                {Icons.nova}
              </button>
            )}
            <div
              className={`header-mode-badge ${chatMode}`}
              onClick={() => handleToggleMode(chatMode === 'general' ? 'trading' : 'general')}
            >
              {chatMode === 'trading' ? Icons.trendingUp : Icons.brain}
              {chatMode === 'trading' ? 'Mode Trading Neurobro' : 'Asisten AI Umum'}
            </div>
          </div>

          <div className="main-header-right">
            <button
              className={`header-btn ${showChartPanel ? 'active-chart' : ''}`}
              onClick={() => setShowChartPanel(!showChartPanel)}
              title="Toggle TradingView Chart"
            >
              {Icons.barChart}
              {showChartPanel ? 'Tutup Chart' : 'TradingView'}
            </button>
            <button className="header-btn" onClick={loadQuotas}>
              {Icons.zap} Kuota
            </button>
            <button className="header-btn" onClick={() => setShowSopModal(true)}>
              {Icons.bookOpen} SOP
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="chat-stream-container" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`message-row ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="assistant-avatar-circle">{Icons.nova}</div>
              )}
              <div className="message-card">
                <div className="message-meta-header">
                  <span className="message-author-label">
                    {m.role === 'user' ? 'Anda' : `NOVA (${m.modelUsed || 'AI'})`}
                  </span>
                  <span className="message-time-label">{m.timestamp}</span>
                </div>

                {m.imageUri && (
                  <div className="attached-image-container">
                    <img src={m.imageUri} alt="Attached media" />
                  </div>
                )}

                {m.role === 'assistant' ? (
                  <MarkdownContent content={m.content} />
                ) : (
                  <div className="message-body user-body">{m.content}</div>
                )}

                {m.role === 'assistant' && (
                  <div className="message-actions-row">
                    <button
                      className={`message-action-pill ${speakingId === m.id ? 'active' : ''}`}
                      onClick={() => handleToggleTts(m.id, m.content)}
                    >
                      {speakingId === m.id ? Icons.square : Icons.volume}
                      {speakingId === m.id ? 'Stop' : 'Suara'}
                    </button>
                    <button className="message-action-pill" onClick={() => handleCopy(m.id, m.content)}>
                      {copiedId === m.id ? Icons.check : Icons.copy}
                      {copiedId === m.id ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="thinking-container">
              <div className="assistant-avatar-circle">{Icons.nova}</div>
              <div className="thinking-pill">
                <div className="spinner" />
                <span>NOVA sedang menganalisa…</span>
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <footer className="composer-dock">
          {attachment && (
            <div className="attachment-preview-capsule">
              <img src={attachment.uri} alt="Thumb" className="attachment-thumb" />
              <div className="attachment-info">
                <div className="attachment-name">{attachment.name}</div>
                <div className="attachment-hint">
                  {Icons.trendingUp}
                  {chatMode === 'trading' ? 'Siap dianalisis dengan SOP Neurobro' : 'Siap dianalisis oleh NOVA'}
                </div>
              </div>
              <button className="attachment-close-btn" onClick={() => setAttachment(null)}>{Icons.x}</button>
            </div>
          )}

          <div className="composer-box">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            <button className="composer-icon-btn" onClick={() => fileInputRef.current?.click()} title="Unggah Gambar / Chart">
              {Icons.camera}
            </button>
            <button className={`composer-icon-btn ${isListening ? 'active-mic' : ''}`} onClick={handleToggleVoiceInput} title="Input Suara">
              {Icons.mic}
            </button>
            <textarea
              className="composer-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={chatMode === 'trading' ? 'Ketik "Analisa BTC" atau tanyakan setup…' : 'Ketik pesan untuk NOVA…'}
              rows={1}
            />
            <button className="composer-send-btn" onClick={handleSend} disabled={busy || (!input.trim() && !attachment)}>
              {Icons.send}
            </button>
          </div>
        </footer>
      </main>

      {/* ==================================================================== */}
      {/* TRADINGVIEW 16:9 PANEL                                               */}
      {/* ==================================================================== */}
      {showChartPanel && (
        <aside className="trading-panel animate-fade-in">
          <div className="trading-panel-header">
            <div className="trading-panel-title">
              {Icons.activity} Live TradingView (16:9)
            </div>
            <button className="modal-close-btn" onClick={() => setShowChartPanel(false)}>{Icons.x}</button>
          </div>

          <div className="symbol-tab-bar">
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XAUUSDT'].map((sym) => (
              <button key={sym} className={`symbol-tab ${selectedSymbol === sym ? 'active' : ''}`} onClick={() => setSelectedSymbol(sym)}>
                {sym.replace('USDT', '/USDT')}
              </button>
            ))}
          </div>

          <div className="tv-iframe-wrapper">
            <iframe
              title="TradingView Interactive Widget"
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0D111A&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FJakarta`}
            />
          </div>

          <div className="mtf-dashboard-section">
            {marketStats && (
              <div className="mtf-stats-grid">
                <div className="mtf-card-box">
                  <div className="mtf-card-label">H4 Trend</div>
                  <div className={`mtf-card-val ${marketStats.h4.trend === 'BULLISH' ? 'bull' : 'bear'}`}>{marketStats.h4.trend}</div>
                </div>
                <div className="mtf-card-box">
                  <div className="mtf-card-label">M15 RSI (14)</div>
                  <div className="mtf-card-val">{marketStats.m15.rsi}</div>
                </div>
                <div className="mtf-card-box">
                  <div className="mtf-card-label">M5 Candle</div>
                  <div className={`mtf-card-val ${marketStats.m5.candle === 'BULLISH' ? 'bull' : 'bear'}`}>{marketStats.m5.candle}</div>
                </div>
              </div>
            )}

            <button className="auto-analyze-hero-btn" onClick={() => triggerAutoAnalysis(selectedSymbol)} disabled={busy}>
              <span className="auto-analyze-icon">{Icons.zap}</span>
              <div>
                <div className="auto-analyze-title">Analisis Otomatis {selectedSymbol}</div>
                <div className="auto-analyze-sub">Tarik data live bursa & jalankan analisa Neurobro (R:R ≥ 1:2)</div>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SOP                                                           */}
      {/* ==================================================================== */}
      {showSopModal && (
        <div className="modal-overlay" onClick={() => setShowSopModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Pedoman & Aturan Trading Neurobro</div>
                <div className="modal-subtitle">Buku pedoman baku dari AI YM_Trading</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSopModal(false)}>{Icons.x}</button>
            </div>
            <div className="modal-body">
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.brain} Filosofi AI Trading</div>
                <div className="sop-card-content">
                  • <strong>No Hallucination:</strong> Wajib konfirmasi data chart live. Jika data tidak terlihat, bilang "Tidak tahu".<br />
                  • <strong>Pisahkan Kalkulasi dari Interpretasi:</strong> Fokus membaca aksi harga dan indikator faktual yang terlihat.
                </div>
              </div>
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.zap} Rahasia Dapur Eksekusi</div>
                <div className="sop-card-content">
                  • <strong>Hirarki Juara:</strong> Struktur {'>'} Volume {'>'} Momentum. Momentum tanpa konfirmasi Struktur mutlak di-SKIP.<br />
                  • <strong>Long/Short Ratio:</strong> Rasio ekstrem adalah filter skeptis tambahan, BUKAN pemicu open posisi.<br />
                  • <strong>Breakout vs Fakeout:</strong> Tembus hanya dengan wick adalah Liquidity Grab. Wajib tunggu candle close dan retest volume.
                </div>
              </div>
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.settings} Parameter Indikator Baku</div>
                <div className="sop-card-content">
                  • <strong>MACD:</strong> 12 / 26 / 9 (EMA Close) — Wajib candle close.<br />
                  • <strong>RSI:</strong> Length 14 — Dilarang short membabi buta hanya karena RSI {'>'} 70.<br />
                  • <strong>Volume:</strong> MA 20 — Konfirmasi breakout terhadap rata-rata 20 candle.
                </div>
              </div>
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.clock} Multi-Timeframe (Top-Down)</div>
                <div className="sop-card-content">
                  • <strong>H4 (Bias Utama):</strong> Tren makro, S/R mayor, Swing High/Low.<br />
                  • <strong>M15 (Setup):</strong> Area pullback, penembusan, pengujian ulang.<br />
                  • <strong>M5 (Eksekusi):</strong> Validasi struktur kecil & volume.<br />
                  • <strong>M1:</strong> Diabaikan karena terlalu berisik (noise).
                </div>
              </div>
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.shield} Kritik & Validasi Neurobro</div>
                <div className="sop-card-content">
                  • <strong>Matematika R:R:</strong> Minimal 1:2 mutlak.<br />
                  • <strong>Fakta vs Narasi:</strong> Dilarang narasi spekulatif. Chart hanya menampilkan reaksi harga mekanis.<br />
                  • <strong>Batas Batal:</strong> Setiap setup wajib memiliki harga invalidasi.
                </div>
              </div>
              <div className="sop-card-item">
                <div className="sop-card-title">{Icons.link} Korelasi Pasar (Cuaca BTC)</div>
                <div className="sop-card-content">
                  • Bitcoin adalah indeks utama pasar kripto.<br />
                  • <strong>DILARANG KERAS</strong> mengambil setup Long di Altcoin jika BTC breakdown!
                </div>
              </div>
              <button
                className="new-chat-btn"
                style={{ background: 'var(--gradient-emerald)', marginTop: 10 }}
                onClick={() => { handleToggleMode('trading'); setShowSopModal(false); }}
              >
                {Icons.zap} Terapkan Mode Trading Neurobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: QUOTAS                                                        */}
      {/* ==================================================================== */}
      {showQuotaModal && (
        <div className="modal-overlay" onClick={() => setShowQuotaModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Status Kuota & Limit OpenRouter</div>
                <div className="modal-subtitle">Data faktual dari server resmi</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowQuotaModal(false)}>{Icons.x}</button>
            </div>
            <div className="modal-body">
              <div className="sop-card-item" style={{ background: '#0B0F1E', borderColor: 'rgba(99,102,241,0.15)' }}>
                <div style={{ color: 'var(--accent-primary-hover)', fontWeight: 800, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {Icons.zap} Fakta Limit OpenRouter
                </div>
                <div style={{ color: '#8B95A8', fontSize: 11.5, lineHeight: 1.6 }}>
                  OpenRouter model gratis (:free) tidak memiliki batas waktu 5 jam atau kuota persentase mingguan. Pembatasan terjadi melalui Rate Limit HTTP 429. Sistem 4 kunci NOVA menjaga koneksi tetap aktif.
                </div>
              </div>
              {loadingQuota ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--accent-primary-hover)' }}>
                  Memeriksa kesehatan kunci API...
                </div>
              ) : (
                quotaData.map((q, idx) => (
                  <div key={idx} className={`quota-key-box ${q.status === '200 OK' ? 'active' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>KUNCI API #{idx + 1}</span>
                      <span style={{ color: q.status === '200 OK' ? 'var(--bull)' : 'var(--bear)', fontWeight: 800, fontSize: 12 }}>{q.status}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{q.masked}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Tier: <strong>{q.free ? 'Free Tier (Gratis)' : 'Standar'}</strong> · Pemakaian: <strong>${q.usage.toFixed(4)}</strong>
                    </div>
                  </div>
                ))
              )}
              <button className="new-chat-btn" onClick={loadQuotas} style={{ marginTop: 8 }}>
                {Icons.refresh} Segarkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MODEL PICKER                                                  */}
      {/* ==================================================================== */}
      {showModelModal && (
        <div className="modal-overlay" onClick={() => setShowModelModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Pilih Preset Model AI</div>
                <div className="modal-subtitle">Pilih arsitektur penalaran yang Anda inginkan</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModelModal(false)}>{Icons.x}</button>
            </div>
            <div className="modal-body">
              {[
                { id: 'max' as AgentMode, title: 'Flagship Reasoning (MAX)', desc: 'Claude Sonnet 3.7 / 3.5 & GPT-6 Astra. Penalaran mendalam & analisis teknikal chart tingkat lanjut.', icon: Icons.cpu },
                { id: 'fast' as AgentMode, title: 'High-Speed Multimodal (FAST)', desc: 'Gemini 3.8 Flash & GPT-5.6 Luna. Respon kilat untuk percakapan harian dan membaca gambar.', icon: Icons.zap },
                { id: 'auto' as AgentMode, title: 'Dynamic Cascade (AUTO)', desc: 'Otomatis memilih model terbaik berdasarkan ketersediaan server.', icon: Icons.refresh }
              ].map((item) => (
                <div
                  key={item.id}
                  className={`quota-key-box ${mode === item.id ? 'active' : ''}`}
                  onClick={() => { setMode(item.id); setShowModelModal(false); }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: mode === item.id ? 'var(--accent-primary-hover)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    {item.icon} {item.title} {mode === item.id && Icons.check}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
