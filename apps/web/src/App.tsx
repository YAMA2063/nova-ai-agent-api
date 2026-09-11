import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './App.css';

// ============================================================================
// SVG ICON SYSTEM
// ============================================================================
const Icons = {
  nova: (
    <img src="/nova%20logo.png" alt="NOVA" className="brand-logo-img" />
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
  film: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  ),
  paperclip: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  headphones: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  )
};

// ============================================================================
// TYPES
// ============================================================================
export type MediaType = 'image' | 'video' | 'audio';
export type MediaAttachment = { uri: string; base64: string; name: string; type: MediaType };
export type UiMessage = { id: string; role: 'user' | 'assistant'; content: string; modelUsed?: string; attachment?: MediaAttachment; timestamp: string; };
export type ChatSession = { id: string; title: string; createdAt: number; updatedAt: number; mode: 'general' | 'trading'; messages: UiMessage[]; pinned: boolean; };

export type ORModel = { 
  id: string; 
  name: string; 
  description: string; 
  pricing: { prompt: string; completion: string };
  contextLength: number;
  inputModalities: string[];
  outputModalities: string[];
  created: number;
};

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
// ⚠️ SECURITY NOTE: These keys ship inside the client bundle and can be
// extracted by anyone via DevTools (just atob() them). Anyone can then spend
// your OpenRouter quota. For a real production app, move all OpenRouter
// calls behind your own backend/serverless proxy that holds the keys
// server-side, and never embed real credentials in frontend code.
const DEFAULT_B64_KEYS = [
  'c2stb3ItdjEtMjc0YmU4Y2QyMjJkMDIyM2Q2MjE2ZTg1MzZiYjRhZGE3M2M4ZGZmMzI1OWQ3YzczNDQ4N2I4MzkyYTcxNTc1Yg==',
  'c2stb3ItdjEtNmI3MTg2ZTk2ODFjMzQwNGQ1NzY2ODQ5MDc4MjhhM2ZjNzFmNmI5MjgzZmIyMTQ3MGI1YTUwNzVhM2Y2NWY4MQ==',
  'c2stb3ItdjEtMDU1MmIyNDY4OGY3ZDkyZmI4YWY5YTUzMjI0Yjg0ZGZhNWEzOTI5MjE5NzM5YWUxZGMwMmM1OTQxNWI0MmU1Mg==',
  'c2stb3ItdjEtNTFhMmNhOWZmNGI2NDhjZThiNTA4NjUzOTcxOTdhOGUwYTE4ZTNlOTg3ZjBjNzcwOTgwZmNiYzcxZWYxOGY3Nw=='
];

export function getOpenRouterKeys(): string[] {
  const verifiedDefaults = DEFAULT_B64_KEYS.map((b) => atob(b));
  let customKeys: string[] = [];
  try { const saved = localStorage.getItem('@nova_custom_api_keys'); if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean); } catch { }
  let envKeys: string[] = [];
  try { const rawEnv = ((import.meta as any).env?.VITE_OPENROUTER_KEYS || ''); if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean); } catch { }
  const validCustom = customKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  const validEnv = envKeys.filter((k) => k.startsWith('sk-or-v1-') && k.length >= 60);
  return Array.from(new Set([...verifiedDefaults, ...validCustom, ...validEnv]));
}

const SESSIONS_KEY = '@nova_web_sessions_v2';
const ACTIVE_SESSION_KEY = '@nova_web_active_id_v2';

const GENERAL_SYSTEM_PROMPT = `# Identitas & Prinsip NOVA (General Intelligence)\nKamu adalah NOVA, asisten AI otonom mutakhir yang berfokus pada kecerdasan komprehensif, penalaran logis, rekayasa kode, penulisan mendalam, dan analisis visual.\n\n## Prinsip Operasional:\n1. Alami & Objektif\n2. Multidisiplin\n3. Bebas Asumsi Finansial\n4. Epistemik Jujur`;

const NEUROBRO_TRADING_PROMPT = `# NOVA Trading Agent — Pedoman & Aturan Baku Neurobro\n\n## Filosofi AI\n1. NO HALLUCINATION: Selalu konfirmasi data chart live.\n2. Pisahkan Kalkulasi dari Interpretasi.\n\n## Hirarki: Struktur > Volume > Momentum\n## MTF Top-Down: H4 (Bias) → M15 (Setup) → M5 (Eksekusi)\n## R:R Minimal 1:2\n## Setiap setup wajib punya BUY/SELL/HOLD + Batas Batal\n## DILARANG Long altcoin jika BTC breakdown`;

const IMAGE_MODEL = 'black-forest-labs/flux-schnell';
const TTS_MODEL = 'openai/tts-1';

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ============================================================================
// INDICATOR CALCULATIONS
// ============================================================================
function calculateRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) gains += d; else losses += Math.abs(d); }
  let ag = gains / period, al = losses / period;
  for (let i = period + 1; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) { ag = (ag * (period - 1) + d) / period; al = (al * (period - 1)) / period; } else { ag = (ag * (period - 1)) / period; al = (al * (period - 1) + Math.abs(d)) / period; } }
  // FIX: flat price (no gains AND no losses) should read as neutral (50),
  // not "maximally overbought" (100). Only saturate to 100 when there were
  // real gains but literally zero losses.
  if (ag === 0 && al === 0) return 50;
  if (al === 0) return 100;
  return Math.round((100 - 100 / (1 + ag / al)) * 100) / 100;
}

function calculateMa(v: number[], p = 20): number {
  if (!v.length) return 0;
  const s = v.slice(-p);
  return Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 100) / 100;
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
    const h4C = h4D.map((k: any) => parseFloat(k[4])), h4H = h4D.map((k: any) => parseFloat(k[2])), h4L = h4D.map((k: any) => parseFloat(k[3]));
    const h4Close = h4C[h4C.length - 1], h4High = Math.max(...h4H), h4Low = Math.min(...h4L);
    const m15C = m15D.map((k: any) => parseFloat(k[4])), m15V = m15D.map((k: any) => parseFloat(k[5]));
    const m5C = m5D.map((k: any) => parseFloat(k[4])), m5O = m5D.map((k: any) => parseFloat(k[1]));
    const m15Rsi = calculateRsi(m15C, 14), m15Vm = calculateMa(m15V, 20);
    const m15Vr = m15Vm > 0 ? Math.round((m15V[m15V.length - 1] / m15Vm) * 100) / 100 : 1;
    const m5Rsi = calculateRsi(m5C, 14), m5Candle = m5C[m5C.length - 1] >= m5O[m5O.length - 1] ? 'BULLISH' : 'BEARISH';
    let btcW; if (btcT) { const ch = parseFloat(btcT.priceChangePercent); btcW = { price: parseFloat(btcT.lastPrice), change24h: ch, status: ch < -3.5 ? 'DUMP_ALERT' : 'NORMAL' }; }
    return {
      symbol: sym, price: parseFloat(ticker.lastPrice), change24h: parseFloat(ticker.priceChangePercent), high24h: parseFloat(ticker.highPrice), low24h: parseFloat(ticker.lowPrice), volume24h: parseFloat(ticker.volume),
      h4: { lastClose: h4Close, high: h4High, low: h4Low, trend: h4Close > (h4High + h4Low) / 2 ? 'BULLISH' : 'BEARISH' },
      m15: { rsi: m15Rsi, volRatio: m15Vr }, m5: { rsi: m5Rsi, candle: m5Candle }, btcWeather: btcW
    };
  } catch { return null; }
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      const raw = marked.parse(content || '', { breaks: true, gfm: true }) as string;
      // FIX: sanitize before injecting via dangerouslySetInnerHTML.
      // Model output is untrusted content (it can be influenced by prompt
      // injection from pasted text/images), so rendering its raw HTML
      // without sanitizing is an XSS vector. Requires: npm i dompurify
      return DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] });
    } catch { return ''; }
  }, [content]);
  return <div className="message-body prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarMini, setSidebarMini] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-1.5-pro');
  const [availableModels, setAvailableModels] = useState<ORModel[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelTab, setModelTab] = useState<'all' | 'text' | 'image' | 'video' | 'audio'>('all');
  const [modelSort, setModelSort] = useState<'popular' | 'newest' | 'oldest' | 'weekly'>('popular');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<MediaAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [showChartPanel, setShowChartPanel] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketStats, setMarketStats] = useState<any>(null);

  const [showSopModal, setShowSopModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaData, setQuotaData] = useState<{ masked: string, status: string, usage: number, free: boolean }[]>([]);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Fetch available models from OpenRouter
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/models?output_modalities=image,video,audio,speech,text');
        const data = await res.json();
        if (data && data.data) {
          const mapped: ORModel[] = data.data.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            description: m.description || '',
            pricing: {
              prompt: m.pricing?.prompt || '0',
              completion: m.pricing?.completion || '0'
            },
            contextLength: m.top_provider?.context_length || m.context_length || 0,
            inputModalities: m.architecture?.input_modalities || ['text'],
            outputModalities: m.architecture?.output_modalities || ['text'],
            created: m.created || 0
          }));
          
          // OpenRouter API returns models sorted by popularity by default.
          setAvailableModels(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch models', err);
      }
    };
    fetchModels();
  }, []);

  // FIX: window.innerWidth read directly in JSX is not reactive — resizing
  // the window (or rotating a device) didn't update the hamburger button /
  // sidebar-toggle behavior until some unrelated re-render happened.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; variant: 'danger' | 'info'; confirmLabel?: string; onConfirm: () => void; }>({ open: false, title: '', message: '', variant: 'info', onConfirm: () => { } });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const chatMode = activeSession?.mode || 'general';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setOpenDropdownId(null);
      setIsModelDropdownOpen(false);
    };
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
      } catch { }
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

  // FIX: saveSessions now also accepts a functional updater `(prev) => next`.
  // Places that save *after* an `await` (e.g. once an AI response comes back)
  // now use the functional form so they always build on the latest state
  // instead of a state snapshot captured before the await — previously, any
  // session changes made while a request was in flight (deleting another
  // chat, pinning, etc.) could get silently overwritten when the response
  // finally landed.
  const saveSessions = (
    updater: ChatSession[] | ((prev: ChatSession[]) => ChatSession[]),
    activeId?: string
  ) => {
    setSessions(prev => {
      const updated = typeof updater === 'function' ? (updater as (p: ChatSession[]) => ChatSession[])(prev) : updater;
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
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
    saveSessions(prev => [s, ...prev.filter(x => x.pinned), ...prev.filter(x => !x.pinned)], s.id);
    setSidebarOpen(false);
  };

  const handleToggleMode = (m: 'general' | 'trading') => {
    saveSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, mode: m } : s));
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
    saveSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
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
        else saveSessions(updated, currentSessionId === id ? updated[0].id : (currentSessionId || undefined));
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

  const handleToggleVoiceRecord = async () => {
    if (isRecordingAudio) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecordingAudio(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(',')[1];
          setAttachment({ uri: reader.result as string, base64: b64, name: 'Rekaman Suara', type: 'audio' });
        };
        reader.readAsDataURL(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      alert('Akses mikrofon ditolak atau tidak tersedia.');
    }
  };

  const handleToggleTts = async (id: string, text: string) => {
    if (speakingId === id) {
      const el = document.getElementById(`audio-${id}`) as HTMLAudioElement;
      if (el) { el.pause(); el.currentTime = 0; }
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    
    // Check if audio element already exists
    let el = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (el) {
      el.play();
      return;
    }

    try {
      const key = getOpenRouterKeys()[0];
      const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: TTS_MODEL, input: text, voice: 'alloy' })
      });
      if (!res.ok) throw new Error('TTS Gagal');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      el = new Audio(url);
      el.id = `audio-${id}`;
      el.onended = () => setSpeakingId(null);
      el.onerror = () => setSpeakingId(null);
      document.body.appendChild(el);
      el.play();
    } catch (err) {
      alert('Gagal mensintesis suara OpenRouter.');
      setSpeakingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let type: MediaType = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    if (file.type.startsWith('audio/')) type = 'audio';

    const reader = new FileReader();
    reader.onload = () => { 
      const b64 = (reader.result as string).split(',')[1]; 
      setAttachment({ uri: reader.result as string, base64: b64, name: file.name, type }); 
    };
    reader.readAsDataURL(file);
  };

  // Quick reply handler
  const handleQuickReply = (text: string) => { setInput(text); };

  // ── API Call ──
  const callOpenRouter = async (history: UiMessage[], promptText: string, cMode: 'general' | 'trading', attach?: MediaAttachment) => {
    let content: any = promptText;
    
    // Check if this is an image generation request
    if (promptText.startsWith('/imagine ')) {
      return callOpenRouterImageGen(promptText.slice(9).trim());
    }

    if (attach?.base64) { 
      let mediaTypePrefix = '';
      if (attach.type === 'video') mediaTypePrefix = 'data:video/mp4;base64,';
      else if (attach.type === 'audio') mediaTypePrefix = 'data:audio/mp3;base64,';
      else mediaTypePrefix = 'data:image/jpeg;base64,';
      
      content = [
        { type: 'text', text: promptText.trim() || 'Analisis media ini.' }, 
        { type: 'image_url', image_url: { url: `${mediaTypePrefix}${attach.base64}` } }
      ]; 
    }
    
    const clean = history.filter(m => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    const msgs = [{ role: 'system', content: cMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT }, ...clean, { role: 'user', content }];
    let lastErr: any = null;
    
    for (const key of getOpenRouterKeys()) {
      try {
        const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 60000); // 60s for video
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: ctrl.signal, headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'NOVA Web' }, body: JSON.stringify({ model: selectedModel, temperature: cMode === 'trading' ? 0.15 : 0.4, max_tokens: 2500, messages: msgs }) });
        clearTimeout(timer);
        if (!res.ok) { 
          if (res.status === 401 || res.status === 402) lastErr = new Error(`HTTP ${res.status}: API Key tidak valid atau kuota habis.`);
          else lastErr = new Error(`HTTP ${res.status}`); 
          continue; 
        }
        const data = await res.json();
        if (data.error) { lastErr = new Error(data.error?.message || 'Provider error'); break; }
        const reply = data.choices?.[0]?.message?.content;
        if (reply) return { content: reply, model: data.model || selectedModel };
        else { lastErr = new Error('Respon kosong'); break; }
      } catch (e: any) { lastErr = e; }
    }
    throw lastErr || new Error('Gagal menghubungi OpenRouter.');
  };

  const callOpenRouterImageGen = async (prompt: string) => {
    const key = getOpenRouterKeys()[0];
    // We use standard OpenAI API structure for Images via OpenRouter
    const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: IMAGE_MODEL, response_format: 'url' })
    });
    if (!res.ok) throw new Error('Image generation gagal. Pastikan model tersedia.');
    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) throw new Error('URL Gambar kosong dari API.');
    return { content: `![Generated Image](${url})`, model: IMAGE_MODEL };
  };

  const callOpenRouterSpeechGen = async (prompt: string, model: string) => {
    const key = getOpenRouterKeys()[0];
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: prompt, model, voice: 'alloy' })
    });
    
    if (!res.ok) throw new Error('Speech generation request gagal.');
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
       const data = await res.json();
       const url = data.url || data.data?.url || data.data?.[0]?.url;
       if (url) return { content: `<audio controls src="${url}"></audio>`, model };
       throw new Error('Gagal mem-parsing URL audio.');
    } else {
       const blob = await res.blob();
       const url = URL.createObjectURL(blob);
       return { content: `<audio controls src="${url}"></audio>`, model };
    }
  };

  const callOpenRouterVideoGen = async (prompt: string, model: string) => {
    const key = getOpenRouterKeys()[0];
    const startRes = await fetch('https://openrouter.ai/api/v1/videos', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model })
    });
    
    if (!startRes.ok) throw new Error('Gagal memulai render video. Pastikan model mendukung video.');
    const startData = await startRes.json();
    const jobId = startData.id || startData.data?.id;
    if (!jobId) throw new Error('Gagal mendapatkan Job ID Video.');

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const pollRes = await fetch(`https://openrouter.ai/api/v1/videos/generation?id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      
      const status = pollData.status || pollData.data?.status;
      const url = pollData.url || pollData.data?.url || pollData.data?.video_url;
      
      if (status === 'completed' || status === 'succeeded' || url) {
        if (!url) throw new Error('Video selesai tapi URL kosong.');
        return { content: `![Generated Video](${url})`, model };
      }
      if (status === 'failed' || status === 'error') {
        throw new Error('Render video gagal di server.');
      }
    }
    throw new Error('Timeout: Render video memakan waktu lebih dari 5 menit.');
  };

  // ── Auto Analysis ──
  const triggerAutoAnalysis = async (symbol: string) => {
    setBusy(true);
    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: `Analisis Otomatis ${symbol} (Top-Down MTF H4 → M15 → M5)`, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    // FIX: previously this also called handleToggleMode('trading') right
    // before this save, which raced against it (both computed from the same
    // stale `sessions` snapshot and could clobber each other). Setting
    // mode: 'trading' directly here removes the race and the redundant save.
    saveSessions(sessions.map(s => s.id === currentSessionId ? { ...s, title: `Analisa ${symbol}`, mode: 'trading', messages: curMsgs } : s));
    try {
      const d = await fetchLiveMarketData(symbol);
      if (!d) throw new Error('Gagal tarik data live.');
      const prompt = `[DATA LIVE BINANCE]: ${d.symbol} $${d.price} (${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%) | H4: ${d.h4.trend} | M15 RSI: ${d.m15.rsi} Vol: ${d.m15.volRatio}x | M5: ${d.m5.candle} RSI: ${d.m5.rsi}${d.btcWeather ? ` | BTC: $${d.btcWeather.price.toFixed(0)} (${d.btcWeather.status})` : ''}\n\nLakukan analisis trading Neurobro: Bias H4, Setup M15, Entry M5, R:R >= 1:2, Batas Batal.`;
      const result = await callOpenRouter(curMsgs, prompt, 'trading');
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      // FIX: functional update — append to whatever the session's messages
      // are *now*, not the `curMsgs` snapshot taken before the network call.
      saveSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, eMsg] } : s));
    } finally { setBusy(false); }
  };

  // ── Send Message ──
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    if (busy) return;
    
    // Auto Analysis Check
    const analysisMatch = chatMode === 'trading' && !attachment
      ? trimmed.toUpperCase().match(/^(?:ANALISA|ANALISIS|CEK)?\s*(BTC|ETH|SOL|BNB|XAU|EUR)(USDT)?\s*$/)
      : null;
    if (analysisMatch) {
      const sym = analysisMatch[1] === 'EUR' ? 'EURUSDT' : `${analysisMatch[1]}USDT`;
      setInput('');
      await triggerAutoAnalysis(sym);
      return;
    }

    // Smart Intent Detection for Image Generation
    const imageIntentMatch = trimmed.match(/^(?:buatkan|buat|bikin|generate|tolong buatkan)\s+(?:gambar|image|foto|lukisan|ilustrasi)\s+(.+)/i);
    const isVideo = trimmed.startsWith('/video ');
    let finalModel = selectedModel;
    let isImageIntent = trimmed.startsWith('/imagine ');
    let userContent = trimmed;

    if (imageIntentMatch && !isImageIntent) {
      isImageIntent = true;
      userContent = imageIntentMatch[1].trim(); // Extract the actual prompt
      // Auto-switch to default image model if current is not image
      const curr = availableModels.find(m => m.id === selectedModel);
      if (!curr?.outputModalities.includes('image')) {
        finalModel = IMAGE_MODEL;
      }
    } else if (isImageIntent) {
      userContent = trimmed.slice(9).trim();
      const curr = availableModels.find(m => m.id === selectedModel);
      if (!curr?.outputModalities.includes('image')) {
        finalModel = IMAGE_MODEL;
      }
    } else if (isVideo) {
      userContent = trimmed.slice(7).trim();
    }

    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: userContent, attachment: attachment || undefined, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    const targetSessionId = activeSession ? activeSession.id : `session_${Date.now()}`;
    const newTitle = activeSession?.title === 'Percakapan Baru' || !activeSession ? userContent.slice(0, 36) + (userContent.length > 36 ? '…' : '') : activeSession?.title || 'Obrolan';

    saveSessions(
      sessions.length === 0 ? [{ id: targetSessionId, title: newTitle, createdAt: Date.now(), updatedAt: Date.now(), mode: chatMode, messages: curMsgs, pinned: false }]
        : sessions.map(s => s.id === targetSessionId ? { ...s, messages: curMsgs, title: newTitle } : s),
      targetSessionId
    );
    setCurrentSessionId(targetSessionId);
    setInput(''); setAttachment(null);
    const textarea = document.querySelector('.chat-input-area textarea') as HTMLTextAreaElement;
    if (textarea) textarea.style.height = 'auto';
    setBusy(true);

    // Fake loading message for Heavy generation
    const currentModelObj = availableModels.find(m => m.id === finalModel);
    const isVideoModel = currentModelObj?.outputModalities.includes('video') || isVideo;
    const isImageModel = (currentModelObj?.outputModalities.includes('image') && !currentModelObj.outputModalities.includes('text')) || isImageIntent;
    const isAudioModel = currentModelObj?.outputModalities.includes('audio');

    if (isVideoModel) {
      const waitMsg: UiMessage = { id: `wait_${Date.now()}`, role: 'assistant', content: '🎬 *Sedang merender video (Mohon tunggu, ini dapat memakan waktu beberapa menit)...*', modelUsed: finalModel, timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, waitMsg] } : s));
    } else if (isImageModel) {
      const waitMsg: UiMessage = { id: `wait_${Date.now()}`, role: 'assistant', content: '🎨 *Sedang menggambar...*', modelUsed: finalModel, timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, waitMsg] } : s));
    } else if (isAudioModel) {
      const waitMsg: UiMessage = { id: `wait_${Date.now()}`, role: 'assistant', content: '🎙️ *Sedang mensintesis suara...*', modelUsed: selectedModel, timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, waitMsg] } : s));
    }

    try {
      let result;
      if (isVideoModel) {
        result = await callOpenRouterVideoGen(userContent, finalModel);
      } else if (isImageModel) {
        result = await callOpenRouterImageGen(userContent);
      } else if (isAudioModel) {
        result = await callOpenRouterSpeechGen(userContent, finalModel);
      } else {
        // Text model
        result = await callOpenRouter(curMsgs, userContent, chatMode);
      }
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: isVideoModel || isImageModel || isAudioModel ? [...s.messages.filter(m => !m.id.startsWith('wait_')), aMsg] : [...s.messages, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Maaf, terjadi kesalahan: ${err?.message || 'Gagal terhubung ke AI.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: isVideoModel || isImageModel || isAudioModel ? [...s.messages.filter(m => !m.id.startsWith('wait_')), eMsg] : [...s.messages, eMsg] } : s));
    } finally {
      setBusy(false);
    }
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
        {/* Brand Row */}
        <div className="sidebar-brand-row" onClick={() => { if (isMobile) setSidebarOpen(!sidebarOpen); else setSidebarMini(!sidebarMini); }} style={{ cursor: 'pointer' }} title={sidebarMini ? 'Buka Sidebar' : 'Tutup Sidebar'}>
          <div className="brand-logo-group">
            <div className="brand-emblem">
              <span className="emblem-logo">{Icons.nova}</span>
              <span className="emblem-hover-icon">{Icons.panel}</span>
            </div>
            <div className="sidebar-logo-text">
              <div className="brand-text">NOVA AI</div>
              <div className="brand-subtitle">Trading & Intelligence</div>
            </div>
          </div>
          <span className="brand-version">PRO</span>
          <button className="sidebar-close-btn" onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}>{Icons.x}</button>
        </div>

        {/* Mini Icons */}
        <div className="sidebar-mini-icons">
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
          <div className="main-header-left" style={{ flex: 1 }}>
            {isMobile && (
              <button className="header-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '6px 8px' }}>{Icons.nova}</button>
            )}
            <div className="header-mode-badge">
              <div className="status-dot" />
              {chatMode === 'trading' ? 'NOVA Neurobro' : 'NOVA AI'}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <button 
              style={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--hairline)', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all var(--transition-fast)' }}
              onClick={(e) => { e.stopPropagation(); setIsModelDropdownOpen(!isModelDropdownOpen); }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--hairline-strong)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--hairline)'}
            >
              {Icons.cpu}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                {availableModels.find(m => m.id === selectedModel)?.name || selectedModel.split('/').pop() || 'Loading Models...'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isModelDropdownOpen && (
              <div className="model-dropdown-menu" style={{ position: 'absolute', top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: '16px', maxHeight: '500px', width: '340px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
                <div className="model-dropdown-header" style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', position: 'sticky', top: 0, background: 'transparent', zIndex: 10, backdropFilter: 'blur(24px)' }}>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Omnimodal Models</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsSortDropdownOpen(!isSortDropdownOpen); }}
                        style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {modelSort === 'popular' && 'Most Popular'}
                        {modelSort === 'newest' && 'Newest'}
                        {modelSort === 'oldest' && 'Oldest'}
                        {modelSort === 'weekly' && 'Top Weekly'}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isSortDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.6 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>

                      {isSortDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-obsidian)', border: '1px solid var(--hairline-strong)', borderRadius: '8px', padding: '4px', zIndex: 110, width: '160px', boxShadow: 'var(--shadow-lg)' }}>
                          {[
                            { id: 'popular', label: 'Most Popular' },
                            { id: 'newest', label: 'Newest' },
                            { id: 'oldest', label: 'Oldest' },
                            { id: 'weekly', label: 'Top Weekly' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={(e) => { e.stopPropagation(); setModelSort(opt.id as any); setIsSortDropdownOpen(false); }}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '13px', background: modelSort === opt.id ? 'var(--accent-dim)' : 'transparent', color: modelSort === opt.id ? 'var(--accent-primary)' : 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              {modelSort === opt.id ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              ) : <span style={{width: 14}} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <span style={{color: 'var(--text-muted)', fontWeight: 500, fontSize: '12px'}}>{availableModels.length}</span>
                    </div>
                  </div>
                  
                  {/* Modality Tabs */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                    {['all', 'text', 'image', 'video', 'audio'].map(tab => {
                      let count = availableModels.length;
                      let filteredModels = availableModels;
                      
                      if (tab !== 'all') {
                        filteredModels = availableModels.filter(m => {
                          if (tab === 'audio') return m.outputModalities.includes('audio') || m.outputModalities.includes('speech');
                          return m.outputModalities.includes(tab);
                        });
                        count = filteredModels.length;
                      }
                      
                      return (
                        <button 
                          key={tab} 
                          className={`model-tab-btn ${modelTab === tab ? 'active' : ''}`} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setModelTab(tab as any);
                            // Auto switch model when tab changes
                            if (filteredModels.length > 0) {
                              const newTopModel = filteredModels.sort((a, b) => {
                                if (modelSort === 'newest') return b.created - a.created;
                                if (modelSort === 'oldest') return a.created - b.created;
                                if (modelSort === 'weekly') {
                                   const scoreA = (a.contextLength || 1) / (parseFloat(a.pricing.prompt) || 0.1);
                                   const scoreB = (b.contextLength || 1) / (parseFloat(b.pricing.prompt) || 0.1);
                                   return scoreB - scoreA;
                                }
                                return 0;
                              })[0];
                              setSelectedModel(newTopModel.id);
                            }
                          }}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)} {count > 0 && <span className="tab-count">{count}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {availableModels.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>Mencari model...</div>
                ) : (
                  availableModels.filter(m => {
                    if (modelTab === 'all') return true;
                    if (modelTab === 'audio') return m.outputModalities.includes('audio') || m.outputModalities.includes('speech');
                    return m.outputModalities.includes(modelTab);
                  }).sort((a, b) => {
                    if (modelSort === 'newest') return b.created - a.created;
                    if (modelSort === 'oldest') return a.created - b.created;
                    if (modelSort === 'weekly') {
                       // OpenRouter doesn't expose Top Weekly natively in API, simulating with price/context combo for now to match UI layout
                       const scoreA = (a.contextLength || 1) / (parseFloat(a.pricing.prompt) || 0.1);
                       const scoreB = (b.contextLength || 1) / (parseFloat(b.pricing.prompt) || 0.1);
                       return scoreB - scoreA;
                    }
                    return 0; // Default (Popular) is already sorted by OpenRouter
                  }).map(m => {
                    const isFree = m.pricing.prompt === '0' || m.pricing.prompt === '0.0';
                    
                    const formatPrice = (p: string) => {
                      const num = parseFloat(p);
                      if (isNaN(num) || num === 0) return 'FREE';
                      return '$' + (num * 1000000).toLocaleString(undefined, { maximumFractionDigits: 3 });
                    };
                    
                    const pInput = formatPrice(m.pricing.prompt);
                    const pOutput = formatPrice(m.pricing.completion);
                    
                    const formatCtx = (ctx: number) => {
                      if (!ctx) return '?';
                      if (ctx >= 1000000) return (ctx / 1000000).toFixed(1).replace('.0', '') + 'M';
                      if (ctx >= 1000) return (ctx / 1000).toFixed(0) + 'K';
                      return ctx.toString();
                    };

                    return (
                      <button
                        key={m.id}
                        className={`model-card-item ${selectedModel === m.id ? 'active' : ''}`}
                        onClick={() => { setSelectedModel(m.id); setIsModelDropdownOpen(false); }}
                      >
                        <div className="model-card-title-row">
                          <span className="model-card-title">{m.name}</span>
                          {isFree && <span className="model-free-badge">🎁 FREE</span>}
                        </div>
                        <div className="model-card-id">{m.id}</div>
                        
                        <div className="model-card-badges">
                          {m.outputModalities.map((mod, i) => (
                            <span key={i} className={`modality-badge mod-${mod}`}>{mod.toUpperCase()}</span>
                          ))}
                          {m.contextLength > 0 && (
                            <span className="context-badge">{Icons.panel} {formatCtx(m.contextLength)} context</span>
                          )}
                        </div>

                        <div className="model-card-pricing">
                          <div><span style={{color: 'var(--text-muted)'}}>In:</span> {pInput} {pInput !== 'FREE' && '/ 1M'}</div>
                          <div><span style={{color: 'var(--text-muted)'}}>Out:</span> {pOutput} {pOutput !== 'FREE' && '/ 1M'}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="main-header-right" style={{ flex: 1, justifyContent: 'flex-end' }}>
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
                {m.attachment && (
                  <div className="attached-media-container">
                    {m.attachment.type === 'image' && <img src={m.attachment.uri} alt="Attached" style={{ maxWidth: '340px', borderRadius: '8px' }} />}
                    {m.attachment.type === 'video' && <video src={m.attachment.uri} controls style={{ maxWidth: '340px', borderRadius: '8px', background: '#000' }} />}
                    {m.attachment.type === 'audio' && <audio src={m.attachment.uri} controls style={{ width: '100%', maxWidth: '340px' }} />}
                  </div>
                )}
                {m.role === 'assistant' ? <MarkdownContent content={m.content} /> : <div className="message-body user-body">{m.content}</div>}
                {m.role === 'assistant' && (
                  <div className="message-actions-row">
                    <button className={`message-action-pill ${speakingId === m.id ? 'active' : ''}`} onClick={() => handleToggleTts(m.id, m.content)}>
                      {speakingId === m.id ? Icons.square : Icons.volume} {speakingId === m.id ? 'Stop' : 'Suara'}
                    </button>
                    <button className="message-action-pill" onClick={() => handleCopy(m.id, m.content)}>
                      {copiedId === m.id ? Icons.check : Icons.copy} {copiedId === m.id ? 'Tersalin' : 'Salin'}
                    </button>
                    {m.modelUsed && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>via {m.modelUsed}</span>}
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
              {attachment.type === 'image' && <img src={attachment.uri} alt="Thumb" className="attachment-thumb" />}
              {attachment.type === 'video' && <div className="attachment-thumb" style={{ background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icons.film}</div>}
              {attachment.type === 'audio' && <div className="attachment-thumb" style={{ background: 'var(--surface-3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icons.mic}</div>}
              <div className="attachment-info">
                <div className="attachment-name">{attachment.name}</div>
                <div className="attachment-hint">{Icons.check} {attachment.type.toUpperCase()} siap dianalisis</div>
              </div>
              <button className="attachment-close-btn" onClick={() => setAttachment(null)}>{Icons.x}</button>
            </div>
          )}
          <div className="composer-box">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,audio/*" onChange={handleFileChange} />
            <button className="composer-icon-btn" onClick={() => fileInputRef.current?.click()} title="Unggah Media">{Icons.paperclip}</button>
            <button className={`composer-icon-btn ${isRecordingAudio ? 'active-mic' : ''}`} onClick={handleToggleVoiceRecord} title="Rekam Audio">{Icons.mic}</button>
            <textarea className="composer-textarea" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={chatMode === 'trading' ? 'Ketik "Analisa BTC" atau tanyakan setup…' : 'Ketik pesan atau /imagine untuk generate gambar…'} rows={1} />
            <button className="composer-send-btn" onClick={handleSend} disabled={busy || (!input.trim() && !attachment)}>
              {Icons.send} Kirim
            </button>
          </div>
          <div className="composer-hint">Tekan Enter untuk mengirim · Awali prompt dengan /imagine untuk buat gambar</div>
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
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XAUUSDT'].map(sym => (
              <button key={sym} className={`symbol-tab ${selectedSymbol === sym ? 'active' : ''}`} onClick={() => setSelectedSymbol(sym)}>{sym.replace('USDT', '/USDT')}</button>
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
              <div className="sop-card-item"><div className="sop-card-title">{Icons.brain} Filosofi AI</div><div className="sop-card-content">• <strong>No Hallucination:</strong> Wajib konfirmasi data chart live.<br />• <strong>Pisahkan Kalkulasi:</strong> Fokus aksi harga faktual.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.zap} Eksekusi</div><div className="sop-card-content">• <strong>Hirarki:</strong> Struktur {'>'} Volume {'>'} Momentum.<br />• <strong>Breakout vs Fakeout:</strong> Tunggu candle close + retest volume.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.settings} Indikator</div><div className="sop-card-content">• <strong>MACD:</strong> 12/26/9.<br />• <strong>RSI:</strong> 14. Dilarang short hanya karena RSI {'>'} 70.<br />• <strong>Volume:</strong> MA 20.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.clock} MTF Top-Down</div><div className="sop-card-content">• <strong>H4:</strong> Bias Utama.<br />• <strong>M15:</strong> Area Setup.<br />• <strong>M5:</strong> Konfirmasi Entry.<br />• <strong>M1:</strong> Diabaikan.</div></div>
              <div className="sop-card-item"><div className="sop-card-title">{Icons.shield} Validasi</div><div className="sop-card-content">• <strong>R:R:</strong> Minimal 1:2.<br />• <strong>Fakta vs Narasi:</strong> Dilarang spekulasi.<br />• <strong>Batas Batal:</strong> Wajib ada harga invalidasi.</div></div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 13 }}>KUNCI #{i + 1}</span><span style={{ color: q.status === '200 OK' ? 'var(--bull)' : 'var(--bear)', fontWeight: 700, fontSize: 12 }}>{q.status}</span></div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{q.masked}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tier: <strong>{q.free ? 'Free' : 'Standar'}</strong> · ${q.usage.toFixed(4)}</div>
                </div>
              ))}
              <button className="btn-new-chat-full" onClick={loadQuotas} style={{ margin: '8px 0 0' }}>{Icons.refresh} Segarkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}