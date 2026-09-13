import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './App.css';

// ============================================================================
// SVG ICON SYSTEM
// ============================================================================
const Icons = {
  sonex: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
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

export function getGeminiKeys(): string[] {
  let envKeys: string[] = [];
  try {
    const rawEnv = ((import.meta as any).env?.VITE_GEMINI_KEYS || '');
    if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  let customKeys: string[] = [];
  try {
    const saved = localStorage.getItem('@sonex_gemini_api_keys');
    if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  const defaults = [
    'QVEuQWI4Uk42SWR5MTVzck5vZWV4YTMzUWpWN25kRFNZVnlrU3M1eUwtT2ZOMllpcFZhU0E=',
    'QVEuQWI4Uk42SUxrTl96eVdOTlYtWkFsZ1lLRUFlX2N3SER3NnFUVFVlZ3Z2QnVjZFhFMXc=',
    'QVEuQWI4Uk42S1BmZ1hVUFFCOGhrOFh1UElabkR2cVMxT1p5dEFoUTFJQ2h1UDZmWFdlMHc=',
    'QVEuQWI4Uk42SmtOMUtLampYVWVYdVRmNUI1WXB3TlR2N2Q5M1RQblRnV1BKVTc0b1M5Vmc=',
    'QVEuQWI4Uk42TE9ZNnYxR1BNNmZweGl2bnY5am1OdUh2R3pyUWJ5d2t0dG52WUNQNEVJbkE=',
    'QVEuQWI4Uk42STlDMW1JWXNoTXFjeGYtdHJUaENvLURNNGRlSU9CT3FIaWVQSWxaY1dsUHc=',
    'QVEuQWI4Uk42SXVvNnFtR3BScTcyVkVVdDQyck51UTYwb0hfaFViQkd1TW5rNWFOdXlQSHc='
  ].map(b => {
    try { return atob(b); } catch { return ''; }
  }).filter(Boolean);
  return Array.from(new Set([...customKeys, ...envKeys, ...defaults])).filter(k => k.length >= 20);
}

export function getSambaNovaKeys(): string[] {
  let envKeys: string[] = [];
  try {
    const rawEnv = ((import.meta as any).env?.VITE_SAMBANOVA_KEYS || '');
    if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  let customKeys: string[] = [];
  try {
    const saved = localStorage.getItem('@sonex_sambanova_api_keys');
    if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  const defaults = [
    'YjlkZjAzODctNjMxNS00ZjIxLTk2OWItNTdhNzEzNWRlNDBl',
    'NjNkZDBiMTgtZWQ3MC00OTVmLTlmZWEtOWM1YmM3MzU5NTZh'
  ].map(b => {
    try { return atob(b); } catch { return ''; }
  }).filter(Boolean);
  return Array.from(new Set([...customKeys, ...envKeys, ...defaults])).filter(k => k.length >= 10);
}

export function getTokenHarborKeys(): string[] {
  let envKeys: string[] = [];
  try {
    const rawEnv = ((import.meta as any).env?.VITE_TOKENHARBOR_KEYS || '');
    if (rawEnv) envKeys = rawEnv.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  let customKeys: string[] = [];
  try {
    const saved = localStorage.getItem('@sonex_tokenharbor_api_keys');
    if (saved) customKeys = saved.split(',').map((k: string) => k.trim()).filter(Boolean);
  } catch { }
  const defaults = [
    'dGhrX2xpdmVfZ2hKRjlWbVAwV0hiRnc1QmpEOVJ6Uk1Tc1NuakVyRnBxaUVtbDJDQ2FleWJlMlFZTW1fU3JqblA1UmNaVzNVRA==',
    'dGhrX2xpdmVfRUdaRTVsOE5SSU1LQVdFX1JaQS1BWjUwZy1YcmN3UGRvRUtieXFJWWdyZXVxUXNUSWRnZmZoVWNBc0d2VTBObg==',
    'dGhrX2xpdmVfem1VVmRUb3NtLTNVUHNFc1MtdUZraVdTdWFPeHNMVmtQQmdYUGx4ckpLLXpWS1JxV29YV3RNVm0yTzlpUGR5eQ=='
  ].map(b => {
    try { return atob(b); } catch { return ''; }
  }).filter(Boolean);
  return Array.from(new Set([...customKeys, ...envKeys, ...defaults])).filter(k => k.length >= 15);
}

export interface CoreModelInfo {
  id: string;
  provider: 'gemini' | 'tokenharbor' | 'sambanova';
  name: string;
  modelTag: string;
  badge: string;
  desc: string;
  icon: string;
  color: string;
}

export const CORE_MODELS: CoreModelInfo[] = [
  {
    id: 'gemini-3.6-flash',
    provider: 'gemini',
    name: 'Google Gemini',
    modelTag: 'Gemini 3.6 Flash',
    badge: '🎁 10.5K Free/Day',
    desc: 'Model resmi Google terbaru, super cepat, penalaran tajam, & 100% gratis.',
    icon: '💎',
    color: '#06B6D4'
  },
  {
    id: 'deepseek-v4.1-flash:free',
    provider: 'tokenharbor',
    name: 'DeepSeek V4.1 Flash',
    modelTag: 'V4.1 Flash Free',
    badge: '🐋 Token Harbor Free',
    desc: 'DeepSeek V4.1 mutakhir dengan multimodal visual & penalaran komprehensif.',
    icon: '🐋',
    color: '#3B82F6'
  },
  {
    id: 'DeepSeek-V3.2',
    provider: 'sambanova',
    name: 'DeepSeek V3.2',
    modelTag: 'V3.2 MoE Cloud',
    badge: '⚡ SambaNova AI',
    desc: 'Arsitektur MoE generasi terbaru berkecepatan tinggi via SambaNova AI Cloud.',
    icon: '⚡',
    color: '#8B5CF6'
  }
];

async function callTokenHarborApi(
  history: UiMessage[],
  promptText: string,
  systemPrompt: string,
  modelName: string = 'deepseek-v4.1-flash:free'
): Promise<{ content: string; model: string }> {
  const keys = getTokenHarborKeys();
  let lastErr: any = null;

  const messages: any[] = [{ role: 'system', content: systemPrompt }];
  const cleanHistory = history.filter(m => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome' && !m.id.startsWith('wait_')).slice(-10);
  for (const m of cleanHistory) {
    if (m.content) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: 'user', content: promptText });

  for (const key of keys) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 35000);
      const res = await fetch('https://tokenharbor.ai/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages
        })
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return { content: text, model: 'DeepSeek V4.1 Flash (Token Harbor)' };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        lastErr = new Error(errMsg);
      }
    } catch (e: any) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Gagal menghubungi Token Harbor.');
}

async function callSambaNovaApi(
  history: UiMessage[],
  promptText: string,
  systemPrompt: string,
  modelName: string = 'DeepSeek-V3.2'
): Promise<{ content: string; model: string }> {
  const keys = getSambaNovaKeys();
  let lastErr: any = null;

  const messages: any[] = [{ role: 'system', content: systemPrompt }];
  const cleanHistory = history.filter(m => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome' && !m.id.startsWith('wait_')).slice(-10);
  for (const m of cleanHistory) {
    if (m.content) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: 'user', content: promptText });

  for (const key of keys) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 35000);
      const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages
        })
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          return { content: text, model: 'DeepSeek V3.2 (SambaNova)' };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${res.status}`;
        lastErr = new Error(errMsg);
      }
    } catch (e: any) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Gagal menghubungi SambaNova.');
}

async function callGeminiApi(
  history: UiMessage[],
  promptText: string,
  systemPrompt: string,
  attach?: MediaAttachment
): Promise<{ content: string; model: string }> {
  const keys = getGeminiKeys();
  let lastErr: any = null;

  const contents: any[] = [];
  const cleanHistory = history.filter(m => !m.content.startsWith('Kendala:') && m.id !== 'init_welcome' && !m.id.startsWith('wait_')).slice(-12);

  for (const m of cleanHistory) {
    if (m.content) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }
  }

  const currentParts: any[] = [{ text: promptText || 'Analisis media ini.' }];
  if (attach?.base64) {
    let mimeType = 'image/jpeg';
    if (attach.type === 'image') {
      if (attach.uri.startsWith('data:image/png')) mimeType = 'image/png';
      else if (attach.uri.startsWith('data:image/webp')) mimeType = 'image/webp';
    }
    currentParts.push({
      inlineData: {
        mimeType,
        data: attach.base64
      }
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 8192
    }
  };

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { content: text, model: 'Gemini 3.6 Flash' };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastErr = new Error(errData?.error?.message || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Koneksi ke Google Gemini terputus. Silakan coba lagi sebentar lagi.');
}

const SESSIONS_KEY = '@nova_web_sessions_v2';
const ACTIVE_SESSION_KEY = '@nova_web_active_id_v2';

const GENERAL_SYSTEM_PROMPT = `# Identitas & Kapabilitas SONEX AI (General Intelligence)
Kamu adalah SONEX, asisten AI otonom mutakhir yang dilengkapi dengan kemampuan multimodal lengkap.

## Kapabilitas Utama:
1. **Pembuatan Gambar AI Langsung (Image Generation)**:
   - SONEX terintegrasi dengan generator gambar AI mutakhir (Google Gemini 3.1 Flash Image & Studio Realism).
   - Kamu BISA dan MAMPU menghasilkan gambar visual langsung di dalam obrolan!
   - Jika pengguna bertanya apakah kamu bisa membuat gambar atau gambar apa saja yang bisa kamu buat: Jelaskan dengan antusias bahwa kamu BISA membuat gambar (seperti potret fotorealistis, anime, ilustrasi 3D, pemandangan, logo, seni cyberpunk, dll.) dan ajak pengguna untuk mencobanya dengan mengetik perintah "buat gambar [deskripsi]" atau "/imagine [deskripsi]".
   - JANGAN PERNAH mengatakan bahwa kamu adalah "asisten berbasis teks yang tidak bisa membuat gambar".
2. **Penalaran Logis & Rekayasa Kode**: Pemrograman, analisis teknis, penulisan mendalam.
3. **Analisis Pasar & Trading (Neurobro)**: Top-down MTF, aksi harga faktual.

## Prinsip Operasional:
1. Alami, Cerdas, dan Ramah
2. Informatif, Lugas, dan Solutif`;

const NEUROBRO_TRADING_PROMPT = `# SONEX Trading Agent — Pedoman & Aturan Baku Neurobro\n\n## Filosofi AI\n1. NO HALLUCINATION: Selalu konfirmasi data chart live.\n2. Pisahkan Kalkulasi dari Interpretasi.\n\n## Hirarki: Struktur > Volume > Momentum\n## MTF Top-Down: H4 (Bias) → M15 (Setup) → M5 (Eksekusi)\n## R:R Minimal 1:2\n## Setiap setup wajib punya BUY/SELL/HOLD + Batas Batal\n## DILARANG Long altcoin jika BTC breakdown`;

const IMAGE_MODEL = 'google/gemini-3.1-flash-image';

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
      return DOMPurify.sanitize(raw, {
        ADD_ATTR: ['target', 'src', 'alt', 'class', 'loading'],
        ADD_TAGS: ['img', 'audio', 'video'],
        ALLOW_DATA_ATTR: true
      });
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
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('sonex_theme');
      if (saved) return saved === 'dark';
      return !window.matchMedia?.('(prefers-color-scheme: light)').matches;
    } catch {
      return true;
    }
  });

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sonex_selected_model');
      if (saved && (saved === 'gemini-3.6-flash' || saved === 'deepseek-v4.1-flash:free' || saved === 'DeepSeek-V3.2')) return saved;
    } catch {}
    return 'gemini-3.6-flash';
  });
  const [availableModels, setAvailableModels] = useState<ORModel[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<MediaAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [showChartPanel, setShowChartPanel] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketStats, setMarketStats] = useState<any>(null);

  const [showSopModal, setShowSopModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(() => {
    try {
      return localStorage.getItem('@nova_custom_api_keys') || '';
    } catch {
      return '';
    }
  });
  const [customGeminiInput, setCustomGeminiInput] = useState(() => {
    try {
      return localStorage.getItem('@sonex_gemini_api_keys') || '';
    } catch {
      return '';
    }
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Fetch available models from OpenRouter
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/models?output_modalities=image,audio,speech,text');
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

  const [draftMode, setDraftMode] = useState<'general' | 'trading'>('general');
  const activeSession = currentSessionId ? (sessions.find((s) => s.id === currentSessionId) || null) : null;
  const messages = activeSession?.messages || [];
  const chatMode = activeSession?.mode || draftMode;

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
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light', !isDark);
    try {
      localStorage.setItem('sonex_theme', theme);
    } catch {}
  }, [isDark]);

  // Load Sessions
  useEffect(() => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    const savedId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only sessions that have at least 1 message
          const valid = parsed
            .filter((s: any) => s.messages && s.messages.length > 0)
            .map((s: any) => ({ ...s, pinned: s.pinned || false }));
          if (valid.length > 0) {
            setSessions(valid);
            const activeIdToUse = savedId && valid.some((s: any) => s.id === savedId) ? savedId : valid[0].id;
            setCurrentSessionId(activeIdToUse);
            return;
          }
        }
      } catch { }
    }
    createInitialSession();
  }, []);

  const createInitialSession = () => {
    setSessions([]);
    setCurrentSessionId(null);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify([]));
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}
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
    activeId?: string | null
  ) => {
    setSessions(prev => {
      const updated = typeof updater === 'function' ? (updater as (p: ChatSession[]) => ChatSession[])(prev) : updater;
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage quota warning', e);
      }
      return updated;
    });
    if (activeId !== undefined) {
      setCurrentSessionId(activeId);
      try {
        if (activeId) {
          localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
        } else {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
        }
      } catch {}
    }
  };

  // Sorted sessions: pinned first, filtering out sessions without messages
  const sortedSessions = useMemo(() => {
    const withMessages = sessions.filter(s => s.messages && s.messages.length > 0);
    const pinned = withMessages.filter(s => s.pinned);
    const unpinned = withMessages.filter(s => !s.pinned);
    return [...pinned, ...unpinned];
  }, [sessions]);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
    try {
      localStorage.setItem('sonex_selected_model', modelId);
    } catch {}
  };

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
    setCurrentSessionId(null);
    setInput('');
    setAttachment(null);
    setSidebarOpen(false);
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {}
  };

  const handleToggleMode = (m: 'general' | 'trading') => {
    setDraftMode(m);
    if (currentSessionId) {
      saveSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, mode: m } : s));
    }
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
        if (updated.length === 0) {
          createInitialSession();
        } else {
          const nextActiveId = currentSessionId === id ? updated[0].id : currentSessionId;
          saveSessions(updated, nextActiveId);
        }
        setConfirmState(p => ({ ...p, open: false }));
      }
    });
  };

  const handleClearAll = () => {
    setConfirmState({
      open: true, variant: 'danger', title: 'Hapus Semua Riwayat',
      message: `Semua percakapan akan <strong>dihapus permanen</strong> dan tidak dapat dikembalikan.`,
      confirmLabel: 'Hapus Semua',
      onConfirm: () => {
        createInitialSession();
        setConfirmState(p => ({ ...p, open: false }));
      }
    });
  };

  const handleToggleVoiceRecord = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isRecordingAudio) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      setIsRecordingAudio(false);
      return;
    }

    // 1. Try native Web Speech Recognition for instant Speech-To-Text (STT)
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecordingAudio(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInput((prev: string) => {
              const base = prev.trim();
              return base ? `${base} ${transcript}` : transcript;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecordingAudio(false);
          recognitionRef.current = null;
        };

        recognition.onend = () => {
          setIsRecordingAudio(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed, fallback to audio recording:', e);
      }
    }

    // 2. Fallback to MediaRecorder for audio recording attachment
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

  const handleToggleTts = (id: string, text: string) => {
    if (speakingId === id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Browser Anda tidak mendukung Web Speech API.');
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(id);

    // Clean markdown symbols for natural reading
    const cleanText = text
      .replace(/[*#`_~>\[\]\(\)]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith('id') || v.name.toLowerCase().includes('indonesia'));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
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
  const callOpenRouter = async (
    history: UiMessage[],
    promptText: string,
    cMode: 'general' | 'trading',
    targetModel: string = selectedModel,
    attach?: MediaAttachment
  ) => {
    let content: any = promptText;
    
    // Check if this is an image generation request
    if (promptText.startsWith('/imagine ')) {
      return callOpenRouterImageGen(promptText.slice(9).trim(), targetModel);
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
    
    const sysPrompt = cMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT;
    let primaryTextModel = targetModel || selectedModel || 'gemini-3.6-flash';

    // 0A. Direct execution: If model is Gemini, call official Google API directly
    if (primaryTextModel === 'gemini-3.6-flash' || primaryTextModel.startsWith('gemini')) {
      return await callGeminiApi(history, promptText, sysPrompt, attach);
    }

    // 0B. Direct execution: If model is DeepSeek V4.1 Flash, call Token Harbor API directly
    if (primaryTextModel.includes('v4.1') || primaryTextModel.includes('tokenharbor') || primaryTextModel.includes('deepseek-v4')) {
      try {
        return await callTokenHarborApi(history, promptText, sysPrompt, 'deepseek-v4.1-flash:free');
      } catch (err: any) {
        const geminiRes = await callGeminiApi(history, promptText, sysPrompt, attach);
        const errMsg = err?.message || '';
        let notice = `> ⚠️ **Info Token Harbor**: Kunci Token Harbor Anda memerlukan verifikasi email pendaftaran di [tokenharbor.ai/dashboard](https://tokenharbor.ai/dashboard). Jawaban sementara ini dialihkan ke **Google Gemini 3.6 Flash** (100% Aktif via 7 Kunci Resmi).\n\n---\n\n`;
        if (!errMsg.toLowerCase().includes('email') && !errMsg.toLowerCase().includes('verif')) {
          notice = `> ⚠️ **Info Token Harbor**: Server Token Harbor sedang sibuk (${errMsg}). Permintaan otomatis dialihkan ke **Google Gemini 3.6 Flash**.\n\n---\n\n`;
        }
        return {
          content: notice + geminiRes.content,
          model: 'Gemini 3.6 Flash'
        };
      }
    }

    // 0C. Direct execution: If model is DeepSeek V3.2, call SambaNova API directly
    if (primaryTextModel === 'DeepSeek-V3.2' || primaryTextModel.includes('sambanova') || primaryTextModel.includes('v3.2')) {
      try {
        return await callSambaNovaApi(history, promptText, sysPrompt, 'DeepSeek-V3.2');
      } catch (err: any) {
        const geminiRes = await callGeminiApi(history, promptText, sysPrompt, attach);
        const errMsg = err?.message || '';
        const notice = `> ⚠️ **Info SambaNova**: SambaNova Cloud mengembalikan: *"${errMsg}"*. Permintaan otomatis dialihkan ke **Google Gemini 3.6 Flash** (100% Aktif via 7 Kunci Resmi).\n\n---\n\n`;
        return {
          content: notice + geminiRes.content,
          model: 'Gemini 3.6 Flash'
        };
      }
    }

    let lastErr: any = null;
    let isQuotaOrAuthIssue = false;

    // 1. Primary execution: try the model with all available keys
    for (const key of getOpenRouterKeys()) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 40000);
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: ctrl.signal,
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'SONEX AI' },
          body: JSON.stringify({ model: primaryTextModel, temperature: cMode === 'trading' ? 0.15 : 0.4, max_tokens: 2500, messages: msgs })
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return { content: reply, model: data.model || primaryTextModel };
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${res.status}`;
          if (res.status === 401 || res.status === 402 || errMsg.toLowerCase().includes('credit') || errMsg.toLowerCase().includes('payment')) {
            isQuotaOrAuthIssue = true;
          }
          lastErr = new Error(errMsg);
        }
      } catch (e: any) {
        lastErr = e;
      }
    }

    // 2. If OpenAI or Claude requires paid balance that the current keys don't have,
    // gracefully route to Google Gemini (which has 7 active keys and 10.5K free requests per day!)
    if (isQuotaOrAuthIssue) {
      try {
        const geminiRes = await callGeminiApi(history, promptText, sysPrompt, attach);
        const chosenObj = CORE_MODELS.find(m => m.id === primaryTextModel);
        const chosenName = chosenObj?.name || primaryTextModel;
        const notice = `> ⚠️ **Pemberitahuan Kuota**: Model pilihan (**${chosenName}**) membutuhkan saldo OpenRouter aktif. Permintaan otomatis dialihkan ke **Google Gemini 3.6 Flash** (100% Gratis via 7 kunci resmi Anda).\n\n---\n\n`;
        return {
          content: notice + geminiRes.content,
          model: 'Gemini 3.6 Flash'
        };
      } catch { }

      const freeFallbacks = [
        'openrouter/free',
        'nex-agi/nex-n2.5-pro:free',
        'nvidia/nemotron-3.5-lightning:free',
        'google/gemma-4-26b-a4b-it:free',
        'inclusionai/ling-3.0-flash-vl:free'
      ];
      for (const key of getOpenRouterKeys()) {
        for (const fbModel of freeFallbacks) {
          if (fbModel === primaryTextModel) continue;
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 35000);
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              signal: ctrl.signal,
              headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Title': 'SONEX AI' },
              body: JSON.stringify({ model: fbModel, temperature: cMode === 'trading' ? 0.15 : 0.4, max_tokens: 2500, messages: msgs })
            });
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              const reply = data.choices?.[0]?.message?.content;
              if (reply) {
                const chosenName = CORE_MODELS.find(m => m.id === primaryTextModel)?.name || primaryTextModel;
                const fbName = availableModels.find(m => m.id === fbModel)?.name || fbModel.split('/').pop() || fbModel;
                const notice = `> ⚠️ **Pemberitahuan Model**: Model pilihan Anda (**${chosenName}**) membutuhkan saldo/kredit berbayar di OpenRouter. Karena kunci aktif berada di Free Tier, respon ini dialihkan ke **${fbName}**.\n\n---\n\n`;
                return {
                  content: notice + reply,
                  model: fbModel
                };
              }
            }
          } catch {}
        }
      }
    }

    throw lastErr || new Error(`Gagal menghubungi model ${primaryTextModel}.`);
  };

  const enhanceImagePrompt = async (rawPrompt: string): Promise<string> => {
    const lower = rawPrompt.toLowerCase();

    // 1. Precise subject mapping to prevent AI hallucination (e.g. car turning into motorbike)
    let subjectDetail = '';
    if (/mobil\s*sport|supercar|hypercar|ferrari|lamborghini|porsche|mclaren|audi\s*r8/i.test(lower)) {
      subjectDetail = 'A sleek aerodynamic luxury sports car, glossy metallic finish, glowing high-tech LED headlights, aggressive low-stance bodywork';
    } else if (/mobil/i.test(lower)) {
      subjectDetail = 'A modern luxury automobile with glossy paint and sharp realistic details';
    } else if (/motor|motorcycle|ninja|ducati/i.test(lower)) {
      subjectDetail = 'A high-performance sport racing motorcycle with sharp aerodynamic fairings';
    } else if (/kucing/i.test(lower)) {
      subjectDetail = 'An adorable fluffy cat with expressive lifelike eyes and soft detailed fur';
    } else if (/anjing/i.test(lower)) {
      subjectDetail = 'A beautiful dog with highly detailed fur and lifelike expression';
    } else if (/robot|cyborg|mecha/i.test(lower)) {
      subjectDetail = 'A futuristic humanoid robot with polished chrome and carbon-fiber armor, glowing cybernetic circuits';
    } else if (/wanita|cewek|gadis|perempuan/i.test(lower)) {
      subjectDetail = 'A stunningly beautiful elegant woman, photorealistic facial features, natural skin texture';
    } else if (/pria|cowok|laki/i.test(lower)) {
      subjectDetail = 'A handsome charismatic man, photorealistic portrait, sharp detailed features';
    }

    // 2. Precise environment and lighting mapping
    let envDetail = '';
    if (/malam\s*hari|malam|night/i.test(lower)) {
      envDetail = 'parked on a rain-slicked wet asphalt street in a vibrant illuminated city at night, brilliant neon signage reflections, glowing streetlamps, moody volumetric atmospheric lighting';
    } else if (/pagi|sunrise/i.test(lower)) {
      envDetail = 'during early sunrise, golden hour lighting, gentle sun rays, soft morning mist';
    } else if (/sore|sunset|senja/i.test(lower)) {
      envDetail = 'at a breathtaking sunset, dramatic golden orange and purple twilight sky, cinematic lens flare';
    } else if (/hujan|rain/i.test(lower)) {
      envDetail = 'in gentle rain, glistening water droplets on surfaces, sharp wet ground reflections';
    }

    // 3. Rock-solid baseline prompt (used if LLM times out or gives poor result)
    const basePrompt = [
      subjectDetail || rawPrompt,
      envDetail || 'cinematic atmospheric lighting',
      'crystal-clear sharp focus, professional commercial photography, 85mm f/1.4 lens optics, ray-traced reflections, highly detailed textures, masterpiece, no watermarks, no blur'
    ].filter(Boolean).join(', ');

    // 4. Try fast LLM expansion (nex-agi/nex-n2.5-mini:free) with strict timeout
    for (const key of getOpenRouterKeys()) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'nex-agi/nex-n2.5-mini:free',
            max_tokens: 280,
            temperature: 0.6,
            messages: [
              {
                role: 'system',
                content: 'You are an elite AI Art Director for Midjourney and Google Gemini. Convert user prompt into a rich, photorealistic, cinematic English prompt for image generation. Describe subject, environment, lighting, and camera optics. Never include text, watermarks, or "4k". Reply with ONLY the English prompt.'
              },
              { role: 'user', content: rawPrompt }
            ]
          })
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const enhanced = data.choices?.[0]?.message?.content?.trim();
          if (enhanced && enhanced.length > 25 && !enhanced.endsWith('...')) {
            return enhanced.replace(/^["']|["']$/g, '');
          }
        }
      } catch {
        // continue
      }
    }

    return basePrompt;
  };

  const callOpenRouterImageGen = async (prompt: string, model: string = IMAGE_MODEL) => {
    const cleanPrompt = prompt.replace(/^(tolong\s+|coba\s+)?(buatkan|buat|bikin|generate|lukiskan|lukis|gambarin|gambar)\s+(gambar|foto|lukisan|ilustrasi)?\s*/i, '').trim() || prompt;



    // 2. AI Prompt Expansion
    const enhancedPrompt = await enhanceImagePrompt(cleanPrompt);
    const safeAlt = cleanPrompt.replace(/["'\[\]\(\)]/g, '');

    const isExplicitSunburst = model.toLowerCase().includes('sunburst') || model.toLowerCase().includes('gpt-image');
    const isExplicitOpenAI = model.toLowerCase().includes('openai') || isExplicitSunburst;
    const isExplicitGemini = model.toLowerCase().includes('gemini');

    // Get clean human-friendly display name for the model chosen by user
    const matchedModelObj = availableModels.find(m => m.id === model);
    const modelDisplayName = matchedModelObj?.name || (isExplicitSunburst ? 'OpenAI: GPT Image 2.5 Sunburst' : model.split('/').pop() || model);

    // 3. Try OpenRouter endpoints based on the chosen model:
    for (const key of getOpenRouterKeys()) {
      // 3A. Dedicated Image API (/api/v1/images/generations) - e.g. for openai/gpt-image-2.5-sunburst or flux
      if (isExplicitSunburst || (!isExplicitGemini && !model.includes('gpt-5-image'))) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 45000);
          const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
            method: 'POST',
            signal: ctrl.signal,
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'X-Title': 'SONEX AI'
            },
            body: JSON.stringify({
              model,
              prompt: enhancedPrompt,
              response_format: 'url'
            })
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const url = data.data?.[0]?.url || data.url;
            if (url) {
              return {
                content: `🎨 **Hasil Gambar AI (${modelDisplayName}):** *"${cleanPrompt}"*\n\n✨ *Prompt Disempurnakan:* *"${enhancedPrompt}"*\n\n![${safeAlt}](${url})\n\n*(Engine: ${modelDisplayName} · Kualitas: Ultra HD · 100% Bebas Watermark)*`,
                model
              };
            }
          }
        } catch {
          // continue
        }
      }

      // 3B. Multimodal Chat Completion Image API (for Gemini & OpenAI Multimodal models)
      const chatImageModelsToTry: string[] = [];
      if (isExplicitGemini) {
        chatImageModelsToTry.push(model, 'google/gemini-3.1-flash-image', 'google/gemini-2.5-flash-image');
      } else if (isExplicitOpenAI) {
        chatImageModelsToTry.push('openai/gpt-5-image-mini', 'openai/gpt-5.4-image-2', 'google/gemini-3.1-flash-image');
      } else {
        chatImageModelsToTry.push(model, 'google/gemini-3.1-flash-image', 'google/gemini-2.5-flash-image');
      }

      for (const mToTry of Array.from(new Set(chatImageModelsToTry))) {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 45000);
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: ctrl.signal,
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'X-Title': 'SONEX AI'
            },
            body: JSON.stringify({
              model: mToTry,
              max_tokens: 4096,
              messages: [
                {
                  role: 'user',
                  content: `Generate a photorealistic, studio-quality, crystal-clear 4K commercial photograph of: ${enhancedPrompt}. Sharp focus, cinematic lighting, ultra-detailed textures, no watermark.`
                }
              ]
            })
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const msg = data.choices?.[0]?.message;
            let imgUrl = '';
            if (msg?.images && msg.images.length > 0) {
              imgUrl = msg.images[0]?.image_url?.url || msg.images[0]?.url || '';
            }
            if (!imgUrl && typeof msg?.content === 'string') {
              const b64Match = msg.content.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/);
              if (b64Match) imgUrl = b64Match[0];
              const urlMatch = msg.content.match(/https?:\/\/[^\s\)"']+\.(png|jpg|jpeg|webp)/i);
              if (!imgUrl && urlMatch) imgUrl = urlMatch[0];
            }

            if (imgUrl) {
              const usedDisplay = availableModels.find(m => m.id === mToTry)?.name || mToTry.split('/').pop() || mToTry;
              return {
                content: `🎨 **Hasil Gambar AI (${modelDisplayName}):** *"${cleanPrompt}"*\n\n✨ *Prompt Disempurnakan:* *"${enhancedPrompt}"*\n\n![${safeAlt}](${imgUrl})\n\n*(Engine: ${usedDisplay} · Kualitas: Ultra HD 4K · 100% Bebas Watermark)*`,
                model: mToTry
              };
            }
          }
        } catch {
          // continue to next model/key
        }
      }
    }

    // 4. Graceful Free Fallback: If OpenRouter image generation fails or credits are exhausted ($0.00),
    // automatically fallback to high-definition FLUX.1 engine so users can always generate images for free!
    try {
      const seed = Math.floor(Math.random() * 10000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
      return {
        content: `🎨 **Hasil Gambar AI (Ultra HD):** *"${cleanPrompt}"*\n\n✨ *Prompt Disempurnakan:* *"${enhancedPrompt}"*\n\n![${safeAlt}](${pollinationsUrl})\n\n*(Engine: FLUX.1 Ultra HD · Resolusi: 1024×1024 · 100% Bebas Biaya)*`,
        model: 'flux-ultra-free'
      };
    } catch {
      throw new Error('Gagal membuat gambar. Server sedang padat, silakan coba beberapa saat lagi.');
    }
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

  // ── Auto Analysis ──
  const triggerAutoAnalysis = async (symbol: string) => {
    setBusy(true);
    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: `Analisis Otomatis ${symbol} (Top-Down MTF H4 → M15 → M5)`, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    const targetSessionId = activeSession ? activeSession.id : `s_${Date.now()}`;
    const newTitle = `Analisa ${symbol}`;

    saveSessions(prev => {
      const exists = prev.some(s => s.id === targetSessionId);
      if (exists) {
        return prev.map(s => s.id === targetSessionId ? { ...s, title: newTitle, mode: 'trading', messages: curMsgs, updatedAt: Date.now() } : s);
      } else {
        const newSession: ChatSession = {
          id: targetSessionId,
          title: newTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'trading',
          messages: curMsgs,
          pinned: false
        };
        return [newSession, ...prev];
      }
    }, targetSessionId);
    setCurrentSessionId(targetSessionId);

    try {
      const d = await fetchLiveMarketData(symbol);
      if (!d) throw new Error('Gagal tarik data live.');
      const prompt = `[DATA LIVE BINANCE]: ${d.symbol} $${d.price} (${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%) | H4: ${d.h4.trend} | M15 RSI: ${d.m15.rsi} Vol: ${d.m15.volRatio}x | M5: ${d.m5.candle} RSI: ${d.m5.rsi}${d.btcWeather ? ` | BTC: $${d.btcWeather.price.toFixed(0)} (${d.btcWeather.status})` : ''}\n\nLakukan analisis trading Neurobro: Bias H4, Setup M15, Entry M5, R:R >= 1:2, Batas Batal.`;
      const result = await callOpenRouter(curMsgs, prompt, 'trading', selectedModel);
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Kendala: ${err?.message || 'Gagal.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, eMsg] } : s));
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

    // Modal check on the user-selected model
    const currentModelObj = availableModels.find(m => m.id === selectedModel);
    const hasImageModality = Boolean(currentModelObj?.outputModalities?.includes('image'));
    const hasAudioModality = Boolean(currentModelObj?.outputModalities?.includes('audio') || currentModelObj?.outputModalities?.includes('speech'));

    // Smart Intent Detection for Image Generation
    const isImagineCommand = trimmed.startsWith('/imagine ');

    // Check if user is asking a question or chatting about capabilities (e.g. "anda bisa buat gambar apaan", "gambar apaa")
    const isQuestionOrMeta = /\?|^(apa+|apakah|bisa|bisakah|anda bisa|kamu bisa|tolong jelaskan|bagaimana|gimana|kenapa|mengapa|contoh|cara)\b/i.test(trimmed) || /\b(apa+|apaan|apaaja|apa aja|apa saja|apa ya|apasih|apa sih)\b/i.test(trimmed);

    // Explicit question about image capabilities
    const isImageCapabilityQuestion = /.*(bisa|apakah|bisa kah|mampu).*(gambar|foto|lukis|visual).*/i.test(trimmed)
      || /.*(gambar|foto).*(apa+|apaan|apaaja|apa aja|apa saja|gimana|bagaimana|apasih|apa sih).*/i.test(trimmed)
      || /^(gambar apa+|gambar apaan|gambar apa aja)\??$/i.test(trimmed);

    // Imperative command to draw: "buatkan gambar kucing", "bikin pemandangan", "generate ilustrasi", "gambar kucing"
    const isImperativeDraw = !isQuestionOrMeta && /^(tolong\s+|coba\s+)?(buatkan|buat|bikin|generate|lukiskan|lukis|gambarin|gambar)\s+(gambar|foto|lukisan|ilustrasi)?\s*(.+)/i.test(trimmed);

    const isImageIntent = isImagineCommand || isImperativeDraw;
    let finalModel = selectedModel;
    let userContent = trimmed;

    if (isImagineCommand) {
      userContent = trimmed.slice(9).trim();
      if (!hasImageModality) {
        finalModel = IMAGE_MODEL;
      }
    } else if (isImperativeDraw) {
      userContent = trimmed;
      if (!hasImageModality) {
        finalModel = IMAGE_MODEL;
      }
    }

    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: userContent, attachment: attachment || undefined, timestamp: getFormattedTime() };
    const curMsgs = activeSession ? [...activeSession.messages, userMsg] : [userMsg];
    const targetSessionId = activeSession ? activeSession.id : `s_${Date.now()}`;
    const newTitle = activeSession?.title === 'Percakapan Baru' || !activeSession ? userContent.slice(0, 36) + (userContent.length > 36 ? '…' : '') : activeSession?.title || 'Obrolan';

    saveSessions(prev => {
      const exists = prev.some(s => s.id === targetSessionId);
      if (exists) {
        return prev.map(s => s.id === targetSessionId ? { ...s, messages: curMsgs, title: newTitle, updatedAt: Date.now() } : s);
      } else {
        const newSession: ChatSession = {
          id: targetSessionId,
          title: newTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: chatMode,
          messages: curMsgs,
          pinned: false
        };
        return [newSession, ...prev];
      }
    }, targetSessionId);
    setCurrentSessionId(targetSessionId);
    setInput(''); setAttachment(null);
    const textarea = document.querySelector('.chat-input-area textarea') as HTMLTextAreaElement;
    if (textarea) textarea.style.height = 'auto';
    setBusy(true);

    // Loading message for Heavy generation
    const isImageModel = isImageIntent || (hasImageModality && !isQuestionOrMeta);
    const isAudioModel = hasAudioModality && !hasImageModality;

    if (isImageModel) {
      const waitMsg: UiMessage = { id: `wait_${Date.now()}`, role: 'assistant', content: '🎨 *Sedang menggambar...*', modelUsed: finalModel, timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, waitMsg] } : s));
    } else if (isAudioModel) {
      const waitMsg: UiMessage = { id: `wait_${Date.now()}`, role: 'assistant', content: '🎙️ *Sedang mensintesis suara...*', modelUsed: finalModel, timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: [...s.messages, waitMsg] } : s));
    }

    try {
      let result;
      if (isImageModel) {
        result = await callOpenRouterImageGen(userContent, finalModel);
      } else if (isAudioModel) {
        result = await callOpenRouterSpeechGen(userContent, finalModel);
      } else if (isImageCapabilityQuestion) {
        result = {
          content: `🎨 **Tentu saja bisa!** SONEX terintegrasi langsung dengan model pembuat gambar AI mutakhir untuk menghasilkan karya visual fotorealistis 4K langsung di dalam chat tanpa watermark.

Saya bisa membuat berbagai macam gaya gambar visual, antara lain:
1. **Fotorealistis Ultra HD** — Mobil sport mewah, pemandangan kota malam bertabur neon, potret manusia hidup, hewan, arsitektur sinematik.
2. **Anime & Manga** — Karakter anime estetik, konsep wallpaper cyberpunk, ilustrasi fantasi Makoto Shinkai style.
3. **3D CGI & Digital Art** — Karakter game 3D, konsep seni futuristik sci-fi, pencahayaan neon artistik Unreal Engine 5.
4. **Desain Grafis & Logo** — Konsep logo minimalis modern, ikon vektor, stiker kreatif.

💡 **Coba sekarang! Ketik langsung perintah seperti:**
👉 \`buat mobil sport malam hari\`
👉 \`buat gambar pemandangan danau pegunungan saat sunset dengan pantulan air jernih\`
👉 \`buat gambar seekor kucing cyberpunk dengan kacamata neon di malam hari\`
👉 atau gunakan format \`/imagine [deskripsi kamu]\`

*Ketik salah satu contoh di atas, dan AI akan langsung merender gambarnya untuk Anda!*`,
          model: finalModel
        };
      } else {
        // Text model - Execute with chosen model!
        result = await callOpenRouter(curMsgs, userContent, chatMode, finalModel);
      }
      const aMsg: UiMessage = { id: `a_${Date.now()}`, role: 'assistant', content: result.content, modelUsed: result.model.split('/').pop(), timestamp: getFormattedTime() };
      
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: isImageModel || isAudioModel ? [...s.messages.filter(m => !m.id.startsWith('wait_')), aMsg] : [...s.messages, aMsg] } : s));
    } catch (err: any) {
      const eMsg: UiMessage = { id: `e_${Date.now()}`, role: 'assistant', content: `Maaf, terjadi kesalahan: ${err?.message || 'Gagal terhubung ke AI.'}`, modelUsed: 'Error', timestamp: getFormattedTime() };
      saveSessions(prev => prev.map(s => s.id === targetSessionId ? { ...s, messages: isImageModel || isAudioModel ? [...s.messages.filter(m => !m.id.startsWith('wait_')), eMsg] : [...s.messages, eMsg] } : s));
    } finally {
      setBusy(false);
    }
  };

  const loadQuotas = () => {
    setShowQuotaModal(true);
  };

  const isWelcome = messages.length === 0;

  // Quick reply suggestions
  const generalQuickReplies = ['🎨 Buat gambar kucing cyberpunk', '🗣️ Tes Suara AI (Text-to-Speech)', 'Bantu saya menulis kode Python', 'Analisis data & gambar'];
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
        <div 
          className="sidebar-brand-row" 
          onClick={() => { if (isMobile) setSidebarOpen(!sidebarOpen); else setSidebarMini(!sidebarMini); }}
          style={{ cursor: 'pointer' }}
          title={sidebarMini ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          <div className="brand-logo-group">
            <div className="brand-emblem">
              <img src="/sonex logo.png" alt="SONEX AI" className="brand-logo-img" />
            </div>
            <div className="sidebar-logo-text">
              <div className="brand-text">SONEX AI</div>
              <div className="brand-subtitle">Intelligence & Trading</div>
            </div>
          </div>
          <span className="brand-version">PRO</span>
          <button 
            className="sidebar-collapse-btn" 
            onClick={(e) => { e.stopPropagation(); if (isMobile) setSidebarOpen(false); else setSidebarMini(true); }}
            title={isMobile ? 'Tutup' : 'Ciutkan Sidebar'}
          >
            {isMobile ? Icons.x : Icons.panel}
          </button>
        </div>

        {/* Mini Icons (Gemini-style action stack when collapsed) */}
        <div className="sidebar-mini-icons">
          <button className="mini-icon-btn accent" onClick={handleNewChat} title="Chat Baru">{Icons.plus}</button>
          <div className="mini-icon-divider" />
          <button 
            className={`mini-icon-btn ${chatMode === 'trading' ? 'trading-active' : 'active'}`} 
            onClick={() => handleToggleMode(chatMode === 'general' ? 'trading' : 'general')} 
            title={`Mode: ${chatMode === 'trading' ? 'Neurobro Trading' : 'Umum'} (Klik untuk ganti)`}
          >
            {chatMode === 'trading' ? Icons.trendingUp : Icons.brain}
          </button>
          <button 
            className={`mini-icon-btn ${showChartPanel ? 'active' : ''}`} 
            onClick={() => setShowChartPanel(!showChartPanel)} 
            title={showChartPanel ? 'Tutup Chart' : 'Buka TradingView'}
          >
            {showChartPanel ? Icons.eyeOff : Icons.barChart}
          </button>
          <button className="mini-icon-btn" onClick={() => setShowSopModal(true)} title="Pedoman (SOP)">
            {Icons.bookOpen}
          </button>
          <button className="mini-icon-btn" onClick={loadQuotas} title="Status Kuota">
            {Icons.zap}
          </button>
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
          {/* Mini mode footer actions */}
          <div className="sidebar-mini-footer">
            <button className="mini-icon-btn" onClick={() => setIsDark(!isDark)} title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
              {isDark ? Icons.sun : Icons.moon}
            </button>
            <button className="mini-icon-btn danger" onClick={handleClearAll} title="Hapus Riwayat">
              {Icons.trash}
            </button>
            <div className="status-dot-pulse" title="4 Kunci API · Live" />
          </div>

          {/* Full mode footer actions */}
          <div className="sidebar-footer-actions">
            <button className="btn-footer" onClick={() => setIsDark(!isDark)}>
              {isDark ? Icons.sun : Icons.moon} {isDark ? 'Mode Terang' : 'Mode Gelap'}
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
        {/* Floating Particles */}
        <div className="particle" /><div className="particle" /><div className="particle" />
        <div className="particle" /><div className="particle" /><div className="particle" />
        <header className="main-header">
          <div className="main-header-left" style={{ flex: 1 }}>
            {isMobile && (
              <button className="header-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '6px 8px' }} title="Menu">
                <img src="/sonex logo.png" alt="SONEX" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
              </button>
            )}
            <div className="header-mode-badge">
              <div className="status-dot" />
              {chatMode === 'trading' ? 'SONEX Neurobro' : 'SONEX AI'}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {(() => {
              const activeCoreModel = CORE_MODELS.find(m => m.id === selectedModel) || CORE_MODELS[0];
              return (
                <>
                  <button 
                    style={{ 
                      background: 'var(--bg-panel-raised)', 
                      border: `1.5px solid ${isModelDropdownOpen ? activeCoreModel.color : 'var(--hairline)'}`, 
                      borderRadius: '24px', 
                      padding: '6px 16px', 
                      fontSize: '12.5px', 
                      fontWeight: 600, 
                      color: 'var(--text-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      cursor: 'pointer', 
                      boxShadow: isModelDropdownOpen ? `0 0 16px ${activeCoreModel.color}33` : 'none',
                      transition: 'all var(--transition-fast)' 
                    }}
                    onClick={(e) => { e.stopPropagation(); setIsModelDropdownOpen(!isModelDropdownOpen); }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = activeCoreModel.color}
                    onMouseOut={(e) => {
                      if (!isModelDropdownOpen) e.currentTarget.style.borderColor = 'var(--hairline)';
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{activeCoreModel.icon}</span>
                    <span style={{ fontWeight: 700, letterSpacing: '-0.2px' }}>{activeCoreModel.name}</span>
                    <span style={{ opacity: 0.65, fontSize: '11px', fontWeight: 500 }}>· {activeCoreModel.modelTag}</span>
                    <span style={{ 
                      fontSize: '9.5px', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      background: activeCoreModel.id === 'gemini-3.6-flash' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.08)', 
                      color: activeCoreModel.color 
                    }}>
                      {activeCoreModel.badge}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7 }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {isModelDropdownOpen && (
                    <div 
                      className="model-dropdown-menu" 
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        position: 'absolute', 
                        top: 'calc(100% + 12px)', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        zIndex: 100, 
                        background: 'var(--glass-bg-strong)', 
                        backdropFilter: 'blur(28px)', 
                        WebkitBackdropFilter: 'blur(28px)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '18px', 
                        width: '390px', 
                        overflow: 'hidden', 
                        boxShadow: 'var(--shadow-lg)', 
                        display: 'flex', 
                        flexDirection: 'column' 
                      }}
                    >
                      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--hairline)', background: 'var(--bg-panel-raised)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {Icons.cpu} Tiga Model Pilihan SONEX AI
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                            3 MODEL UTAMA
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Model resmi terbaik dari Google, OpenAI, dan Anthropic
                        </div>
                      </div>

                      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {CORE_MODELS.map((m) => {
                          const isSelected = selectedModel === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                handleSelectModel(m.id);
                                setIsModelDropdownOpen(false);
                              }}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: isSelected ? `1.5px solid ${m.color}` : '1px solid var(--hairline)',
                                background: isSelected ? `${m.color}15` : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '22px' }}>{m.icon}</span>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {m.name}
                                      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>({m.modelTag})</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: m.color, fontWeight: 600, marginTop: '1px' }}>
                                      {m.provider === 'gemini' ? 'Direct Google AI Studio (7 Kunci)' : 'OpenRouter Engine'}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: `${m.color}20`, color: m.color }}>
                                    {m.badge}
                                  </span>
                                  {isSelected && (
                                    <span style={{ color: m.color, display: 'flex', alignItems: 'center' }}>
                                      {Icons.check}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4, paddingLeft: '32px' }}>
                                {m.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--hairline)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>💎 Gemini: <strong>10.500 req/hari (Gratis)</strong></span>
                        <button 
                          onClick={() => { setIsModelDropdownOpen(false); loadQuotas(); }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          Status Kuota & Kunci →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="main-header-right" style={{ flex: 1, justifyContent: 'flex-end' }}>
            <button className={`header-btn ${showChartPanel ? 'active-chart' : ''}`} onClick={() => setShowChartPanel(!showChartPanel)}>
              {Icons.barChart} {showChartPanel ? 'Tutup' : 'Chart'}
            </button>
            <button className="header-btn" onClick={loadQuotas}>{Icons.zap} Kuota</button>
            <button className="header-btn" onClick={() => setShowSopModal(true)}>{Icons.bookOpen} SOP</button>
            <button className="header-btn" onClick={() => setIsDark(!isDark)} title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
              {isDark ? Icons.sun : Icons.moon}
            </button>
          </div>
        </header>

        <div className="chat-stream-container" ref={scrollRef}>
          {/* Welcome Screen */}
          {isWelcome && (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <img src="/sonex logo.png" alt="SONEX AI" />
              </div>
              <div className="welcome-title">Selamat Datang di SONEX AI</div>
              <div className="welcome-sub">
                {chatMode === 'trading'
                  ? 'SONEX Trading Neurobro siap menganalisis chart dengan SOP baku Top-Down MTF. Pilih topik atau ketik pertanyaan.'
                  : 'Asisten AI otonom mutakhir. Tanyakan apa saja seputar kode, logika, buat gambar, atau kirim media untuk dianalisis.'}
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
              {m.role === 'assistant' && <div className="assistant-avatar-circle"><img src="/sonex logo.png" alt="SONEX" /></div>}
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
              <div className="assistant-avatar-circle"><img src="/sonex logo.png" alt="SONEX" /></div>
              <div className="thinking-pill">
                <div className="typing-dots"><span /><span /><span /></div>
                <span>SONEX sedang menganalisa…</span>
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
              {attachment.type === 'audio' && <div className="attachment-thumb" style={{ background: 'var(--bg-panel-raised)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icons.mic}</div>}
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
            <iframe title="TradingView" src={`https://s.tradingview.com/widgetembed/?frameElementId=tv&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=${isDark ? '0D111A' : 'F1F4F8'}&theme=${isDark ? 'dark' : 'light'}&style=1&timezone=Asia%2FJakarta`} />
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
            <div className="modal-header"><div><div className="modal-title">Status Kuota & Engine AI</div></div><button className="modal-close-btn" onClick={() => setShowQuotaModal(false)}>{Icons.x}</button></div>
            <div className="modal-body">
              {/* Google Gemini Official Keys Section */}
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>💎</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Google Gemini Official API</div>
                      <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 600 }}>Rotasi 7 Kunci Multi-Key Aktif</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull)' }}>
                    ✓ 10.500 REQ/HARI (GRATIS)
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Terhubung langsung ke Google AI Studio dengan model <strong>gemini-3.6-flash</strong>. Dilengkapi rotasi otomatis antar 7 kunci resmi agar obrolan Anda tidak pernah terputus batasan kuota.
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6, marginBottom: 10 }}>
                  {getGeminiKeys().map((gk, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1} {gk.slice(0, 11)}...{gk.slice(-4)}</span>
                      <span style={{ color: 'var(--bull)', fontSize: 10, fontWeight: 700 }}>✓ AKTIF</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px dashed rgba(6, 182, 212, 0.25)', paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>+ Tambah API Key Google Gemini Pribadi:</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      placeholder="Kunci Google AI Studio pribadi..."
                      value={customGeminiInput}
                      onChange={(e) => setCustomGeminiInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11.5, borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--bg-obsidian)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}
                    />
                    <button
                      className="btn-new-chat-full"
                      style={{ width: 'auto', padding: '0 14px', margin: 0, fontSize: 12, height: '32px' }}
                      onClick={() => {
                        try {
                          if (customGeminiInput.trim()) {
                            localStorage.setItem('@sonex_gemini_api_keys', customGeminiInput.trim());
                          } else {
                            localStorage.removeItem('@sonex_gemini_api_keys');
                          }
                          alert('Kunci Gemini berhasil disimpan!');
                        } catch {}
                      }}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>

              {/* Token Harbor Section */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🐋</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>Token Harbor API (DeepSeek V4.1 Flash)</div>
                      <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600 }}>3 Kunci Aktif Terhubung</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
                    FREE TIER
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
                  Model: <code>deepseek-v4.1-flash:free</code>. Mendukung teks & visual multimodal.
                </div>
                <div style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 6, padding: '6px 10px', color: '#FBBF24', marginBottom: 10, lineHeight: 1.4 }}>
                  ⚠️ <strong>Penting:</strong> Pastikan Anda telah mengklik link konfirmasi pendaftaran di inbox email Anda (atau kunjungi <a href="https://tokenharbor.ai/dashboard" target="_blank" rel="noreferrer" style={{ color: '#FBBF24', textDecoration: 'underline' }}>tokenharbor.ai/dashboard</a>) agar kunci Token Harbor aktif sepenuhnya.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                  {getTokenHarborKeys().map((tk, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1} {tk.slice(0, 12)}...{tk.slice(-4)}</span>
                      <span style={{ color: '#60A5FA', fontSize: 10, fontWeight: 700 }}>TERPASANG</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SambaNova Cloud Section */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>SambaNova Cloud API (DeepSeek V3.2)</div>
                      <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>2 Kunci Aktif Terhubung</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD' }}>
                    FAST MOE
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Model: <code>DeepSeek-V3.2</code>. Menggunakan akselerator chip SambaNova AI. Jika server sedang dalam antrean padat, obrolan otomatis dilanjutkan oleh Google Gemini.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                  {getSambaNovaKeys().map((sk, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '5px 8px', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>#{idx + 1} {sk.slice(0, 8)}...{sk.slice(-4)}</span>
                      <span style={{ color: '#A78BFA', fontSize: 10, fontWeight: 700 }}>TERPASANG</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hairline)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>🔑 Kunci API Tambahan (Opsional)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                  Punya kunci API Token Harbor atau OpenRouter tambahan? Masukkan di sini:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    placeholder="thk_live_... atau sk-or-v1-..."
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', fontSize: 11.5, borderRadius: 8, border: '1px solid var(--hairline)', background: 'var(--bg-obsidian)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    className="btn-new-chat-full"
                    style={{ width: 'auto', padding: '0 14px', margin: 0, fontSize: 12, height: '32px' }}
                    onClick={() => {
                      try {
                        if (customKeyInput.trim()) {
                          if (customKeyInput.startsWith('thk_')) {
                            localStorage.setItem('@sonex_tokenharbor_api_keys', customKeyInput.trim());
                          } else {
                            localStorage.setItem('@nova_custom_api_keys', customKeyInput.trim());
                          }
                        } else {
                          localStorage.removeItem('@nova_custom_api_keys');
                          localStorage.removeItem('@sonex_tokenharbor_api_keys');
                        }
                        loadQuotas();
                        alert('Kunci API berhasil disimpan!');
                      } catch {}
                    }}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}