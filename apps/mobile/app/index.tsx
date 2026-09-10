import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AgentMode } from '@nova/shared';

export type AttachmentType = 'image' | 'video';

export type Attachment = {
  id: string;
  uri: string;
  type: AttachmentType;
  base64?: string;
  mimeType?: string;
  name?: string;
};

export type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  imageUri?: string;
  mediaType?: AttachmentType;
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

const OPENROUTER_KEYS = (
  process.env.EXPO_PUBLIC_OPENROUTER_KEYS || ''
).split(',').map((k: string) => k.trim()).filter(Boolean);

// Storage Keys
const SESSIONS_STORAGE_KEY = '@nova_chat_sessions_v4';
const ACTIVE_SESSION_STORAGE_KEY = '@nova_active_session_id_v4';

// ============================================================================
// OPENROUTER FACTUAL QUOTA INFRASTRUCTURE (100% Honest, No Fake Rings)
// ============================================================================
export type KeyQuotaInfo = {
  key: string;
  maskedKey: string;
  label: string;
  status: 'healthy' | 'rate_limited' | 'invalid' | 'error';
  usage: number;
  usageDaily: number;
  usageWeekly: number;
  usageMonthly: number;
  limit: number | null;
  limitRemaining: number | null;
  isFreeTier: boolean;
  rateLimitNote?: string;
  lastError?: string;
};

export async function fetchKeyQuota(key: string): Promise<KeyQuotaInfo> {
  const maskedKey = key.length > 16 ? `${key.slice(0, 10)}...${key.slice(-6)}` : key;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      const errMsg = json.error?.message || `HTTP ${res.status}`;
      return {
        key,
        maskedKey,
        label: maskedKey,
        status: res.status === 429 ? 'rate_limited' : res.status === 401 ? 'invalid' : 'error',
        usage: 0,
        usageDaily: 0,
        usageWeekly: 0,
        usageMonthly: 0,
        limit: null,
        limitRemaining: null,
        isFreeTier: false,
        lastError: errMsg
      };
    }

    const data = json.data || {};
    return {
      key,
      maskedKey,
      label: data.label || maskedKey,
      status: 'healthy',
      usage: Number(data.usage || 0),
      usageDaily: Number(data.usage_daily || 0),
      usageWeekly: Number(data.usage_weekly || 0),
      usageMonthly: Number(data.usage_monthly || 0),
      limit: data.limit !== null ? Number(data.limit) : null,
      limitRemaining: data.limit_remaining !== null ? Number(data.limit_remaining) : null,
      isFreeTier: Boolean(data.is_free_tier),
      rateLimitNote: data.rate_limit?.note
    };
  } catch (err) {
    return {
      key,
      maskedKey,
      label: maskedKey,
      status: 'error',
      usage: 0,
      usageDaily: 0,
      usageWeekly: 0,
      usageMonthly: 0,
      limit: null,
      limitRemaining: null,
      isFreeTier: false,
      lastError: err instanceof Error ? err.message : 'Network error'
    };
  }
}

// ============================================================================
// AUTOMATED TOP-DOWN MTF MARKET DATA & INDICATOR ENGINE (MCP FOR MOBILE)
// ============================================================================
export type TopDownMarketData = {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  h4: {
    lastClose: number;
    high30: number;
    low30: number;
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  };
  m15: {
    lastClose: number;
    high30: number;
    low30: number;
    rsi14: number;
    volumeMa20: number;
    lastVolume: number;
    volumeRatio: number;
  };
  m5: {
    lastClose: number;
    rsi14: number;
    volumeMa20: number;
    lastVolume: number;
    candleType: 'BULLISH_CLOSE' | 'BEARISH_CLOSE' | 'NEUTRAL';
  };
  btcWeather?: {
    price: number;
    change24h: number;
    status: 'BULLISH' | 'DUMP_ALERT' | 'NORMAL';
  };
};

function calculateRsi(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

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
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

function calculateMa(volumes: number[], period: number = 20): number {
  if (volumes.length === 0) return 0;
  const slice = volumes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Math.round((sum / slice.length) * 100) / 100;
}

export async function fetchLiveTopDownData(symbol: string): Promise<TopDownMarketData | null> {
  try {
    const sym = symbol.toUpperCase().replace('/', '').trim();
    const tickerRes = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${sym}`);
    if (!tickerRes.ok) return null;
    const ticker = await tickerRes.json();

    const [h4Res, m15Res, m5Res, btcRes] = await Promise.all([
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=4h&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=15m&limit=25`),
      fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=5m&limit=25`),
      sym !== 'BTCUSDT'
        ? fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT`)
        : Promise.resolve(null)
    ]);

    const h4Data = await h4Res.json();
    const m15Data = await m15Res.json();
    const m5Data = await m5Res.json();
    const btcTicker = btcRes ? await btcRes.json() : null;

    const h4Closes = h4Data.map((k: any) => parseFloat(k[4]));
    const h4Highs = h4Data.map((k: any) => parseFloat(k[2]));
    const h4Lows = h4Data.map((k: any) => parseFloat(k[3]));
    const h4High = Math.max(...h4Highs);
    const h4Low = Math.min(...h4Lows);
    const h4Close = h4Closes[h4Closes.length - 1];
    const h4Trend = h4Close > (h4High + h4Low) / 2 ? 'BULLISH' : 'BEARISH';

    const m15Closes = m15Data.map((k: any) => parseFloat(k[4]));
    const m15Highs = m15Data.map((k: any) => parseFloat(k[2]));
    const m15Lows = m15Data.map((k: any) => parseFloat(k[3]));
    const m15Volumes = m15Data.map((k: any) => parseFloat(k[5]));
    const m15Rsi = calculateRsi(m15Closes, 14);
    const m15VolMa = calculateMa(m15Volumes, 20);
    const m15LastVol = m15Volumes[m15Volumes.length - 1];
    const m15VolRatio = m15VolMa > 0 ? Math.round((m15LastVol / m15VolMa) * 100) / 100 : 1;

    const m5Closes = m5Data.map((k: any) => parseFloat(k[4]));
    const m5Opens = m5Data.map((k: any) => parseFloat(k[1]));
    const m5Volumes = m5Data.map((k: any) => parseFloat(k[5]));
    const m5Rsi = calculateRsi(m5Closes, 14);
    const m5VolMa = calculateMa(m5Volumes, 20);
    const m5LastVol = m5Volumes[m5Volumes.length - 1];
    const m5LastOpen = m5Opens[m5Opens.length - 1];
    const m5LastClose = m5Closes[m5Closes.length - 1];
    const m5Candle =
      m5LastClose > m5LastOpen
        ? 'BULLISH_CLOSE'
        : m5LastClose < m5LastOpen
        ? 'BEARISH_CLOSE'
        : 'NEUTRAL';

    let btcWeather;
    if (btcTicker) {
      const change = parseFloat(btcTicker.priceChangePercent);
      btcWeather = {
        price: parseFloat(btcTicker.lastPrice),
        change24h: change,
        status:
          change < -3.5
            ? ('DUMP_ALERT' as const)
            : change > 2.0
            ? ('BULLISH' as const)
            : ('NORMAL' as const)
      };
    }

    return {
      symbol: sym,
      price: parseFloat(ticker.lastPrice),
      change24h: parseFloat(ticker.priceChangePercent),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      volume24h: parseFloat(ticker.volume),
      h4: {
        lastClose: h4Close,
        high30: h4High,
        low30: h4Low,
        trend: h4Trend
      },
      m15: {
        lastClose: m15Closes[m15Closes.length - 1],
        high30: Math.max(...m15Highs),
        low30: Math.min(...m15Lows),
        rsi14: m15Rsi,
        volumeMa20: m15VolMa,
        lastVolume: m15LastVol,
        volumeRatio: m15VolRatio
      },
      m5: {
        lastClose: m5LastClose,
        rsi14: m5Rsi,
        volumeMa20: m5VolMa,
        lastVolume: m5LastVol,
        candleType: m5Candle
      },
      btcWeather
    };
  } catch (err) {
    console.error('Error fetching live market data:', err);
    return null;
  }
}

export function formatMarketDataPrompt(data: TopDownMarketData): string {
  return `[DATA REAL-TIME ABSOLUT LIVE CHART & INDIKATOR BINANCE (NO HALLUCINATION)]:
• Aset: ${data.symbol} | Harga Saat Ini: $${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} | Perubahan 24h: ${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%
• Rentang 24 Jam: Low $${data.low24h.toFixed(2)} — High $${data.high24h.toFixed(2)} | Volume 24h: ${data.volume24h.toFixed(1)}
• Multi-Timeframe (Top-Down):
  - [H4 BIAS]: Last Close $${data.h4.lastClose.toFixed(2)} | Range: $${data.h4.low30.toFixed(2)} - $${data.h4.high30.toFixed(2)} | Arah Makro: ${data.h4.trend}
  - [M15 SETUP]: Last Close $${data.m15.lastClose.toFixed(2)} | RSI(14): ${data.m15.rsi14} | Volume: ${data.m15.lastVolume.toFixed(2)} (Rasio MA20: ${data.m15.volumeRatio}x)
  - [M5 EKSEKUSI]: Last Close $${data.m5.lastClose.toFixed(2)} | Candle Terakhir: ${data.m5.candleType} | RSI(14): ${data.m5.rsi14}
${data.btcWeather ? `• [CUACA BITCOIN INDEKS]: BTC Price $${data.btcWeather.price.toFixed(2)} (${data.btcWeather.change24h > 0 ? '+' : ''}${data.btcWeather.change24h.toFixed(2)}%) | Status Cuaca: ${data.btcWeather.status}` : ''}

Instruksi Analisis:
Jalankan evaluasi sesuai Pedoman Baku Neurobro:
1. Tentukan Bias Utama H4
2. Identifikasi Area Setup M15 & Validasi Volume Breakout
3. Verifikasi Konfirmasi Entry M5 & Rejeksi
4. Hitung Rencana Posisi: Entry, SL di luar invalidasi absolut, TP (R:R minimal 1:2), dan Angka Batas Batal
5. Nyatakan HANYA SATU panggilan: BUY, SELL, atau HOLD.`;
}

// ============================================================================
// SYSTEM PROMPTS: GENERAL ASSISTANT vs NEUROBRO TRADING DIRECTIVE
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

## 🧠 Filosofi & Arsitektur AI
1. JANGAN PERNAH MENEBAK DATA (NO HALLUCINATION):
   - Selalu konfirmasi ke data absolut atau chart visual yang terlampir. Jika data tidak terlihat, bilang "Data tidak terlihat/tidak tahu".
2. PISAHKAN KALKULASI DARI INTERPRETASI:
   - Baca reaksi harga faktual dan indikator yang terlihat, bukan menghitung asumsi sendiri.

## 🔥 Rahasia Dapur Eksekusi & Hirarki Konfluensi
1. HIRARKI ANALISA: Struktur > Volume > Momentum. Momentum (RSI/MACD) tanpa konfirmasi Struktur mutlak di-SKIP.
2. MEMBACA LONG/SHORT RATIO (CONTRARIAN):
   - Rasio ekstrem retail adalah filter skeptis tambahan, BUKAN pemicu open posisi. Struktur patah + rasio ekstrem = Valid.
3. BREAKOUT VS FAKEOUT (LIQUIDITY GRAB):
   - Menembus level hanya dengan wick candle adalah Liquidity Grab. Wajib tunggu candle close dan retest dengan konfirmasi volume.

## ⚙️ Parameter Indikator Baku
- MACD: 12 / 26 / 9 (EMA, Source Close) — Wajib tunggu candle close.
- RSI: Length 14 (SMA 14) — DILARANG short membabi buta hanya karena RSI > 70. Tren kuat bisa overbought lama.
- Volume: MA Length 20 — Konfirmasi validitas breakout dengan membandingkan terhadap rata-rata 20 candle.

## ⏱️ Analisa Multi-Timeframe (Top-Down Approach)
- H4: Arah Utama (Bias Makro, S/R mayor, Swing High/Low).
- M15: Area Setup (Pullback, Penembusan, Pengujian ulang / Retest).
- M5: Konfirmasi Entry (Validasi struktur mikro, lonjakan volume, candle close).
- M1: DIABAIKAN (terlalu noisy).
SOP: H4 (Bias) ➡️ M15 (Setup) ➡️ M5 (Eksekusi). Jika arah timeframe bertentangan, SKIP.

## 🛡️ Kritik Eksekusi & Validasi Neurobro
1. MATEMATIKA R:R (MINIMAL 1:2): Rasio 1:2 adalah batas minimal mutlak. Entry, SL, dan TP wajib mengunci R:R >= 1:2.
2. FAKTA VS NARASI: DILARANG menggunakan narasi asumtif (contoh: "Smart money menjebak ritel"). Chart hanya menampilkan reaksi harga mekanis (rejection, sweep, retest).
3. EKSEKUSI KONDISIONAL: Dilarang order buta full size. Entry wajib kondisional menunggu konfirmasi candle close di M15/M5 dengan volume searah meningkat.
4. STOP LOSS LOGIS: Stop-loss ditempatkan di luar titik invalidasi absolut struktur chart exchange (Binance).
5. CONVICTION CALL & BATAS BATAL: Setiap setup wajib punya SATU panggilan (BUY, SELL, atau HOLD) dan menyertakan angka konkret Batas Batal (Invalidasi Close).

## 🔗 Korelasi Pasar & Cuaca Bitcoin (BTC)
- Hukum Besi Kripto: Bitcoin adalah indeks utama. Algoritma bot mengikat seluruh altcoin ke pergerakan BTC.
- Selalu cek Cuaca BTC sebelum analisa altcoin. DILARANG Long altcoin jika BTC sedang breakdown/dump agresif!`;

// ============================================================================
// OMNI-MODAL MODEL CHAINS
// ============================================================================
const TEXT_MODEL_CHAINS: Record<AgentMode, string[]> = {
  max: [
    'openai/gpt-6-astra',
    'anthropic/claude-sonnet-5',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ],
  fast: [
    'google/gemini-3.8-flash',
    'openai/gpt-5.6-luna',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ],
  auto: [
    'anthropic/claude-sonnet-5',
    'openai/gpt-6-astra',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ]
};

const IMAGE_MODEL_CHAINS: Record<AgentMode, string[]> = {
  max: [
    'openai/gpt-6-astra',
    'anthropic/claude-sonnet-5',
    'google/gemma-4-31b-it:free'
  ],
  fast: [
    'google/gemini-3.8-flash',
    'openai/gpt-6-astra',
    'google/gemma-4-31b-it:free'
  ],
  auto: [
    'anthropic/claude-sonnet-5',
    'openai/gpt-6-astra',
    'google/gemma-4-31b-it:free'
  ]
};

const VIDEO_MODEL_CHAINS: Record<AgentMode, string[]> = {
  max: [
    'google/gemini-2.5-flash',
    'google/gemini-3.8-flash',
    'qwen/qwen-2.5-vl-72b-instruct'
  ],
  fast: [
    'google/gemini-2.5-flash',
    'google/gemini-3.8-flash',
    'google/gemma-4-31b-it:free'
  ],
  auto: [
    'google/gemini-2.5-flash',
    'google/gemini-3.8-flash',
    'qwen/qwen-2.5-vl-72b-instruct'
  ]
};

function getFormattedTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function callOpenRouterDirectly(
  history: UiMessage[],
  prompt: string,
  mode: AgentMode,
  chatMode: 'general' | 'trading',
  attachment?: Attachment | null,
  onFailover?: (failedIndex: number, nextIndex: number, reason: string) => void
) {
  const isVideo = attachment?.type === 'video';
  const isImage = attachment?.type === 'image' && Boolean(attachment?.base64);

  let models = TEXT_MODEL_CHAINS[mode] || TEXT_MODEL_CHAINS.auto;
  if (isVideo) {
    models = VIDEO_MODEL_CHAINS[mode] || VIDEO_MODEL_CHAINS.auto;
  } else if (isImage) {
    models = IMAGE_MODEL_CHAINS[mode] || IMAGE_MODEL_CHAINS.auto;
  }

  const formattedHistory = history.map((m) => {
    if (m.role === 'user' && m.imageUri) {
      return {
        role: 'user' as const,
        content: `[Media Terlampir]: ${m.content}`
      };
    }
    return {
      role: m.role as 'user' | 'assistant',
      content: m.content
    };
  });

  let currentContent: any = prompt;
  if (isImage && attachment?.base64) {
    const mime = attachment.mimeType || 'image/jpeg';
    currentContent = [
      {
        type: 'text',
        text:
          prompt.trim() ||
          (chatMode === 'trading'
            ? 'Analisis chart ini secara ketat dengan SOP Neurobro: Top-Down MTF (H4-M15-M5), Struktur > Volume > Momentum, SL Logis, R:R minimal 1:2, Batas Batal, dan Cek Cuaca BTC.'
            : 'Analisis gambar/dokumen ini secara mendalam dan berikan rincian faktual.')
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${attachment.base64}`
        }
      }
    ];
  } else if (isVideo) {
    currentContent = `[Video Terlampir: ${attachment?.name || 'Rekaman'}]: ${prompt.trim() || 'Analisis peristiwa visual dalam rekaman ini.'}`;
  }

  const activeSystemPrompt = chatMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT;

  const messages = [
    { role: 'system' as const, content: activeSystemPrompt },
    ...formattedHistory,
    { role: 'user' as const, content: currentContent }
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    const key = OPENROUTER_KEYS[i];
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/nova-ai-agent',
          'X-Title': 'NOVA Mobile'
        },
        body: JSON.stringify({
          model: models[0],
          models: models.slice(0, 3),
          temperature: chatMode === 'trading' ? 0.15 : 0.4,
          max_tokens: 2500,
          messages
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if ((response.status === 429 || response.status === 401 || response.status === 402) && i < OPENROUTER_KEYS.length - 1) {
          const reason =
            response.status === 429
              ? 'Rate Limit (429)'
              : response.status === 401
              ? 'Autentikasi (401)'
              : 'Limit Kuota (402)';
          onFailover?.(i, i + 1, reason);
          continue;
        }
        throw new Error(`OpenRouter (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || 'Tidak ada tanggapan teks.',
        model: data.model || models[0],
        keyIndexUsed: i
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < OPENROUTER_KEYS.length - 1) {
        onFailover?.(i, i + 1, 'Koneksi Terganggu');
        continue;
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi OpenRouter.');
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Home() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

  // Sessions & History
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Chat Composer & State
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentMode>('max');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  // Modals
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showTradingSopModal, setShowTradingSopModal] = useState(false);
  const [showTradingViewModal, setShowTradingViewModal] = useState(false);
  const [showModelPickerModal, setShowModelPickerModal] = useState(false);

  // Live Market State (Binance Vision + Top-Down MTF)
  const [selectedTicker, setSelectedTicker] = useState('BTCUSDT');
  const [topDownData, setTopDownData] = useState<TopDownMarketData | null>(null);
  const [loadingTopDown, setLoadingTopDown] = useState(false);

  // Quotas
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [keyQuotas, setKeyQuotas] = useState<KeyQuotaInfo[]>([]);
  const [enableFailover, setEnableFailover] = useState(true);
  const [rateLimitedIndices, setRateLimitedIndices] = useState<number[]>([]);
  const [activeKeyIndex, setActiveKeyIndex] = useState(2);
  const [lastCheckTime, setLastCheckTime] = useState('');
  const [failoverBanner, setFailoverBanner] = useState<string | null>(null);

  // Get active session
  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const chatMode = activeSession?.mode || 'general';

  // 1. Load Sessions from Storage on Mount
  useEffect(() => {
    (async () => {
      try {
        const savedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
        const savedActiveId = await AsyncStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);

        if (savedSessions) {
          const parsed: ChatSession[] = JSON.parse(savedSessions);
          if (parsed.length > 0) {
            setSessions(parsed);
            const initialId =
              savedActiveId && parsed.some((s) => s.id === savedActiveId)
                ? savedActiveId
                : parsed[0].id;
            setCurrentSessionId(initialId);
            return;
          }
        }

        const defaultSession: ChatSession = {
          id: `session_${Date.now()}`,
          title: 'Percakapan Baru',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: 'general',
          messages: [
            {
              id: 'welcome',
              role: 'assistant',
              content:
                'Halo! Saya **NOVA**, asisten AI otonom mutakhir. Saya siap membantu rekayasa kode, penalaran, atau analisa chart trading otomatis (Top-Down MTF) jika Anda mengaktifkan Mode Trading Neurobro di sidebar.',
              modelUsed: 'Claude Sonnet / GPT-6',
              timestamp: getFormattedTime()
            }
          ]
        };
        setSessions([defaultSession]);
        setCurrentSessionId(defaultSession.id);
        await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([defaultSession]));
        await AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, defaultSession.id);
      } catch (err) {
        console.error('Error loading sessions:', err);
      }
    })();
  }, []);

  const saveSessionsToDisk = useCallback(async (updated: ChatSession[], activeId?: string) => {
    try {
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
      if (activeId) {
        await AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeId);
      }
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  }, []);

  // 2. Fetch Quotas
  const fetchQuotas = async () => {
    setLoadingQuota(true);
    try {
      const results = await Promise.all(OPENROUTER_KEYS.map((k: string) => fetchKeyQuota(k)));
      setKeyQuotas(results);
      setLastCheckTime(getFormattedTime());
      const firstHealthy = results.findIndex((r) => r.status === 'healthy');
      if (firstHealthy !== -1) {
        setActiveKeyIndex(firstHealthy);
      }
    } catch {
      // ignore
    } finally {
      setLoadingQuota(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  // 3. Load Live Top-Down Market Data
  const loadMarketData = async (symbol: string) => {
    setLoadingTopDown(true);
    const data = await fetchLiveTopDownData(symbol);
    setTopDownData(data);
    setLoadingTopDown(false);
  };

  useEffect(() => {
    if (showTradingViewModal) {
      loadMarketData(selectedTicker);
    }
  }, [showTradingViewModal, selectedTicker]);

  // 4. Keyboard Auto-Scroll Setup
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    return () => {
      showSub.remove();
    };
  }, []);

  // Create New Chat Session
  const handleNewChat = () => {
    Haptics.selectionAsync().catch(() => {});
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Percakapan Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: chatMode,
      messages: [
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content:
            chatMode === 'trading'
              ? '📈 **Mode Trading Neurobro Aktif.** Siap menganalisis chart pasar dengan SOP baku: Top-Down MTF (H4 ➡️ M15 ➡️ M5), Konfluensi Struktur > Volume > Momentum, R:R minimal 1:2, dan Validasi Batas Batal. Anda dapat mengetuk tombol "📊" untuk menarik data live chart & indikator secara otomatis atau kirim screenshot chart.'
              : 'Halo! Saya **NOVA**, asisten AI Anda. Apa yang ingin kita kerjakan hari ini? (Coding, riset, logika, atau tulisan)',
          modelUsed: 'Ready',
          timestamp: getFormattedTime()
        }
      ]
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setShowSidebar(false);
    saveSessionsToDisk(updated, newSession.id);
  };

  // Switch Chat Session
  const handleSelectSession = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentSessionId(id);
    setShowSidebar(false);
    AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, id).catch(() => {});
  };

  // Delete Chat Session
  const handleDeleteSession = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert('Hapus Obrolan', 'Apakah Anda yakin ingin menghapus sesi obrolan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          const updated = sessions.filter((s) => s.id !== id);
          if (updated.length === 0) {
            handleNewChat();
            return;
          }
          setSessions(updated);
          if (currentSessionId === id) {
            setCurrentSessionId(updated[0].id);
            saveSessionsToDisk(updated, updated[0].id);
          } else {
            saveSessionsToDisk(updated);
          }
        }
      }
    ]);
  };

  // Toggle Mode for current session
  const handleToggleMode = (newMode: 'general' | 'trading') => {
    Haptics.selectionAsync().catch(() => {});
    const updated = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return { ...s, mode: newMode };
      }
      return s;
    });
    setSessions(updated);
    saveSessionsToDisk(updated);
  };

  // Automated Top-Down MTF Analysis Trigger (MCP Mobile Feature)
  const triggerAutomatedAnalysis = async (symbolToAnalyze: string) => {
    setShowTradingViewModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Ensure session is in trading mode
    if (chatMode !== 'trading') {
      handleToggleMode('trading');
    }

    setBusy(true);

    const userMessage: UiMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: `⚡ Analisis Otomatis Chart & Indikator ${symbolToAnalyze} (Top-Down MTF H4 ➡️ M15 ➡️ M5)`,
      timestamp: getFormattedTime()
    };

    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    const sessionTitle = `Analisa ${symbolToAnalyze}`;

    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: sessionTitle,
          mode: 'trading' as const,
          updatedAt: Date.now(),
          messages: currentMessages
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    saveSessionsToDisk(updatedSessions);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 1. Fetch live multi-timeframe candle data & indicators
      const liveData = await fetchLiveTopDownData(symbolToAnalyze);
      if (!liveData) {
        throw new Error(`Gagal menarik data live candlestick dari server bursa untuk ${symbolToAnalyze}.`);
      }

      // 2. Format exact prompt with factual MTF and indicator calculations
      const factualPrompt = formatMarketDataPrompt(liveData);

      // 3. Call OpenRouter with Neurobro trading directive
      const result = await callOpenRouterDirectly(
        currentMessages,
        factualPrompt,
        mode,
        'trading',
        null,
        (failedIdx, nextIdx, reason) => {
          setRateLimitedIndices((prev) => Array.from(new Set([...prev, failedIdx])));
          setActiveKeyIndex(nextIdx);
          setFailoverBanner(`Kunci #${failedIdx + 1} (${reason}) ➔ Beralih ke Kunci #${nextIdx + 1}`);
          setTimeout(() => setFailoverBanner(null), 5000);
        }
      );

      const assistantMessage: UiMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        modelUsed: result.model.split('/').pop() || result.model,
        timestamp: getFormattedTime()
      };

      const finalMessages = [...currentMessages, assistantMessage];
      const finalizedSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: sessionTitle,
            updatedAt: Date.now(),
            messages: finalMessages
          };
        }
        return s;
      });

      setSessions(finalizedSessions);
      saveSessionsToDisk(finalizedSessions);
    } catch (err: any) {
      const errorMessage: UiMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Kendala eksekusi live data: ${err?.message || 'Gagal menghubungi server live data.'}. Silakan coba kembali.`,
        modelUsed: 'Error',
        timestamp: getFormattedTime()
      };

      const withError = [...currentMessages, errorMessage];
      const withErrSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return { ...s, messages: withError };
        }
        return s;
      });
      setSessions(withErrSessions);
      saveSessionsToDisk(withErrSessions);
    } finally {
      setBusy(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Send Message
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    if (busy) return;

    // Check if user is asking to analyze a specific crypto symbol while in trading mode
    const symbolMatch = trimmed.toUpperCase().match(/\b(BTC|ETH|SOL|BNB|XAU|EUR)(USDT)?\b/);
    if (chatMode === 'trading' && symbolMatch && !attachment) {
      const detectedSymbol = symbolMatch[1] === 'EUR' ? 'EURUSDT' : `${symbolMatch[1]}USDT`;
      setInput('');
      await triggerAutomatedAnalysis(detectedSymbol);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBusy(true);

    const userMessage: UiMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      imageUri: attachment?.uri,
      mediaType: attachment?.type,
      timestamp: getFormattedTime()
    };

    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    const sessionTitle =
      activeSession?.title === 'Percakapan Baru'
        ? (trimmed || (attachment ? 'Analisis Media' : 'Obrolan')).slice(0, 30)
        : activeSession?.title || 'Obrolan';

    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          title: sessionTitle,
          updatedAt: Date.now(),
          messages: currentMessages
        };
      }
      return s;
    });
    setSessions(updatedSessions);
    saveSessionsToDisk(updatedSessions);

    setInput('');
    const currentAttachment = attachment;
    setAttachment(null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await callOpenRouterDirectly(
        currentMessages,
        trimmed,
        mode,
        chatMode,
        currentAttachment,
        (failedIdx, nextIdx, reason) => {
          setRateLimitedIndices((prev) => Array.from(new Set([...prev, failedIdx])));
          setActiveKeyIndex(nextIdx);
          setFailoverBanner(`Kunci #${failedIdx + 1} (${reason}) ➔ Beralih ke Kunci #${nextIdx + 1}`);
          setTimeout(() => setFailoverBanner(null), 5000);
        }
      );

      const assistantMessage: UiMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        modelUsed: result.model.split('/').pop() || result.model,
        timestamp: getFormattedTime()
      };

      const finalMessages = [...currentMessages, assistantMessage];
      const finalizedSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: sessionTitle,
            updatedAt: Date.now(),
            messages: finalMessages
          };
        }
        return s;
      });

      setSessions(finalizedSessions);
      saveSessionsToDisk(finalizedSessions);
    } catch (err: any) {
      const errorMessage: UiMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Terjadi kendala: ${err?.message || 'Gagal menghubungi server OpenRouter.'}. Periksa koneksi internet atau status kunci API di menu samping.`,
        modelUsed: 'Error',
        timestamp: getFormattedTime()
      };

      const withError = [...currentMessages, errorMessage];
      const withErrSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return { ...s, messages: withError };
        }
        return s;
      });
      setSessions(withErrSessions);
      saveSessionsToDisk(withErrSessions);
    } finally {
      setBusy(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Image & Camera
  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin kamera diperlukan untuk mengambil foto chart.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          id: `cam_${Date.now()}`,
          uri: asset.uri,
          type: 'image',
          base64: asset.base64 || undefined,
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'Foto Kamera'
        });
      }
    } catch {
      Alert.alert('Kesalahan', 'Gagal membuka kamera.');
    }
  };

  const handlePickGallery = async () => {
    setShowAttachMenu(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
        base64: true
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVid = asset.type === 'video';
        setAttachment({
          id: `media_${Date.now()}`,
          uri: asset.uri,
          type: isVid ? 'video' : 'image',
          base64: asset.base64 || undefined,
          mimeType: asset.mimeType || (isVid ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || (isVid ? 'Video Terpilih' : 'Screenshot Chart')
        });
      }
    } catch {
      Alert.alert('Kesalahan', 'Gagal memilih media dari galeri.');
    }
  };

  // Copy & Voice Output
  const handleCopyMessage = async (msgId: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedId(msgId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyalin pesan.');
    }
  };

  const handleToggleSpeech = async (msgId: string, text: string) => {
    try {
      if (speakingId === msgId) {
        await Speech.stop();
        setSpeakingId(null);
        return;
      }
      await Speech.stop();
      setSpeakingId(msgId);
      Speech.speak(text.slice(0, 800), {
        language: 'id-ID',
        pitch: 1.0,
        rate: 1.0,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null)
      });
    } catch {
      setSpeakingId(null);
    }
  };

  // Voice Microphone Input Button Handler
  const handleMicPress = () => {
    Haptics.selectionAsync().catch(() => {});
    if (speakingId) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    setIsVoiceRecording((prev) => !prev);
    if (!isVoiceRecording) {
      Alert.alert(
        'Fitur Mikrofon Suara',
        'Perekaman suara aktif. Anda dapat menggunakan keyboard voice typing (ikon mikrofon di keyboard HP) untuk input cepat, atau ketuk tombol speaker pada jawaban NOVA untuk mendengarkan balasan suara.',
        [{ text: 'Mengerti' }]
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Failover Floating Banner */}
      {failoverBanner && (
        <View style={[styles.failoverToast, { top: insets.top + (isLandscape ? 38 : 50) }]}>
          <Text style={styles.failoverToastText}>{failoverBanner}</Text>
        </View>
      )}

      {/* App Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + (isLandscape ? 4 : 8), 10),
            paddingHorizontal: isLandscape ? 24 : 14
          }
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowSidebar(true);
            }}
            style={styles.drawerButton}
          >
            <Text style={styles.drawerIconText}>☰</Text>
          </Pressable>

          <View style={styles.brandTitleCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.brandTitle}>NOVA</Text>
              {isLandscape && (
                <View style={styles.landscapePill}>
                  <Text style={styles.landscapePillText}>16:9 WIDE</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => handleToggleMode(chatMode === 'general' ? 'trading' : 'general')}
              style={[
                styles.modeIndicatorBadge,
                chatMode === 'trading' ? styles.modeBadgeTrading : styles.modeBadgeGeneral
              ]}
            >
              <Text style={styles.modeIndicatorText}>
                {chatMode === 'trading' ? '📈 Neurobro Trading' : '🧠 Asisten Umum'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Quick TradingView Chart Shortcut */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowTradingViewModal(true);
            }}
            style={styles.headerIconButton}
          >
            <Text style={styles.headerIconText}>📊</Text>
          </Pressable>

          {/* Quick Quota Monitor Shortcut */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowQuotaModal(true);
            }}
            style={styles.headerIconButton}
          >
            <Text style={styles.headerIconText}>⚡</Text>
          </Pressable>

          {/* New Chat Button */}
          <Pressable onPress={handleNewChat} style={styles.newChatHeaderButton}>
            <Text style={styles.newChatHeaderText}>+ Baru</Text>
          </Pressable>
        </View>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={[
          styles.chatContent,
          {
            paddingHorizontal: isLandscape ? 24 : 14,
            paddingBottom: 24
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.messageRow, m.role === 'user' ? styles.userRow : styles.assistantRow]}
          >
            {m.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <Text style={styles.assistantAvatarText}>✦</Text>
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                m.role === 'user' ? styles.userBubble : styles.assistantBubble,
                isLandscape && { maxWidth: '75%' }
              ]}
            >
              <View style={styles.bubbleHeaderRow}>
                <Text style={styles.bubbleRoleText}>
                  {m.role === 'user' ? 'Anda' : `NOVA (${m.modelUsed || 'AI'})`}
                </Text>
                <Text style={styles.bubbleTimeText}>{m.timestamp}</Text>
              </View>

              {m.imageUri && (
                <Pressable
                  onPress={() => setPreviewImageUri(m.imageUri || null)}
                  style={styles.bubbleImageContainer}
                >
                  <Image source={{ uri: m.imageUri }} style={styles.bubbleImage} />
                  <View style={styles.imageOverlayBadge}>
                    <Text style={styles.imageOverlayText}>
                      {m.mediaType === 'video' ? '🎥 Video Terlampir' : '🔍 Perbesar Gambar'}
                    </Text>
                  </View>
                </Pressable>
              )}

              <Text
                style={[
                  styles.messageText,
                  m.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}
                selectable
              >
                {m.content}
              </Text>

              {m.role === 'assistant' && (
                <View style={styles.bubbleActionRow}>
                  <Pressable
                    onPress={() => handleToggleSpeech(m.id, m.content)}
                    style={[styles.actionPill, speakingId === m.id && styles.actionPillActive]}
                  >
                    <Text
                      style={[
                        styles.actionPillText,
                        speakingId === m.id && styles.actionPillTextActive
                      ]}
                    >
                      {speakingId === m.id ? '⏹️ Hentikan' : '🔊 Suara'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCopyMessage(m.id, m.content)}
                    style={styles.actionPill}
                  >
                    <Text style={styles.actionPillText}>
                      {copiedId === m.id ? '✓ Tersalin' : '📋 Salin'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}

        {busy && (
          <View style={[styles.thinkingRow, isLandscape && { paddingHorizontal: 12 }]}>
            <View style={styles.assistantAvatar}>
              <Text style={styles.assistantAvatarText}>✦</Text>
            </View>
            <View style={styles.thinkingBubble}>
              <ActivityIndicator color="#818CF8" size="small" />
              <Text style={styles.thinkingText}>NOVA sedang menganalisis chart & pasar…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Composer Input Area with Floating Keyboard Avoidance */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 8 : 0}
      >
        {attachment && (
          <View style={styles.attachmentPreviewBar}>
            <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name || (attachment.type === 'video' ? 'Video' : 'Gambar / Chart')}
              </Text>
              <Text style={styles.attachmentHint}>
                {chatMode === 'trading'
                  ? '📈 Siap dianalisis dengan Pedoman Neurobro'
                  : '🖼️ Siap dianalisis oleh NOVA'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setAttachment(null);
              }}
              style={styles.attachmentRemoveButton}
            >
              <Text style={styles.attachmentRemoveText}>✕</Text>
            </Pressable>
          </View>
        )}

        <View
          style={[
            styles.composerBar,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              paddingHorizontal: isLandscape ? 24 : 10
            }
          ]}
        >
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowAttachMenu(true);
            }}
            style={styles.composerIconButton}
          >
            <Text style={styles.composerIconText}>📷</Text>
          </Pressable>

          <Pressable
            onPress={handleMicPress}
            style={[
              styles.composerIconButton,
              (isVoiceRecording || speakingId) && styles.composerMicActive
            ]}
          >
            <Text style={styles.composerIconText}>🎤</Text>
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            onFocus={() => {
              setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            }}
            placeholder={
              chatMode === 'trading'
                ? 'Ketik "Analisa BTC" atau simbol lain…'
                : 'Ketik pesan untuk NOVA…'
            }
            placeholderTextColor="#64748B"
            multiline
            style={styles.textInput}
          />

          <Pressable
            onPress={send}
            disabled={busy || (!input.trim() && !attachment)}
            style={[
              styles.sendButton,
              (busy || (!input.trim() && !attachment)) && styles.sendButtonDisabled
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendIconText}>➤</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ==================================================================== */}
      {/* SIDEBAR DRAWER (ChatGPT / Claude Style)                              */}
      {/* ==================================================================== */}
      <Modal
        visible={showSidebar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.sidebarBackdrop}>
          <Pressable style={styles.sidebarOutsideOverlay} onPress={() => setShowSidebar(false)} />

          <View
            style={[
              styles.sidebarContent,
              {
                width: isLandscape ? 340 : Math.min(SCREEN_WIDTH * 0.82, 320),
                paddingTop: Math.max(insets.top + 10, 16),
                paddingBottom: Math.max(insets.bottom + 10, 16)
              }
            ]}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrandRow}>
                <View style={styles.sidebarLogoEmblem}>
                  <Text style={styles.sidebarLogoText}>✦</Text>
                </View>
                <Text style={styles.sidebarBrandTitle}>NOVA AGENT</Text>
              </View>
              <Pressable onPress={() => setShowSidebar(false)} style={styles.sidebarCloseButton}>
                <Text style={styles.sidebarCloseText}>✕</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleNewChat} style={styles.sidebarNewChatBtn}>
              <Text style={styles.sidebarNewChatIcon}>+</Text>
              <Text style={styles.sidebarNewChatText}>Obrolan Baru</Text>
            </Pressable>

            <View style={styles.sidebarSectionBox}>
              <Text style={styles.sidebarSectionLabel}>MODE ASISTEN</Text>
              <View style={styles.sidebarModeSwitcher}>
                <Pressable
                  onPress={() => handleToggleMode('general')}
                  style={[
                    styles.sidebarModeItem,
                    chatMode === 'general' && styles.sidebarModeItemActive
                  ]}
                >
                  <Text style={styles.sidebarModeItemIcon}>🧠</Text>
                  <Text
                    style={[
                      styles.sidebarModeItemText,
                      chatMode === 'general' && styles.sidebarModeItemTextActive
                    ]}
                  >
                    Asisten Umum
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleToggleMode('trading')}
                  style={[
                    styles.sidebarModeItem,
                    chatMode === 'trading' && styles.sidebarModeItemActive
                  ]}
                >
                  <Text style={styles.sidebarModeItemIcon}>📈</Text>
                  <Text
                    style={[
                      styles.sidebarModeItemText,
                      chatMode === 'trading' && styles.sidebarModeItemTextActive
                    ]}
                  >
                    Neurobro Trading
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sidebarSectionBox}>
              <Text style={styles.sidebarSectionLabel}>ALAT & ANALISIS OTOMATIS</Text>

              <Pressable
                onPress={() => {
                  setShowSidebar(false);
                  setShowTradingViewModal(true);
                }}
                style={styles.sidebarNavRow}
              >
                <Text style={styles.sidebarNavIcon}>📊</Text>
                <Text style={styles.sidebarNavTitle}>Live Chart & Auto-Analysis (16:9)</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowSidebar(false);
                  setShowTradingSopModal(true);
                }}
                style={styles.sidebarNavRow}
              >
                <Text style={styles.sidebarNavIcon}>📖</Text>
                <Text style={styles.sidebarNavTitle}>Pedoman Trading (SOP)</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowSidebar(false);
                  setShowQuotaModal(true);
                }}
                style={styles.sidebarNavRow}
              >
                <Text style={styles.sidebarNavIcon}>⚡</Text>
                <Text style={styles.sidebarNavTitle}>Status Kuota API Riil</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowSidebar(false);
                  setShowModelPickerModal(true);
                }}
                style={styles.sidebarNavRow}
              >
                <Text style={styles.sidebarNavIcon}>⚙️</Text>
                <Text style={styles.sidebarNavTitle}>Pilihan Model AI ({mode.toUpperCase()})</Text>
              </Pressable>
            </View>

            <View style={styles.sidebarHistoryContainer}>
              <Text style={styles.sidebarSectionLabel}>RIWAYAT OBROLAN</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarHistoryScroll}>
                {sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <View
                      key={s.id}
                      style={[styles.historyItemRow, isActive && styles.historyItemRowActive]}
                    >
                      <Pressable
                        onPress={() => handleSelectSession(s.id)}
                        style={styles.historyItemTextCol}
                      >
                        <View style={styles.historyTitleRow}>
                          <Text style={styles.historyModeIcon}>
                            {s.mode === 'trading' ? '📈' : '💬'}
                          </Text>
                          <Text
                            style={[
                              styles.historyItemTitle,
                              isActive && styles.historyItemTitleActive
                            ]}
                            numberOfLines={1}
                          >
                            {s.title}
                          </Text>
                        </View>
                        <Text style={styles.historyItemCount}>{s.messages.length} pesan</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteSession(s.id)}
                        style={styles.historyDeleteBtn}
                      >
                        <Text style={styles.historyDeleteText}>✕</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarStatusDot} />
              <Text style={styles.sidebarFooterText}>
                Live MCP Engine · Auto Top-Down Active
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* LIVE TRADINGVIEW & AUTO-MARKET DATA MODAL (16:9 Widescreen Aware)    */}
      {/* ==================================================================== */}
      <Modal
        visible={showTradingViewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradingViewModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.tvModalContainer,
              isLandscape && styles.tvModalContainerLandscape,
              { paddingBottom: Math.max(insets.bottom + 10, 16) }
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalHeaderTitle}>Live Chart & Indikator Otomatis</Text>
                  <View style={styles.orientationBadge}>
                    <Text style={styles.orientationBadgeText}>
                      {isLandscape ? '16:9 Widescreen' : '9:16 Tegak'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.modalHeaderSubtitle}>
                  {isLandscape
                    ? 'Mode Widescreen aktif — Tampilan luas multi-timeframe & indikator'
                    : 'Miringkan HP ke posisi horizontal untuk tampilan 16:9 sinematik'}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowTradingViewModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Symbol Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tvSymbolTabs}>
              {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XAUUSDT'].map((sym) => {
                const active = selectedTicker === sym;
                return (
                  <Pressable
                    key={sym}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedTicker(sym);
                    }}
                    style={[styles.tvSymbolTab, active && styles.tvSymbolTabActive]}
                  >
                    <Text style={[styles.tvSymbolTabText, active && styles.tvSymbolTabTextActive]}>
                      {sym.replace('USDT', '/USDT')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Main Content Area (Flexible for 9:16 and 16:9 Landscape) */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.tvScrollArea}>
              <View style={[styles.tvLayoutRow, isLandscape && styles.tvLayoutRowLandscape]}>
                {/* Left/Top Card: Live Ticker & Price */}
                <View style={[styles.tvTickerCard, isLandscape && styles.tvTickerCardLandscape]}>
                  {loadingTopDown ? (
                    <ActivityIndicator color="#818CF8" size="large" style={{ padding: 24 }} />
                  ) : topDownData ? (
                    <View>
                      <View style={styles.tvTickerHeaderRow}>
                        <Text style={styles.tvTickerSymbol}>{topDownData.symbol}</Text>
                        <View
                          style={[
                            styles.tvChangeBadge,
                            topDownData.change24h >= 0
                              ? styles.tvChangeBadgeGreen
                              : styles.tvChangeBadgeRed
                          ]}
                        >
                          <Text style={styles.tvChangeText}>
                            {topDownData.change24h >= 0 ? '+' : ''}
                            {topDownData.change24h.toFixed(2)}%
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.tvPriceBig}>
                        ${topDownData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>

                      <View style={styles.tvStatsGrid}>
                        <View style={styles.tvStatItem}>
                          <Text style={styles.tvStatLabel}>24h High</Text>
                          <Text style={styles.tvStatVal}>${topDownData.high24h.toFixed(2)}</Text>
                        </View>
                        <View style={styles.tvStatItem}>
                          <Text style={styles.tvStatLabel}>24h Low</Text>
                          <Text style={styles.tvStatVal}>${topDownData.low24h.toFixed(2)}</Text>
                        </View>
                        <View style={styles.tvStatItem}>
                          <Text style={styles.tvStatLabel}>24h Volume</Text>
                          <Text style={styles.tvStatVal}>{topDownData.volume24h.toFixed(1)}</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.tvNoDataText}>Memuat data live pasar...</Text>
                  )}
                </View>

                {/* Right/Bottom Card: Multi-Timeframe Matrix (H4, M15, M5 Indicators) */}
                {topDownData && (
                  <View style={[styles.mtfMatrixCard, isLandscape && styles.mtfMatrixCardLandscape]}>
                    <Text style={styles.mtfMatrixTitle}>📊 Indikator Live Terhitung (Real-Time)</Text>
                    <View style={styles.mtfGrid}>
                      <View style={styles.mtfColumn}>
                        <Text style={styles.mtfColHeader}>H4 BIAS</Text>
                        <Text
                          style={[
                            styles.mtfColVal,
                            topDownData.h4.trend === 'BULLISH'
                              ? styles.mtfTrendBull
                              : styles.mtfTrendBear
                          ]}
                        >
                          {topDownData.h4.trend}
                        </Text>
                        <Text style={styles.mtfSubVal}>
                          Close: ${topDownData.h4.lastClose.toFixed(1)}
                        </Text>
                      </View>

                      <View style={styles.mtfColumn}>
                        <Text style={styles.mtfColHeader}>M15 SETUP</Text>
                        <Text style={styles.mtfColVal}>RSI {topDownData.m15.rsi14}</Text>
                        <Text style={styles.mtfSubVal}>Vol {topDownData.m15.volumeRatio}x MA</Text>
                      </View>

                      <View style={styles.mtfColumn}>
                        <Text style={styles.mtfColHeader}>M5 EKSEKUSI</Text>
                        <Text
                          style={[
                            styles.mtfColVal,
                            topDownData.m5.candleType === 'BULLISH_CLOSE'
                              ? styles.mtfTrendBull
                              : styles.mtfTrendBear
                          ]}
                        >
                          {topDownData.m5.candleType.replace('_CLOSE', '')}
                        </Text>
                        <Text style={styles.mtfSubVal}>RSI {topDownData.m5.rsi14}</Text>
                      </View>
                    </View>

                    {topDownData.btcWeather && (
                      <View style={styles.btcWeatherBar}>
                        <Text style={styles.btcWeatherLabel}>Cuaca BTC Indeks:</Text>
                        <Text
                          style={[
                            styles.btcWeatherVal,
                            topDownData.btcWeather.status === 'DUMP_ALERT'
                              ? styles.weatherDump
                              : styles.weatherOk
                          ]}
                        >
                          ${topDownData.btcWeather.price.toFixed(0)} (
                          {topDownData.btcWeather.change24h > 0 ? '+' : ''}
                          {topDownData.btcWeather.change24h.toFixed(2)}%) ·{' '}
                          {topDownData.btcWeather.status === 'DUMP_ALERT'
                            ? 'DUMP TAJAM (Hati-hati Long)'
                            : 'Normal'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* ACTION: Auto-Analyze Live Chart Button (MCP Tooling) */}
              <Pressable
                onPress={() => triggerAutomatedAnalysis(selectedTicker)}
                style={styles.autoAnalyzeBtn}
              >
                <Text style={styles.autoAnalyzeBtnIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoAnalyzeBtnTitle}>
                    Analisis Otomatis {selectedTicker} dengan Neurobro
                  </Text>
                  <Text style={styles.autoAnalyzeBtnSub}>
                    NOVA membaca candlestick H4/M15/M5 & indikator live lalu membuat rencana trading R:R ≥ 1:2
                  </Text>
                </View>
              </Pressable>

              {/* ACTION: Open TradingView Interactive Chart */}
              <Pressable
                onPress={() => {
                  const chartUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${selectedTicker}`;
                  Linking.openURL(chartUrl).catch(() => {
                    Alert.alert('Gagal Membuka', 'Tidak dapat membuka browser.');
                  });
                }}
                style={styles.tvOpenExternalButton}
              >
                <Text style={styles.tvOpenExternalText}>
                  🌐 Buka Chart Interaktif {selectedTicker} di TradingView.com
                </Text>
              </Pressable>

              <View style={styles.tvNoticeBox}>
                <Text style={styles.tvNoticeTitle}>💡 Analisa Otomatis Tanpa Halusinasi</Text>
                <Text style={styles.tvNoticeText}>
                  Seperti fungsi tool MCP TradingView di Antigravity, mesin ini otomatis menarik candlestick live bursa, menghitung RSI 14, Volume MA 20, dan mengecek cuaca BTC secara mekanis tanpa rekayasa data.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* PEDOMAN TRADING NEUROBRO MODAL                                       */}
      {/* ==================================================================== */}
      <Modal
        visible={showTradingSopModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradingSopModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.sopModalContainer,
              isLandscape && styles.sopModalContainerLandscape,
              { paddingBottom: Math.max(insets.bottom + 10, 20) }
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Pedoman & Aturan Trading</Text>
                <Text style={styles.modalHeaderSubtitle}>Metodologi Baku Neurobro & Antigravity</Text>
              </View>
              <Pressable
                onPress={() => setShowTradingSopModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.sopScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>🧠 Pelajaran 1: Filosofi AI Trading</Text>
                <Text style={styles.sopCardText}>
                  • <Text style={styles.sopHighlight}>No Hallucination:</Text> Wajib konfirmasi data chart live. Jika data tidak terlihat, katakan "Tidak tahu".{'\n'}
                  • <Text style={styles.sopHighlight}>Pisahkan Kalkulasi dari Interpretasi:</Text> Fokus membaca aksi harga dan indikator faktual yang terlihat.
                </Text>
              </View>

              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>🔥 Pelajaran 2: Rahasia Dapur Eksekusi</Text>
                <Text style={styles.sopCardText}>
                  • <Text style={styles.sopHighlight}>Hirarki Juara:</Text> Struktur {'>'} Volume {'>'} Momentum. Momentum tanpa konfirmasi Struktur mutlak di-SKIP.{'\n'}
                  • <Text style={styles.sopHighlight}>Long/Short Ratio:</Text> Rasio ekstrem adalah filter skeptis tambahan, BUKAN pemicu open posisi.{'\n'}
                  • <Text style={styles.sopHighlight}>Breakout vs Fakeout:</Text> Tembus hanya dengan wick adalah Liquidity Grab. Wajib tunggu candle close dan retest volume.
                </Text>
              </View>

              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>⚙️ Pelajaran 3: Parameter Indikator Baku</Text>
                <Text style={styles.sopCardText}>
                  • <Text style={styles.sopHighlight}>MACD:</Text> 12 / 26 / 9 (EMA Close) — Wajib candle close.{'\n'}
                  • <Text style={styles.sopHighlight}>RSI:</Text> Length 14 — Dilarang short membabi buta hanya karena RSI {'>'} 70.{'\n'}
                  • <Text style={styles.sopHighlight}>Volume:</Text> MA 20 — Konfirmasi breakout terhadap rata-rata 20 candle.
                </Text>
              </View>

              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>⏱️ Pelajaran 4: Multi-Timeframe (Top-Down)</Text>
                <Text style={styles.sopCardText}>
                  • <Text style={styles.sopHighlight}>H4 (Bias Utama):</Text> Tren makro, S/R mayor, Swing High/Low.{'\n'}
                  • <Text style={styles.sopHighlight}>M15 (Setup):</Text> Area pullback, penembusan, pengujian ulang.{'\n'}
                  • <Text style={styles.sopHighlight}>M5 (Eksekusi):</Text> Validasi struktur kecil & volume.{'\n'}
                  • <Text style={styles.sopHighlight}>M1:</Text> Diabaikan karena terlalu berisik (noise).
                </Text>
              </View>

              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>🛡️ Pelajaran 5: Kritik & Validasi Neurobro</Text>
                <Text style={styles.sopCardText}>
                  • <Text style={styles.sopHighlight}>Matematika R:R:</Text> Minimal 1:2 mutlak. Dilarang memberikan entry dengan rasio di bawah 1:2.{'\n'}
                  • <Text style={styles.sopHighlight}>Fakta vs Narasi:</Text> Dilarang narasi spekulatif. Chart hanya menampilkan reaksi harga mekanis.{'\n'}
                  • <Text style={styles.sopHighlight}>Batas Batal (Invalidasi Close):</Text> Setiap setup wajib memiliki satu harga acuan di mana jika candle close menembus angka tersebut, eksekusi dibatalkan.
                </Text>
              </View>

              <View style={styles.sopCard}>
                <Text style={styles.sopCardHeading}>🔗 Pelajaran 6: Korelasi Pasar (Cuaca BTC)</Text>
                <Text style={styles.sopCardText}>
                  • Bitcoin adalah indeks utama pasar. Algoritma bot mengikat seluruh altcoin ke pergerakan BTC.{'\n'}
                  • <Text style={styles.sopHighlight}>DILARANG KERAS</Text> mengambil setup Long di Altcoin jika BTC sedang breakdown/dump agresif!
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  handleToggleMode('trading');
                  setShowTradingSopModal(false);
                  Alert.alert('Mode Trading Aktif', 'Obrolan ini sekarang mengikuti seluruh aturan baku Neurobro.');
                }}
                style={styles.sopApplyButton}
              >
                <Text style={styles.sopApplyText}>⚡ Terapkan Mode Trading Neurobro untuk Sesi Ini</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* FACTUAL OPENROUTER QUOTA MODAL                                       */}
      {/* ==================================================================== */}
      <Modal
        visible={showQuotaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuotaModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.quotaModalContainer,
              isLandscape && styles.quotaModalContainerLandscape,
              { paddingBottom: Math.max(insets.bottom + 10, 20) }
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Status Kunci & Limit API</Text>
                <Text style={styles.modalHeaderSubtitle}>Data riil langsung dari server OpenRouter</Text>
              </View>
              <Pressable onPress={() => setShowQuotaModal(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.quotaScrollArea}>
              <View style={styles.quotaSettingCard}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.quotaSettingTitle}>Failover Multi-Key Otomatis</Text>
                  <Text style={styles.quotaSettingSubtitle}>
                    Jika satu kunci terkena pembatasan antrean (Rate Limit 429), permintaan otomatis dialihkan ke kunci berikutnya.
                  </Text>
                </View>
                <Switch
                  value={enableFailover}
                  onValueChange={(val) => {
                    Haptics.selectionAsync().catch(() => {});
                    setEnableFailover(val);
                  }}
                  trackColor={{ false: '#1E293B', true: '#4F46E5' }}
                  thumbColor={enableFailover ? '#818CF8' : '#64748B'}
                />
              </View>

              <View style={styles.quotaInfoBox}>
                <Text style={styles.quotaInfoTitle}>ℹ️ Fakta Limit OpenRouter</Text>
                <Text style={styles.quotaInfoBody}>
                  OpenRouter model gratis (:free) tidak memiliki batas waktu 5 jam atau kuota persentase mingguan. Pembatasan terjadi melalui batas kecepatan antrean (Rate Limit HTTP 429) ketika traffic server sedang padat. Sistem 4 kunci NOVA menjaga koneksi Anda tetap aktif tanpa jeda.
                </Text>
              </View>

              <Text style={styles.quotaSectionTitle}>
                4 KUNCI API TERDAFTAR {lastCheckTime ? `(${lastCheckTime})` : ''}
              </Text>

              {OPENROUTER_KEYS.map((k: string, index: number) => {
                const q = keyQuotas[index];
                const isRateLimited = rateLimitedIndices.includes(index);
                const isHealthy = q?.status === 'healthy';
                const isPrimary = activeKeyIndex === index;

                return (
                  <View
                    key={index}
                    style={[
                      styles.keyCard,
                      isPrimary && styles.keyCardPrimary,
                      isRateLimited && styles.keyCardLimited
                    ]}
                  >
                    <View style={styles.keyCardTopRow}>
                      <View style={styles.keyCardTitleRow}>
                        <View
                          style={[
                            styles.statusDot,
                            isRateLimited
                              ? styles.statusDotWarn
                              : isHealthy
                              ? styles.statusDotOk
                              : styles.statusDotErr
                          ]}
                        />
                        <Text style={styles.keyCardLabel}>KUNCI API #{index + 1}</Text>
                        {isPrimary && (
                          <View style={styles.primaryBadge}>
                            <Text style={styles.primaryBadgeText}>AKTIF</Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.keyStatusPill,
                          isRateLimited
                            ? styles.keyStatusPillWarn
                            : isHealthy
                            ? styles.keyStatusPillOk
                            : styles.keyStatusPillErr
                        ]}
                      >
                        {isRateLimited ? '429 LIMIT' : isHealthy ? '200 OK' : 'ERROR'}
                      </Text>
                    </View>

                    <Text style={styles.keyMaskedString}>
                      {q?.maskedKey || `${k.slice(0, 10)}...${k.slice(-6)}`}
                    </Text>

                    <View style={styles.keyMetaRow}>
                      <Text style={styles.keyMetaText}>
                        Tier: <Text style={styles.keyMetaVal}>{q?.isFreeTier ? 'Free Tier' : 'Standar'}</Text>
                      </Text>
                      <Text style={styles.keyMetaText}>
                        Biaya Digunakan: <Text style={styles.keyMetaVal}>${(q?.usage || 0).toFixed(4)}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  fetchQuotas();
                }}
                disabled={loadingQuota}
                style={styles.refreshBtn}
              >
                {loadingQuota ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.refreshBtnText}>🔄 Periksa Status Kunci Sekarang</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Model Picker Modal */}
      <Modal
        visible={showModelPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modelPickerSheet,
              isLandscape && { maxWidth: 500, alignSelf: 'center', width: '90%' },
              { paddingBottom: Math.max(insets.bottom + 10, 20) }
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Pilih Preset Model AI</Text>
                <Text style={styles.modalHeaderSubtitle}>Konfigurasi penalaran dan kecepatan respon</Text>
              </View>
              <Pressable
                onPress={() => setShowModelPickerModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modelOptionsList}>
              {[
                {
                  id: 'max' as AgentMode,
                  title: 'Flagship Reasoning (MAX)',
                  desc: 'Claude Sonnet 3.7 / 3.5 & GPT-6 Astra. Penalaran mendalam, analisis kode kompleks, dan analisis teknikal chart tingkat lanjut.'
                },
                {
                  id: 'fast' as AgentMode,
                  title: 'High-Speed Multimodal (FAST)',
                  desc: 'Gemini 3.8 Flash & GPT-5.6 Luna. Respon kilat untuk percakapan harian, pencarian ide, dan membaca teks gambar cepat.'
                },
                {
                  id: 'auto' as AgentMode,
                  title: 'Dynamic Cascade (AUTO)',
                  desc: 'Otomatis memilih model terbaik berdasarkan kompleksitas tugas dan ketersediaan kuota OpenRouter.'
                }
              ].map((item) => {
                const active = mode === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setMode(item.id);
                      setShowModelPickerModal(false);
                    }}
                    style={[styles.modelOptionCard, active && styles.modelOptionCardActive]}
                  >
                    <View style={styles.modelOptionHeader}>
                      <Text style={[styles.modelOptionTitle, active && styles.modelOptionTitleActive]}>
                        {item.title}
                      </Text>
                      {active && <Text style={styles.modelOptionCheck}>✓ Aktif</Text>}
                    </View>
                    <Text style={styles.modelOptionDesc}>{item.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Attach Menu Sheet */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAttachMenu(false)}>
          <View style={[styles.attachSheet, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
            <Text style={styles.attachSheetTitle}>Lampirkan Media</Text>
            <Text style={styles.attachSheetSubtitle}>
              Pilih tangkapan layar chart trading, dokumen, atau foto
            </Text>

            <View style={styles.attachOptionsRow}>
              <Pressable onPress={handleTakePhoto} style={styles.attachOptionBtn}>
                <Text style={styles.attachOptionIcon}>📷</Text>
                <Text style={styles.attachOptionTitle}>Buka Kamera</Text>
                <Text style={styles.attachOptionSub}>Potret layar chart langsung</Text>
              </Pressable>

              <Pressable onPress={handlePickGallery} style={styles.attachOptionBtn}>
                <Text style={styles.attachOptionIcon}>🖼️</Text>
                <Text style={styles.attachOptionTitle}>Galeri Gambar</Text>
                <Text style={styles.attachOptionSub}>Pilih screenshot dari galeri</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => setShowAttachMenu(false)} style={styles.attachCancelBtn}>
              <Text style={styles.attachCancelText}>Batal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.fullscreenModal}>
          <Pressable onPress={() => setPreviewImageUri(null)} style={styles.fullscreenCloseBtn}>
            <Text style={styles.fullscreenCloseText}>✕ Tutup</Text>
          </Pressable>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES (Clean, Modern, Dark Minimalist Aesthetics with 16:9 Landscape support)
// ============================================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090D14'
  },
  header: {
    paddingBottom: 10,
    backgroundColor: '#0D111A',
    borderBottomWidth: 1,
    borderBottomColor: '#171E2D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  drawerButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#151C2B',
    borderWidth: 1,
    borderColor: '#222D44',
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerIconText: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '600'
  },
  brandTitleCol: {
    justifyContent: 'center'
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1
  },
  landscapePill: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  landscapePillText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800'
  },
  modeIndicatorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start'
  },
  modeBadgeGeneral: {
    backgroundColor: '#1E293B'
  },
  modeBadgeTrading: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#059669'
  },
  modeIndicatorText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#151C2B',
    borderWidth: 1,
    borderColor: '#222D44',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerIconText: {
    fontSize: 15
  },
  newChatHeaderButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  newChatHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    paddingVertical: 12,
    gap: 12
  },
  messageRow: {
    flexDirection: 'row',
    maxWidth: '100%',
    gap: 8
  },
  userRow: {
    justifyContent: 'flex-end'
  },
  assistantRow: {
    justifyContent: 'flex-start'
  },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  assistantAvatarText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '900'
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  userBubble: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderTopRightRadius: 2
  },
  assistantBubble: {
    backgroundColor: '#111724',
    borderWidth: 1,
    borderColor: '#1D263B',
    borderTopLeftRadius: 2
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  bubbleRoleText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700'
  },
  bubbleTimeText: {
    color: '#475569',
    fontSize: 9
  },
  bubbleImageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  bubbleImage: {
    width: '100%',
    height: 180,
    borderRadius: 8
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  imageOverlayText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600'
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20
  },
  userMessageText: {
    color: '#F8FAFC'
  },
  assistantMessageText: {
    color: '#E2E8F0'
  },
  bubbleActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1A2338'
  },
  actionPill: {
    backgroundColor: '#161F33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  actionPillActive: {
    backgroundColor: '#3730A3'
  },
  actionPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600'
  },
  actionPillTextActive: {
    color: '#FFFFFF'
  },
  thinkingRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111724',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  thinkingText: {
    color: '#818CF8',
    fontSize: 12
  },
  attachmentPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131B2B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#202B42'
  },
  attachmentThumb: {
    width: 36,
    height: 36,
    borderRadius: 6
  },
  attachmentInfo: {
    flex: 1
  },
  attachmentName: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700'
  },
  attachmentHint: {
    color: '#34D399',
    fontSize: 10
  },
  attachmentRemoveButton: {
    padding: 6
  },
  attachmentRemoveText: {
    color: '#94A3B8',
    fontSize: 14
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D111A',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#171E2D',
    gap: 6
  },
  composerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#151C2B',
    borderWidth: 1,
    borderColor: '#222D44',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerMicActive: {
    backgroundColor: '#4338CA',
    borderColor: '#6366F1'
  },
  composerIconText: {
    fontSize: 16
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    backgroundColor: '#151C2B',
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13.5,
    borderWidth: 1,
    borderColor: '#222D44'
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.5
  },
  sendIconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  failoverToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center'
  },
  failoverToastText: {
    color: '#ECFDF5',
    fontSize: 11,
    fontWeight: '700'
  },

  // SIDEBAR STYLES
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row'
  },
  sidebarOutsideOverlay: {
    flex: 1
  },
  sidebarContent: {
    backgroundColor: '#0B0F19',
    borderRightWidth: 1,
    borderRightColor: '#1A2234',
    paddingHorizontal: 14,
    flexDirection: 'column'
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sidebarBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sidebarLogoEmblem: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sidebarLogoText: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: 'bold'
  },
  sidebarBrandTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1
  },
  sidebarCloseButton: {
    padding: 6
  },
  sidebarCloseText: {
    color: '#94A3B8',
    fontSize: 16
  },
  sidebarNewChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  sidebarNewChatIcon: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold'
  },
  sidebarNewChatText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700'
  },
  sidebarSectionBox: {
    marginBottom: 14
  },
  sidebarSectionLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  sidebarModeSwitcher: {
    backgroundColor: '#111726',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1D273D',
    flexDirection: 'row'
  },
  sidebarModeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6
  },
  sidebarModeItemActive: {
    backgroundColor: '#1E293B'
  },
  sidebarModeItemIcon: {
    fontSize: 12
  },
  sidebarModeItemText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700'
  },
  sidebarModeItemTextActive: {
    color: '#F8FAFC'
  },
  sidebarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  sidebarNavIcon: {
    fontSize: 14
  },
  sidebarNavTitle: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600'
  },
  sidebarHistoryContainer: {
    flex: 1,
    marginTop: 4
  },
  sidebarHistoryScroll: {
    flex: 1
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2
  },
  historyItemRowActive: {
    backgroundColor: '#151C2C',
    borderWidth: 1,
    borderColor: '#232E47'
  },
  historyItemTextCol: {
    flex: 1
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  historyModeIcon: {
    fontSize: 11
  },
  historyItemTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  historyItemTitleActive: {
    color: '#F8FAFC',
    fontWeight: '700'
  },
  historyItemCount: {
    color: '#475569',
    fontSize: 10,
    marginTop: 2
  },
  historyDeleteBtn: {
    padding: 6
  },
  historyDeleteText: {
    color: '#475569',
    fontSize: 12
  },
  sidebarFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#172033',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sidebarStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  sidebarFooterText: {
    color: '#64748B',
    fontSize: 10
  },

  // COMMON MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800'
  },
  modalHeaderSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  modalCloseButton: {
    padding: 6
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 16
  },

  // PEDOMAN TRADING MODAL
  sopModalContainer: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  sopModalContainerLandscape: {
    maxHeight: '94%',
    maxWidth: 700,
    alignSelf: 'center',
    width: '95%',
    borderRadius: 16
  },
  sopScrollView: {
    marginVertical: 6
  },
  sopCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  sopCardHeading: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6
  },
  sopCardText: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 18
  },
  sopHighlight: {
    color: '#38BDF8',
    fontWeight: '700'
  },
  sopApplyButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  sopApplyText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800'
  },

  // TRADINGVIEW LIVE MODAL (16:9 Landscape aware)
  tvModalContainer: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  tvModalContainerLandscape: {
    maxHeight: '96%',
    maxWidth: 820,
    alignSelf: 'center',
    width: '95%',
    borderRadius: 16
  },
  orientationBadge: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  orientationBadgeText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800'
  },
  tvSymbolTabs: {
    flexDirection: 'row',
    marginBottom: 12
  },
  tvSymbolTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#151C2C',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#222D44'
  },
  tvSymbolTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6'
  },
  tvSymbolTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  tvSymbolTabTextActive: {
    color: '#FFFFFF'
  },
  tvScrollArea: {
    maxHeight: 520
  },
  tvLayoutRow: {
    flexDirection: 'column',
    gap: 10
  },
  tvLayoutRowLandscape: {
    flexDirection: 'row',
    gap: 12
  },
  tvTickerCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14
  },
  tvTickerCardLandscape: {
    flex: 1
  },
  tvTickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tvTickerSymbol: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800'
  },
  tvChangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  tvChangeBadgeGreen: {
    backgroundColor: '#064E3B'
  },
  tvChangeBadgeRed: {
    backgroundColor: '#7F1D1D'
  },
  tvChangeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  tvPriceBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginVertical: 6
  },
  tvStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1A2338',
    paddingTop: 8
  },
  tvStatItem: {
    alignItems: 'center'
  },
  tvStatLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700'
  },
  tvStatVal: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2
  },
  tvNoDataText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    padding: 20
  },

  // MULTI-TIMEFRAME MATRIX CARD
  mtfMatrixCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12
  },
  mtfMatrixCardLandscape: {
    flex: 1.2
  },
  mtfMatrixTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8
  },
  mtfGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  mtfColumn: {
    flex: 1,
    backgroundColor: '#0E1422',
    borderWidth: 1,
    borderColor: '#1E273E',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center'
  },
  mtfColHeader: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 2
  },
  mtfColVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800'
  },
  mtfTrendBull: {
    color: '#34D399'
  },
  mtfTrendBear: {
    color: '#F87171'
  },
  mtfSubVal: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2
  },
  btcWeatherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1222',
    borderWidth: 1,
    borderColor: '#192644',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6
  },
  btcWeatherLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700'
  },
  btcWeatherVal: {
    fontSize: 10,
    fontWeight: '800'
  },
  weatherDump: {
    color: '#EF4444'
  },
  weatherOk: {
    color: '#34D399'
  },

  // AUTO ANALYZE BUTTON
  autoAnalyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#065F46',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10
  },
  autoAnalyzeBtnIcon: {
    fontSize: 22
  },
  autoAnalyzeBtnTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  autoAnalyzeBtnSub: {
    color: '#A7F3D0',
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 2
  },

  tvOpenExternalButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  tvOpenExternalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  tvNoticeBox: {
    backgroundColor: '#101624',
    borderWidth: 1,
    borderColor: '#1B2438',
    borderRadius: 8,
    padding: 12
  },
  tvNoticeTitle: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4
  },
  tvNoticeText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16
  },

  // QUOTA MODAL
  quotaModalContainer: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  quotaModalContainerLandscape: {
    maxHeight: '94%',
    maxWidth: 680,
    alignSelf: 'center',
    width: '95%',
    borderRadius: 16
  },
  quotaScrollArea: {
    marginVertical: 4
  },
  quotaSettingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10
  },
  quotaSettingTitle: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '700'
  },
  quotaSettingSubtitle: {
    color: '#64748B',
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 2
  },
  quotaInfoBox: {
    backgroundColor: '#0B132B',
    borderWidth: 1,
    borderColor: '#1C2E5E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  quotaInfoTitle: {
    color: '#60A5FA',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4
  },
  quotaInfoBody: {
    color: '#93C5FD',
    fontSize: 11,
    lineHeight: 16
  },
  quotaSectionTitle: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  keyCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8
  },
  keyCardPrimary: {
    borderColor: '#3B82F6',
    backgroundColor: '#111A2E'
  },
  keyCardLimited: {
    borderColor: '#F59E0B'
  },
  keyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  keyCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusDotOk: {
    backgroundColor: '#10B981'
  },
  statusDotWarn: {
    backgroundColor: '#F59E0B'
  },
  statusDotErr: {
    backgroundColor: '#EF4444'
  },
  keyCardLabel: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '800'
  },
  primaryBadge: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800'
  },
  keyStatusPill: {
    fontSize: 10,
    fontWeight: '800'
  },
  keyStatusPillOk: {
    color: '#10B981'
  },
  keyStatusPillWarn: {
    color: '#F59E0B'
  },
  keyStatusPillErr: {
    color: '#EF4444'
  },
  keyMaskedString: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 4
  },
  keyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#172033',
    paddingTop: 6,
    marginTop: 4
  },
  keyMetaText: {
    color: '#64748B',
    fontSize: 10.5
  },
  keyMetaVal: {
    color: '#CBD5E1',
    fontWeight: '700'
  },
  refreshBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  refreshBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700'
  },

  // MODEL PICKER
  modelPickerSheet: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  modelOptionsList: {
    gap: 10,
    marginTop: 8
  },
  modelOptionCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12
  },
  modelOptionCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#111A2E'
  },
  modelOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  modelOptionTitle: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700'
  },
  modelOptionTitleActive: {
    color: '#60A5FA'
  },
  modelOptionCheck: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '800'
  },
  modelOptionDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16
  },

  // ATTACH MENU
  attachSheet: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1D263B'
  },
  attachSheetTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800'
  },
  attachSheetSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14
  },
  attachOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  attachOptionBtn: {
    flex: 1,
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center'
  },
  attachOptionIcon: {
    fontSize: 22,
    marginBottom: 6
  },
  attachOptionTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700'
  },
  attachOptionSub: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2
  },
  attachCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  attachCancelText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },

  // FULLSCREEN IMAGE PREVIEW
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  fullscreenCloseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  fullscreenImage: {
    width: '92%',
    height: '75%'
  }
});
