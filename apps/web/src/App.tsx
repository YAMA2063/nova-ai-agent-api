import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import './App.css';

// ============================================================================
// SVG ICON SYSTEM
// ============================================================================
const Icons = {
  nova: (
    <img src="/logo.png" alt="NOVA" className="brand-logo-img" />
  ),
  plus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  x: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  panel: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  brain: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.5 2.8-1.3 3.8A5 5 0 0 1 17 14.5 5 5 0 0 1 14 19v3" />
      <path d="M10 22v-3a5 5 0 0 1-5-4.5 5 5 0 0 1 1.3-3.7A5 5 0 0 1 7 7a5 5 0 0 1 5-5" />
      <path d="M8 14a3 3 0 0 0 4 0" />
    </svg>
  ),
  trendingUp: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  barChart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  bookOpen: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  camera: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  ),
  mic: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  volume: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  square: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  copy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  send: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  messageCircle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  refresh: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  trash: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  pin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
    </svg>
  ),
  alertTriangle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  link: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  cpu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  activity: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  sun: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  eyeOff: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  dots: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  ),
};

// ============================================================================
// TYPES
// ============================================================================
export type UiMessage = { id: string; role: 'user' | 'assistant'; content: string; modelUsed?: string; imageUri?: string; timestamp: string; };
export type ChatSession = { id: string; title: string; createdAt: number; updatedAt: number; mode: 'general' | 'trading'; messages: UiMessage[]; pinned: boolean; };
export type AgentMode = 'max' | 'fast' | 'auto';

// ============================================================================
// CONFIRM MODAL (CSS class-based show/hide for smooth transitions)
// ============================================================================
function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string;
  variant: 'danger' | 'info'; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className={`confirm-overlay ${open ? 'show' : ''}`} onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon-ring ${variant}`}>
          {variant === 'danger' ? Icons.trash : Icons.zap}
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>{cancelLabel || 'Batal'}</button>
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
  try { const saved = localStorage.getItem('@nova_custom_api_keys'); if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean); } catch {}
  let envKeys: string[] = [];
  try { const rawEnv = ((import.meta as any).env?.VITE_OPENROUTER_KEYS || ''); if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean); } catch {}
  const validCustom = customKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  const validEnv = envKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  return Array.from(new Set([...verifiedDefaults, ...validCustom, ...validEnv]));
}

const SESSIONS_KEY = '@nova_web_sessions_v2';
const ACTIVE_SESSION_KEY = '@nova_web_active_id_v2';

const GENERAL_SYSTEM_PROMPT = `# Identitas & Prinsip NOVA (General Intelligence)\nKamu adalah NOVA, asisten AI otonom mutakhir yang berfokus pada kecerdasan komprehensif, penalaran logis, rekayasa kode, penulisan mendalam, dan analisis visual.\n\n## Prinsip Operasional:\n1. Alami & Objektif\n2. Multidisiplin\n3. Bebas Asumsi Finansial\n4. Epistemik Jujur`;

const NEUROBRO_TRADING_PROMPT = `# NOVA Trading Agent — Pedoman & Aturan Baku Neurobro\n\n## Filosofi AI\n1. NO HALLUCINATION: Selalu konfirmasi data chart live.\n2. Pisahkan Kalkulasi dari Interpretasi.\n\n## Hirarki: Struktur > Volume > Momentum\n## MTF Top-Down: H4 (Bias) → M15 (Setup) → M5 (Eksekusi)\n## R:R Minimal 1:2\n## Setiap setup wajib punya BUY/SELL/HOLD + Batas Batal\n## DILARANG Long altcoin jika BTC breakdown`;

const TEXT_MODELS: Record<AgentMode, string[]> = {
  max: ['nex-agi/nex-n2.5-pro:free','google/gemma-4-31b-it:free','inclusionai/ling-3.0-flash-fin:free','liquid/lfm-2.5-2.6b:free','nvidia/nemotron-3.5-lightning:free','nvidia/nemotron-3-super-120b-a12b:free','openai/gpt-6-astra','anthropic/claude-sonnet-5'],
  fast: ['nex-agi/nex-n2.5-mini:free','nex-agi/nex-n2.5-pro:free','google/gemma-4-31b-it:free','liquid/lfm-2.5-2.6b:free','google/gemini-3.8-flash','openai/gpt-5.6-luna'],
  auto: ['nex-agi/nex-n2.5-pro:free','google/gemma-4-31b-it:free','inclusionai/ling-3.0-flash-fin:free','nex-agi/nex-n2.5-mini:free','liquid/lfm-2.5-2.6b:free','nvidia/nemotron-3.5-lightning:free','anthropic/claude-sonnet-5','openai/gpt-6-astra']
};

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================================================
// INDICATOR CALCULATIONS
// ============================================================================
function calculateRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i-1]; if (d >= 0) gains += d; else losses += Math.abs(d); }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) { const d = closes[i] - closes[i-1]; if (d >= 0) { ag = (ag*(period-1)+d)/period; al = (al*(period-1))/period; } else { ag = (ag*(period-1))/period; al = (al*(period-1)+Math.abs(d))/period; } }
  if (al === 0) return 100;
  return Math.round((100 - 100 / (1 + ag/al)) * 100) / 100;
}

function calculateMa(v: number[], p = 20): number {
  if (!v.length) return 0;
  const s = v.slice(-p);
  return Math.round((s.reduce((a,b) => a+b, 0) / s.length) * 100) / 100;
}

export async function fetchLiveMarketData(symbol: string) {
  try {
    const sym = symbol.toUpperCase().replace('/', '').trim();
    const tickerRes = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${sym}`);
    if (!tickerRes.ok) return null;
    const ticker = await tickerRes.json();
    const [h4R, m15R, m5R, btcR] = await Promise.all([
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=4h&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=15m&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=5m&limit=25`),
      sym !== 'BTCUSDT' ? fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT`) : Promise.resolve(null)
    ]);
    const h4D = await h4R.json(), m15D = await m15R.json(), m5D = await m5R.json();
    const btcT = btcR ? await btcR.json() : null;
    const h4C = h4D.map((k:any) => parseFloat(k[4])), h4H = h4D.map((k:any) => parseFloat(k[2])), h4L = h4D.map((k:any) => parseFloat(k[3]));
    const h4Close = h4C[h4C.length-1], h4High = Math.max(...h4H), h4Low = Math.min(...h4L);
    const m15C = m15D.map((k:any) => parseFloat(k[4])), m15V = m15D.map((k:any) => parseFloat(k[5]));
    const m5C = m5D.map((k:any) => parseFloat(k[4])), m5O = m5D.map((k:any) => parseFloat(k[1]));
    const m15Rsi = calculateRsi(m15C, 14), m15Vm = calculateMa(m15V, 20);
    const m15Vr = m15Vm > 0 ? Math.round((m15V[m15V.length-1]/m15Vm)*100)/100 : 1;
    const m5Rsi = calculateRsi(m5C, 14), m5Candle = m5C[m5C.length-1] >= m5O[m5O.length-1] ? 'BULLISH' : 'BEARISH';
    let btcW; if (btcT) { const ch = parseFloat(btcT.priceChangePercent); btcW = { price: parseFloat(btcT.lastPrice), change24h: ch, status: ch < -3.5 ? 'DUMP_ALERT' : 'NORMAL' }; }
    return { symbol: sym, price: parseFloat(ticker.lastPrice), change24h: parseFloat(ticker.priceChangePercent), high24h: parseFloat(ticker.highPrice), low24h: parseFloat(ticker.lowPrice), volume24h: parseFloat(ticker.volume),
      h4: { lastClose: h4Close, high: h4High, low: h4Low, trend: h4Close > (h4High+h4Low)/2 ? 'BULLISH' : 'BEARISH' },
      m15: { rsi: m15Rsi, volRatio: m15Vr }, m5: { rsi: m5Rsi, candle: m5Candle }, btcWeather: btcW };
  } catch { return null; }
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => { try { return marked.parse(content || '', { breaks: true, gfm: true }) as string; } catch { return content || ''; } }, [content]);
  return <div className="message-body prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [sidebarMini, setSidebarMini] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'info'; confirmLabel?: string; onConfirm: () => void; }>({ open: false, title: '', message: '', variant: 'info', onConfirm: () => {} });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const chatMode = activeSession?.mode || 'general';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setOpenDropdownId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Theme
  useEffect(() => {
    document.body.classList.toggle('light', !isDark);
  }, [isDark]);

  // Load Sessions
  useEffect(() => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    const savedId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          // Ensure pinned field exists
          const migrated = parsed.map((s: any) => ({ ...s, pinned: s.pinned || false }));
          setSessions(migrated);
          setCurrentSessionId(savedId && migrated.some((s: any) => s.id === savedId) ? savedId : migrated[0].id);
          return;
        }
      } catch {}
    }
    createInitialSession();
  }, []);

  const createInitialSession = () => {
    const s: ChatSession = { id: `s_${Date.now()}`, title: 'Percakapan Baru', createdAt: Date.now(), updatedAt: Date.now(), mode: 'general', pinned: false, messages: [] };
    setSessions([s]);
    setCurrentSessionId(s.id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([s]));
    localStorage.setItem(ACTIVE_SESSION_KEY, s.id);
  };

  const saveSessions = (updated: ChatSession[], activeId?: string) => {
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    if (activeId) { setCurrentSessionId(activeId); localStorage.setItem(ACTIVE_SESSION_KEY, activeId); }
  };

  // Sorted sessions: pinned first
  const sortedSessions = useMemo(() => {
    const pinned = sessions.filter(s => s.pinned);
    const unpinned = sessions.filter(s => !s.pinned);
    return [...pinned, ...unpinned];
  }, [sessions]);

  // Live market stats
  useEffect(() => {
    let m = true;
    const f = async () => { const d = await fetchLiveMarketData(selectedSymbol); if (m) setMarketStats(d); };
    f(); const i = setInterval(f, 10000);
    return () => { m = false; clearInterval(i); };
  }, [selectedSymbol]);

  // Auto scroll
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  // ── Handlers ──
  const handleNewChat = () => {
    const s: ChatSession = { id: `s_${Date.now()}`, title: 'Percakapan Baru', createdAt: Date.now(), updatedAt: Date.now(), mode: chatMode, pinned: false, messages: [] };
    saveSessions([s, ...sessions.filter(x => x.pinned), ...sessions.filter(x => !x.pinned)], s.id);
    setSidebarOpen(false);
  };

  const handleToggleMode = (m: 'general' | 'trading') => {
    saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, mode: m } : s));
  };

  const handleTogglePin = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    if (!session.pinned) {
      const pinnedCount = sessions.filter(s => s.pinned).length;
      if (pinnedCount >= 3) {
        setConfirmState({ open: true, variant: 'info', title: 'Batas Sematan Tercapai', message: 'Maksimal <strong>3 percakapan</strong> yang bisa disematkan. Lepas salah satu sematan terlebih dahulu.', confirmLabel: 'Mengerti', onConfirm: () => setConfirmState(p => ({ ...p, open: false })) });
        return;
      }
    }
    saveSessions(sessions.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
    setOpenDropdownId(null);
  };

  const handleDeleteSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    setOpenDropdownId(null);
    setConfirmState({
      open: true, variant: 'danger', title: 'Hapus Percakapan',
      message: `Percakapan "<strong>${session?.title || 'Percakapan'}</strong>" akan dihapus permanen.`,
      confirmLabel: 'Hapus',
      onConfirm: () => {
        const updated = sessions.filter(s => s.id !== id);
        if (updated.length === 0) createInitialSession();
        else saveSessions(updated, currentSessionId === id ? updated[0].id : currentSessionId);
        setConfirmState(p => ({ ...p, open: false }));
      }
    });
  };

  const handleClearAll = () => {
    setConfirmState({
      open: true, variant: 'danger', title: 'Hapus Semua Riwayat',
      message: `Semua percakapan akan <strong>dihapus permanen</strong> dan tidak dapat dikembalikan.`,
      confirmLabel: 'Hapus Semua',
      onConfirm: () => { createInitialSession(); setConfirmState(p => ({ ...p, open: false })); }
    });
  };

  const handleToggleVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { setIsListening(false); return; }
    try {
      const r = new SR(); r.lang = 'id-ID'; r.continuous = false; r.interimResults = false;
      r.onstart = () => setIsListening(true); r.onend = () => setIsListening(false); r.onerror = () => setIsListening(false);
      r.onresult = (e: any) => { setInput(p => (p ? `${p} ${e.results[0][0].transcript}` : e.results[0][0].transcript)); };
      r.start();
    } catch { setIsListening(false); }
  };

  const handleToggleTts = (id: string, text: string) => {
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel(); setSpeakingId(id);
    const u = new SpeechSynthesisUtterance(text.slice(0, 800)); u.lang = 'id-ID';
    u.onend = () => setSpeakingId(null); u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  };

  const handleCopy = (id: string, text: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const b64 = (reader.result as string).split(',')[1]; setAttachment({ uri: reader.result as string, base64: b64, name: file.name }); };
    reader.readAsDataURL(file);
  };

  // Quick reply handler
  const handleQuickReply = (text: string) => { setInput(text); };

  // ── API Call ──
  const callOpenRouter = async (history: UiMessage[], promptText: string, cMode: 'general'|'trading', aMode: AgentMode, attach?: any) => {
    const models = TEXT_MODELS[aMode] || TEXT_MODELS.auto;
    let content: any = promptText;
    if (attach?.base64) { content = [{ type: 'text', text: promptText.trim() || 'Analisis gambar ini.' }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${attach.base64}` } }]; }
    const clean = history.filter(m => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome').map(m => ({ role: m.role as 'user'|'assistant', content: m.content }));
    const msgs = [{ role: 'system', content: cMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT }, ...clean, { role: 'user', content }];
    let lastErr: any = null;
    for (const model of models) {
      for (const key of getOpenRouterKeys()) {
        try {
          const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 18000);
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: ctrl.signal, headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'NOVA Web' }, body: JSON.stringify({ model, temperature: cMode === 'trading' ? 0.15 : 0.4, max_tokens: 2500, messages: msgs }) });
          clearTimeout(timer);
          if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
          const data = await res.json();
          if (data.error) { lastErr = new Error(data.error?.message || 'Provider error'); break; }
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return { content: reply, model: data.model || model };
          else { lastErr = new Error('Respon kosong'); break; }
        } catch (e: any) { lastErr = e; }
      }
    }
    throw lastErr || new Error('Gagal menghubungi OpenRouter.');
  };

  // ── Auto Analysis ──
  const triggerAutoAnalysis = async (symbol: string) => {
    if (chatMode !== 'trading') handleToggleMode('trading');
    setBusy(true);
    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: `Analisis Otomatis ${symbol} (Top-Down MTF H4 → M15 → M5)`, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, title: `Analisa ${symbol}`, mode: 'trading', messages: curMsgs } : s));
    try {
      const d = await fetchLiveMarketData(symbol);
      if (!d) throw new Error('Gagal tarik data live.');
      const prompt = `[DATA LIVE BINANCE]: ${d.symbol} $${d.price} (${d.change24h > 0?'+':''}${d.change24h.toFixed(2)}%) | H4: ${d.h4.trend} | M15 RSI: ${d.m15.rsi} Vol: ${d.m15.volRatio}x | M5: ${d.m5.candle} RSI: ${d.m5.rsi}${d.btcWeather ? ` | BTC: $${d.btcWeather.price.toFixed(0)} (${d.btcWeather.status})` : ''}\n\nLakukan analisis trading Neurobro: Bias H4, Setup M15, Entry M5, R:R >= 1:2, Batas Batal.`;
      const result = await callOpenRouter(curMsgs, prompt, 'trading', mode);
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...curMsgs, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...curMsgs, eMsg] } : s));
    } finally { setBusy(false); }
  };

  // ── Send Message ──
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    if (busy) return;
    const match = trimmed.toUpperCase().match(/\b(BTC|ETH|SOL|BNB|XAU|EUR)(USDT)?\b/);
    if (chatMode === 'trading' && match && !attachment) { const sym = match[1] === 'EUR' ? 'EURUSDT' : `${match[1]}USDT`; setInput(''); await triggerAutoAnalysis(sym); return; }
    setBusy(true);
    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: trimmed, imageUri: attachment?.uri, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    const title = activeSession?.title === 'Percakapan Baru' ? trimmed.slice(0, 36) + (trimmed.length > 36 ? '…' : '') : activeSession?.title || 'Obrolan';
    saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, title, messages: curMsgs } : s));
    const curAttach = attachment; setInput(''); setAttachment(null);
    try {
      const result = await callOpenRouter(curMsgs, trimmed, chatMode, mode, curAttach);
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...curMsgs, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, messages: [...curMsgs, eMsg] } : s));
    } finally { setBusy(false); }
  };

  const loadQuotas = async () => {
    setLoadingQuota(true); setShowQuotaModal(true);
    try {
      const results = await Promise.all(getOpenRouterKeys().map(async (k) => {
        const masked = `${k.slice(0, 10)}...${k.slice(-6)}`;
        try { const r = await fetch('https://openrouter.ai/api/v1/auth/key', { headers: { 'Authorization': `Bearer ${k}` } }); const j = await r.json(); if (!r.ok) return { masked, status: 'ERROR', usage: 0, free: false }; const d = j.data || {}; return { masked: d.label || masked, status: '200 OK', usage: Number(d.usage || 0), free: Boolean(d.is_free_tier) }; } catch { return { masked, status: 'ERROR', usage: 0, free: false }; }
      }));
      setQuotaData(results);
    } finally { setLoadingQuota(false); }
  };

  const isWelcome = messages.length === 0;

  // Quick reply suggestions
  const generalQuickReplies = ['Bantu saya menulis kode Python', 'Jelaskan konsep Machine Learning', 'Tips belajar programming', 'Analisis gambar yang saya kirim'];
  const tradingQuickReplies = ['Analisa BTC', 'Analisa ETH', 'Analisa SOL', 'Jelaskan SOP Neurobro'];

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="app-shell">
      <ConfirmModal open={confirmState.open} title={confirmState.title} message={confirmState.message} variant={confirmState.variant} confirmLabel={confirmState.confirmLabel} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(p => ({ ...p, open: false }))} />

      {/* ════════ SIDEBAR ════════ */}
      <aside className={`sidebar ${sidebarMini ? 'mini' : ''} ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Row (Full) */}
        <div className="sidebar-brand-row">
          <div className="brand-logo-group">
            <div className="brand-emblem">{Icons.nova}</div>
            <div className="sidebar-logo-text">
              <div className="brand-text">NOVA AI</div>
              <div className="brand-subtitle">Trading & Intelligence</div>
            </div>
          </div>
          <span className="brand-version">PRO</span>
          <button className="btn-toggle-sidebar" onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); else setSidebarMini(!sidebarMini); }} title={sidebarMini ? 'Buka Sidebar' : 'Tutup Sidebar'}>
            {Icons.panel}
          </button>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>{Icons.x}</button>
        </div>

        {/* Mini Icons */}
        <div className="sidebar-mini-icons">
          <button className="mini-icon-btn" onClick={() => setSidebarMini(false)} title="Buka Sidebar">{Icons.panel}</button>
          <button className="mini-icon-btn accent" onClick={handleNewChat} title="Chat Baru">{Icons.plus}</button>
        </div>

        {/* New Chat (Full) */}
        <button className="btn-new-chat-full" onClick={handleNewChat}>
          {Icons.plus} Chat Baru
        </button>

        <div className="sidebar-section-title">Mode</div>
        <div className="mode-switcher-capsule">
          <button className={`mode-switcher-tab ${chatMode === 'general' ? 'active' : ''}`} onClick={() => handleToggleMode('general')}>
            {Icons.brain} Umum
          </button>
          <button className={`mode-switcher-tab ${chatMode === 'trading' ? 'trading-active' : ''}`} onClick={() => handleToggleMode('trading')}>
            {Icons.trendingUp} Neurobro
          </button>
        </div>

        <div className="sidebar-nav-list">
          <button className={`sidebar-nav-item ${showChartPanel ? 'active' : ''}`} onClick={() => setShowChartPanel(!showChartPanel)}>
            {showChartPanel ? Icons.eyeOff : Icons.barChart} {showChartPanel ? 'Tutup Chart' : 'Buka TradingView'}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowSopModal(true)}>{Icons.bookOpen} Pedoman (SOP)</button>
          <button className="sidebar-nav-item" onClick={loadQuotas}>{Icons.zap} Status Kuota</button>
          <button className="sidebar-nav-item" onClick={() => setShowModelModal(true)}>{Icons.settings} Model ({mode.toUpperCase()})</button>
        </div>

        <div className="sidebar-history-header">
          <div className="sidebar-section-title">Riwayat</div>
        </div>

        <div className="history-scroll-area">
          {sortedSessions.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px' }}>Belum ada percakapan</div>}
          {sortedSessions.map((s) => (
            <div key={s.id} className={`history-item ${s.id === currentSessionId ? 'active' : ''}`} onClick={() => { setCurrentSessionId(s.id); setSidebarOpen(false); }}>
              <span className={`history-pin-badge ${s.pinned ? 'show' : ''}`}>{Icons.pin}</span>
              <div className="history-item-left">
                <div className="history-item-title">
                  {s.mode === 'trading' ? Icons.trendingUp : Icons.messageCircle} {s.title}
                </div>
                <div className="history-item-meta">{s.messages.length} pesan</div>
              </div>
              <div className="history-item-menu" onClick={(e) => e.stopPropagation()}>
                <button className="history-item-dots" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === s.id ? null : s.id); }} title="Opsi">⋯</button>
                <div className={`history-dropdown ${openDropdownId === s.id ? 'open' : ''}`}>
                  <button className="history-dd-item" onClick={() => handleTogglePin(s.id)}>
                    {Icons.pin} {s.pinned ? 'Lepas Sematan' : 'Sematkan'}
                  </button>
                  <button className="history-dd-item danger" onClick={() => handleDeleteSession(s.id)}>
                    {Icons.trash} Hapus Percakapan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-actions">
            <button className="btn-footer" onClick={() => setIsDark(!isDark)}>
              {isDark ? Icons.sun : Icons.moon} Ganti Tema
            </button>
            <button className="btn-footer danger" onClick={handleClearAll}>
              {Icons.trash} Hapus Riwayat
            </button>
          </div>
          <div className="sidebar-status">
            <div className="status-dot-pulse" />
            <span>4 Kunci API · Live</span>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN ARENA ════════ */}
      <main className="main-arena">
        <header className="main-header">
          <div className="main-header-left">
            {window.innerWidth <= 768 && (
              <button className="header-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '6px 8px' }}>{Icons.nova}</button>
            )}
            <div className="header-mode-badge">
              <div className="status-dot" />
              {chatMode === 'trading' ? 'NOVA Neurobro' : 'NOVA AI'}
            </div>
          </div>
          <div className="main-header-right">
            <button className={`header-btn ${showChartPanel ? 'active-chart' : ''}`} onClick={() => setShowChartPanel(!showChartPanel)}>
              {Icons.barChart} {showChartPanel ? 'Tutup' : 'Chart'}
            </button>
            <button className="header-btn" onClick={loadQuotas}>{Icons.zap} Kuota</button>
            <button className="header-btn" onClick={() => setShowSopModal(true)}>{Icons.bookOpen} SOP</button>
          </div>
        </header>

        <div className="chat-stream-container" ref={scrollRef}>
          {/* Welcome Screen */}
          {isWelcome && (
            <div className="welcome-screen">
              <div className="welcome-logo">{Icons.nova}</div>
              <div className="welcome-title">Selamat Datang!</div>
              <div className="welcome-sub">
                {chatMode === 'trading'
                  ? 'NOVA Trading Neurobro siap menganalisis chart dengan SOP baku Top-Down MTF. Pilih topik atau ketik pertanyaan.'
                  : 'Saya NOVA, asisten AI mutakhir. Tanyakan apa saja seputar kode, logika, atau kirim gambar untuk dianalisis.'}
              </div>
              <div className="quick-replies">
                {(chatMode === 'trading' ? tradingQuickReplies : generalQuickReplies).map((text) => (
                  <button key={text} className="quick-reply-btn" onClick={() => handleQuickReply(text)}>{text}</button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m) => (
            <div key={m.id} className={`message-row ${m.role}`}>
              {m.role === 'assistant' && <div className="assistant-avatar-circle">{Icons.nova}</div>}
              {m.role === 'user' && <div className="user-avatar-circle">U</div>}
              <div className="message-card">
                {m.imageUri && <div className="attached-image-container"><img src={m.imageUri} alt="Attached" /></div>}
                {m.role === 'assistant' ? <MarkdownContent content={m.content} /> : <div className="message-body user-body">{m.content}</div>}
                {m.role === 'assistant' && (
                  <div className="message-actions-row">
                    <button className={`message-action-pill ${speakingId === m.id ? 'active' : ''}`} onClick={() => handleToggleTts(m.id, m.content)}>
                      {speakingId === m.id ? Icons.square : Icons.volume} {speakingId === m.id ? 'Stop' : 'Suara'}
                    </button>
                    <button className="message-action-pill" onClick={() => handleCopy(m.id, m.content)}>
                      {copiedId === m.id ? Icons.check : Icons.copy} {copiedId === m.id ? 'Tersalin' : 'Salin'}
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
                <div className="typing-dots"><span /><span /><span /></div>
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
                <div className="attachment-hint">{Icons.check} Siap dianalisis</div>
              </div>
              <button className="attachment-close-btn" onClick={() => setAttachment(null)}>{Icons.x}</button>
            </div>
          )}
          <div className="composer-box">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            <button className="composer-icon-btn" onClick={() => fileInputRef.current?.click()} title="Unggah Gambar">{Icons.camera}</button>
            <button className={`composer-icon-btn ${isListening ? 'active-mic' : ''}`} onClick={handleToggleVoiceInput} title="Input Suara">{Icons.mic}</button>
            <textarea className="composer-textarea" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={chatMode === 'trading' ? 'Ketik "Analisa BTC" atau tanyakan setup…' : 'Ketik pesan untuk NOVA…'} rows={1} />
            <button className="composer-send-btn" onClick={handleSend} disabled={busy || (!input.trim() && !attachment)}>
              {Icons.send} Kirim
            </button>
          </div>
          <div className="composer-hint">Tekan Enter untuk mengirim · Shift+Enter baris baru</div>
        </footer>
      </main>

      {/* ════════ TRADINGVIEW PANEL ════════ */}
      {showChartPanel && (
        <aside className="trading-panel animate-fade-in">
          <div className="trading-panel-header">
            <div className="trading-panel-title">{Icons.activity} Live TradingView (16:9)</div>
            <button className="modal-close-btn" onClick={() => setShowChartPanel(false)}>{Icons.x}</button>
          </div>
          <div className="symbol-tab-bar">
            {['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XAUUSDT'].map(sym => (
              <button key={sym} className={`symbol-tab ${selectedSymbol === sym ? 'active' : ''}`} onClick={() => setSelectedSymbol(sym)}>{sym.replace('USDT','/USDT')}</button>
            ))}
          </div>
          <div className="tv-iframe-wrapper">
            <iframe title="TradingView" src={`https://s.tradingview.com/widgetembed/?frameElementId=tv&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0D111A&theme=dark&style=1&timezone=Asia%2FJakarta`} />
          </div>
          <div className="mtf-dashboard-section">
            {marketStats && (
              <div className="mtf-stats-grid">
                <div className="mtf-card-box"><div className="mtf-card-label">H4 Trend</div><div className={`mtf-card-val ${marketStats.h4.trend === 'BULLISH' ? 'bull' : 'bear'}`}>{marketStats.h4.trend}</div></div>
                <div className="mtf-card-box"><div className="mtf-card-label">M15 RSI (14)</div><div className="mtf-card-val">{marketStats.m15.rsi}</div></div>
                <div className="mtf-card-box"><div className="mtf-card-label">M5 Candle</div><div className={`mtf-card-val ${marketStats.m5.candle === 'BULLISH' ? 'bull' : 'bear'}`}>{marketStats.m5.candle}</div></div>
              </div>
            )}
            <button className="auto-analyze-hero-btn" onClick={() => triggerAutoAnalysis(selectedSymbol)} disabled={busy}>
              <span className="auto-analyze-icon">{Icons.zap}</span>
              <div><div className="auto-analyze-title">Analisis Otomatis {selectedSymbol}</div><div className="auto-analyze-sub">Tarik data live & jalankan Neurobro (R:R ≥ 1:2)</div></div>
            </button>
          </div>
        </aside>
      )}

      {/* ════════ MODALS ════════ */}
      {showSopModal && (
        <div className="modal-overlay" onClick={() => setShowSopModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div><div className="modal-title">Pedoman Trading Neurobro</div><div className="modal-subtitle">Aturan baku dari AI YM_Trading</div></div><button className="modal-close-btn" onClick={() => setShowSopModal(false)}>{Icons.x}</button></div>
            <div className="modal-body">
              <div className="sop-card-item"><div className="sop-card-title">{Icons.brain} Filosofi AI</div><div className="sop-card-content">• <strong>No Hallucination:</strong> Wajib konfirmasi data chart live.<br/>• <strong>Pisahkan Kalkulasi:</strong> Fokus aksi harga faktual.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.zap} Eksekusi</div><div className="sop-card-content">• <strong>Hirarki:</strong> Struktur {'>'} Volume {'>'} Momentum.<br/>• <strong>Breakout vs Fakeout:</strong> Tunggu candle close + retest volume.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.settings} Indikator</div><div className="sop-card-content">• <strong>MACD:</strong> 12/26/9.<br/>• <strong>RSI:</strong> 14. Dilarang short hanya karena RSI {'>'} 70.<br/>• <strong>Volume:</strong> MA 20.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.clock} MTF Top-Down</div><div className="sop-card-content">• <strong>H4:</strong> Bias Utama.<br/>• <strong>M15:</strong> Area Setup.<br/>• <strong>M5:</strong> Konfirmasi Entry.<br/>• <strong>M1:</strong> Diabaikan.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.shield} Validasi</div><div className="sop-card-content">• <strong>R:R:</strong> Minimal 1:2.<br/>• <strong>Fakta vs Narasi:</strong> Dilarang spekulasi.<br/>• <strong>Batas Batal:</strong> Wajib ada harga invalidasi.</div></div>
              <button className="btn-new-chat-full" style={{ background: 'var(--gradient-emerald)', margin: '10px 0 0' }} onClick={() => { handleToggleMode('trading'); setShowSopModal(false); }}>{Icons.zap} Terapkan Mode Trading</button>
            </div>
          </div>
        </div>
      )}

      {showQuotaModal && (
        <div className="modal-overlay" onClick={() => setShowQuotaModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div><div className="modal-title">Status Kuota OpenRouter</div></div><button className="modal-close-btn" onClick={() => setShowQuotaModal(false)}>{Icons.x}</button></div>
            <div className="modal-body">
              {loadingQuota ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--accent-primary-hover)' }}>Memeriksa kunci API...</div> : quotaData.map((q, i) => (
                <div key={i} className={`quota-key-box ${q.status === '200 OK' ? 'active' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 13 }}>KUNCI #{i+1}</span><span style={{ color: q.status === '200 OK' ? 'var(--bull)' : 'var(--bear)', fontWeight: 700, fontSize: 12 }}>{q.status}</span></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{q.masked}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tier: <strong>{q.free ? 'Free' : 'Standar'}</strong> · ${q.usage.toFixed(4)}</div>
                </div>
              ))}
              <button className="btn-new-chat-full" onClick={loadQuotas} style={{ margin: '8px 0 0' }}>{Icons.refresh} Segarkan</button>
            </div>
          </div>
        </div>
      )}

      {showModelModal && (
        <div className="modal-overlay" onClick={() => setShowModelModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header"><div><div className="modal-title">Pilih Model AI</div></div><button className="modal-close-btn" onClick={() => setShowModelModal(false)}>{Icons.x}</button></div>
            <div className="modal-body">
              {([{ id: 'max' as AgentMode, title: 'Flagship (MAX)', desc: 'Penalaran mendalam & chart tingkat lanjut.', icon: Icons.cpu }, { id: 'fast' as AgentMode, title: 'High-Speed (FAST)', desc: 'Respon kilat untuk percakapan harian.', icon: Icons.zap }, { id: 'auto' as AgentMode, title: 'Dynamic (AUTO)', desc: 'Otomatis pilih model terbaik.', icon: Icons.refresh }]).map(item => (
                <div key={item.id} className={`quota-key-box ${mode === item.id ? 'active' : ''}`} onClick={() => { setMode(item.id); setShowModelModal(false); }} style={{ cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: mode === item.id ? 'var(--accent-primary-hover)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 7 }}>{item.icon} {item.title} {mode === item.id && Icons.check}</div>
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
