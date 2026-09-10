import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// Types
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

const DEFAULT_B64_KEYS = [
  'c2stb3ItdjEtMjc0YmU4Y2QyMjJkMDIyM2Q2MjE2ZTg1MzZiYjRhZGE3M2M4ZGZmMzI1OWQ3YzczNDQ4N2I4MzkyYTcxNTc1Yg==',
  'c2stb3ItdjEtNmI3MTg2ZTk2ODFjMzQwNGQ1NzY2ODQ5MDc4MjhhM2ZjNzFmNmI5MjgzZmIyMTQ3MGI1YTUwNzVhM2Y2NWY4MQ==',
  'c2stb3ItdjEtMDU1MmIyNDY4OGY3ZDkyZmI4YWY5YTUzMjI0Yjg0ZGZhNWEzOTI5MjE5NzM5YWUxZGMwMmM1OTQxNWI0MmU1Mg==',
  'c2stb3ItdjEtNTFhMmNhOWZmNGI2NDhjZThiNTA4NjUzOTcxOTdhOGUwYTE4ZTNlOTg3ZjBjNzcwOTgwZmNiYzcxZWYxOGY3Nw=='
];

export function getOpenRouterKeys(): string[] {
  try {
    const envKeys = ((import.meta as any).env?.VITE_OPENROUTER_KEYS || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);
    if (envKeys.length > 0) return envKeys;
  } catch {}

  try {
    const saved = localStorage.getItem('@nova_custom_api_keys');
    if (saved) {
      const parsed = saved.split(',').map((k: string) => k.trim()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    return DEFAULT_B64_KEYS.map((b) => atob(b));
  } catch {
    return [];
  }
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
- RSI: Length 14 (SMA 14) — DILARANG short membabi buta hanya karena RSI > 70.
- Volume: MA Length 20 — Konfirmasi validitas breakout dengan membandingkan terhadap rata-rata 20 candle.

## ⏱️ Analisa Multi-Timeframe (Top-Down Approach)
- H4: Arah Utama (Bias Makro, S/R mayor, Swing High/Low).
- M15: Area Setup (Pullback, Penembusan, Pengujian ulang / Retest).
- M5: Konfirmasi Entry (Validasi struktur mikro, lonjakan volume, candle close).
- M1: DIABAIKAN (terlalu noisy).
SOP: H4 (Bias) ➡️ M15 (Setup) ➡️ M5 (Eksekusi). Jika arah timeframe bertentangan, SKIP.

## 🛡️ Kritik Eksekusi & Validasi Neurobro
1. MATEMATIKA R:R (MINIMAL 1:2): Rasio 1:2 adalah batas minimal mutlak. Entry, SL, dan TP wajib mengunci R:R >= 1:2.
2. FAKTA VS NARASI: DILARANG menggunakan narasi spekulatif ("smart money menjebak ritel"). Chart hanya menampilkan reaksi harga mekanis.
3. EKSEKUSI KONDISIONAL: Dilarang order buta full size. Entry wajib kondisional menunggu konfirmasi candle close di M15/M5 dengan volume searah meningkat.
4. STOP LOSS LOGIS: Stop-loss ditempatkan di luar titik invalidasi absolut struktur chart exchange (Binance).
5. CONVICTION CALL & BATAS BATAL: Setiap setup wajib punya SATU panggilan (BUY, SELL, atau HOLD) dan menyertakan angka konkret Batas Batal (Invalidasi Close).

## 🔗 Korelasi Pasar & Cuaca Bitcoin (BTC)
- Hukum Besi Kripto: Bitcoin adalah indeks utama. Algoritma bot mengikat seluruh altcoin ke pergerakan BTC.
- Selalu cek Cuaca BTC sebelum analisa altcoin. DILARANG Long altcoin jika BTC sedang breakdown/dump agresif!`;

// Model chains with auto-cascading free fallback
const TEXT_MODELS: Record<AgentMode, string[]> = {
  max: [
    'openai/gpt-6-astra',
    'anthropic/claude-sonnet-5',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nex-agi/nex-n2.5-pro:free',
    'liquid/lfm-2.5-2.6b:free'
  ],
  fast: [
    'liquid/lfm-2.5-2.6b:free',
    'nex-agi/nex-n2.5-mini:free',
    'google/gemini-3.8-flash',
    'openai/gpt-5.6-luna'
  ],
  auto: [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nex-agi/nex-n2.5-pro:free',
    'anthropic/claude-sonnet-5',
    'openai/gpt-6-astra',
    'liquid/lfm-2.5-2.6b:free'
  ]
};

function getFormattedTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Indicator Calculation
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

// Live MTF Market Data Fetcher
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
      btcWeather = {
        price: parseFloat(btcTicker.lastPrice),
        change24h: change,
        status: change < -3.5 ? 'DUMP_ALERT' : 'NORMAL'
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
        high: h4High,
        low: h4Low,
        trend: h4Close > (h4High + h4Low) / 2 ? 'BULLISH' : 'BEARISH'
      },
      m15: {
        rsi: m15Rsi,
        volRatio: m15VolRatio
      },
      m5: {
        rsi: m5Rsi,
        candle: m5Candle
      },
      btcWeather
    };
  } catch (err) {
    console.error('Error fetching market data:', err);
    return null;
  }
}

export default function App() {
  // Chat Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active Chat State
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentMode>('max');
  const [busy, setBusy] = useState(false);
  const [attachment, setAttachment] = useState<{ uri: string; base64: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Split-Screen Interactive TradingView Widescreen Panel
  const [showChartPanel, setShowChartPanel] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketStats, setMarketStats] = useState<any>(null);

  // Modals
  const [showSopModal, setShowSopModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [quotaData, setQuotaData] = useState<any[]>([]);
  const [loadingQuota, setLoadingQuota] = useState(false);

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
      id: `session_${Date.now()}`,
      title: 'Percakapan Baru',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: 'general',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Halo! Saya **NOVA**, asisten AI otonom mutakhir edisi Web & Laptop. Anda dapat berdiskusi rekayasa kode, logika komprehensif, atau mengaktifkan Mode Trading Neurobro untuk analisis pasar Top-Down real-time.',
          modelUsed: 'Claude Sonnet / GPT-6',
          timestamp: getFormattedTime()
        }
      ]
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([initialSession]));
    localStorage.setItem(ACTIVE_SESSION_KEY, initialSession.id);
  }, []);

  const saveSessions = (updated: ChatSession[], activeId?: string) => {
    setSessions(updated);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    if (activeId) {
      setCurrentSessionId(activeId);
      localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
    }
  };

  // Live Market Stats Updater
  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      const data = await fetchLiveMarketData(selectedSymbol);
      if (mounted) setMarketStats(data);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedSymbol]);

  // Auto Scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // Handle New Chat
  const handleNewChat = () => {
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
          content: chatMode === 'trading'
            ? '📈 **Mode Trading Neurobro Aktif.** Siap menganalisis chart pasar dengan SOP baku: Top-Down MTF (H4 ➡️ M15 ➡️ M5), Konfluensi Struktur > Volume > Momentum, R:R minimal 1:2, dan Validasi Batas Batal.'
            : 'Halo! Saya **NOVA**, asisten AI Anda. Apa yang ingin kita kerjakan hari ini?',
          modelUsed: 'Ready',
          timestamp: getFormattedTime()
        }
      ]
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
    if (!confirm('Hapus sesi obrolan ini?')) return;
    const updated = sessions.filter((s) => s.id !== id);
    if (updated.length === 0) {
      handleNewChat();
      return;
    }
    const nextId = currentSessionId === id ? updated[0].id : currentSessionId;
    saveSessions(updated, nextId);
  };

  // Speech Recognition (Voice Typing in Web Browser)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda belum mendukung Web Speech Recognition. Silakan gunakan Google Chrome atau Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Text to Speech
  const handleToggleTts = (msgId: string, text: string) => {
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setSpeakingId(msgId);
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 800));
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Message
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachment({
        uri: reader.result as string,
        base64,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  // Automated Top-Down Analysis Execution (Web MCP Function)
  const triggerAutoAnalysis = async (symbol: string) => {
    if (chatMode !== 'trading') {
      handleToggleMode('trading');
    }
    setBusy(true);

    const userMessage: UiMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: `⚡ Analisis Otomatis Chart & Indikator ${symbol} (Top-Down MTF H4 ➡️ M15 ➡️ M5)`,
      timestamp: getFormattedTime()
    };

    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    saveSessions(
      sessions.map((s) => (s.id === currentSessionId ? { ...s, title: `Analisa ${symbol}`, mode: 'trading', messages: currentMessages } : s))
    );

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
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        modelUsed: result.model.split('/').pop() || result.model,
        timestamp: getFormattedTime()
      };

      saveSessions(
        sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, assistantMessage] } : s))
      );
    } catch (err: any) {
      const errMessage: UiMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Kendala: ${err?.message || 'Gagal memproses analisis live data.'}`,
        modelUsed: 'Error',
        timestamp: getFormattedTime()
      };
      saveSessions(
        sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, errMessage] } : s))
      );
    } finally {
      setBusy(false);
    }
  };

  // Call OpenRouter
  const callOpenRouter = async (history: UiMessage[], promptText: string, cMode: 'general' | 'trading', aMode: AgentMode, attach?: any) => {
    const models = TEXT_MODELS[aMode] || TEXT_MODELS.auto;
    const formattedHistory = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    let currentContent: any = promptText;
    if (attach?.base64) {
      currentContent = [
        {
          type: 'text',
          text: promptText.trim() || (cMode === 'trading' ? 'Analisis chart ini secara ketat dengan SOP Neurobro.' : 'Analisis gambar ini.')
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${attach.base64}` }
        }
      ];
    }

    const messages = [
      { role: 'system', content: cMode === 'trading' ? NEUROBRO_TRADING_PROMPT : GENERAL_SYSTEM_PROMPT },
      ...formattedHistory,
      { role: 'user', content: currentContent }
    ];

    let lastErr: any = null;
    const activeKeys = getOpenRouterKeys();
    for (const modelCandidate of models) {
      for (const key of activeKeys) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/nova-ai-agent',
              'X-Title': 'NOVA Web'
            },
            body: JSON.stringify({
              model: modelCandidate,
              temperature: cMode === 'trading' ? 0.15 : 0.4,
              max_tokens: 2500,
              messages
            })
          });

          if (!res.ok) {
            // 402 = Insufficient credits on paid model, 429 = Rate limit, 404 = Model offline, 401 = Key error
            if ([400, 401, 402, 404, 429].includes(res.status)) continue;
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return {
              content: reply,
              model: data.model || modelCandidate
            };
          }
        } catch (e) {
          lastErr = e;
        }
      }
    }
    throw lastErr || new Error('Gagal menghubungi OpenRouter.');
  };

  // Send Message
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    if (busy) return;

    // Check if user is asking to analyze a symbol in trading mode
    const match = trimmed.toUpperCase().match(/\b(BTC|ETH|SOL|BNB|XAU|EUR)(USDT)?\b/);
    if (chatMode === 'trading' && match && !attachment) {
      const sym = match[1] === 'EUR' ? 'EURUSDT' : `${match[1]}USDT`;
      setInput('');
      await triggerAutoAnalysis(sym);
      return;
    }

    setBusy(true);
    const userMessage: UiMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      imageUri: attachment?.uri,
      timestamp: getFormattedTime()
    };

    const currentMessages = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
    const sessionTitle = activeSession?.title === 'Percakapan Baru' ? (trimmed || 'Analisis Media').slice(0, 30) : activeSession?.title || 'Obrolan';

    saveSessions(
      sessions.map((s) => (s.id === currentSessionId ? { ...s, title: sessionTitle, messages: currentMessages } : s))
    );

    const currentAttachment = attachment;
    setInput('');
    setAttachment(null);

    try {
      const result = await callOpenRouter(currentMessages, trimmed, chatMode, mode, currentAttachment);
      const assistantMessage: UiMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: result.content,
        modelUsed: result.model.split('/').pop() || result.model,
        timestamp: getFormattedTime()
      };

      saveSessions(
        sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, assistantMessage] } : s))
      );
    } catch (err: any) {
      const errMessage: UiMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Kendala: ${err?.message || 'Gagal menghubungi server OpenRouter.'}`,
        modelUsed: 'Error',
        timestamp: getFormattedTime()
      };
      saveSessions(
        sessions.map((s) => (s.id === currentSessionId ? { ...s, messages: [...currentMessages, errMessage] } : s))
      );
    } finally {
      setBusy(false);
    }
  };

  // Quotas Fetcher
  const loadQuotas = async () => {
    setLoadingQuota(true);
    setShowQuotaModal(true);
    try {
      const results = await Promise.all(
        getOpenRouterKeys().map(async (k: string) => {
          const masked = `${k.slice(0, 10)}...${k.slice(-6)}`;
          try {
            const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
              headers: { 'Authorization': `Bearer ${k}` }
            });
            const json = await res.json();
            if (!res.ok) return { masked, status: res.status === 429 ? 'LIMIT 429' : 'ERROR', usage: 0, free: false };
            const d = json.data || {};
            return {
              masked: d.label || masked,
              status: '200 OK',
              usage: Number(d.usage || 0),
              free: Boolean(d.is_free_tier)
            };
          } catch {
            return { masked, status: 'ERROR', usage: 0, free: false };
          }
        })
      );
      setQuotaData(results);
    } finally {
      setLoadingQuota(false);
    }
  };

  return (
    <div className="app-shell">
      {/* ==================================================================== */}
      {/* SIDEBAR                                                              */}
      {/* ==================================================================== */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="brand-logo-group">
            <div className="brand-emblem">✦</div>
            <div className="brand-text">NOVA AGENT</div>
            <span className="brand-version">WEB</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <span>+</span> Obrolan Baru
        </button>

        <div className="sidebar-section-title">Mode Asisten</div>
        <div className="mode-switcher-capsule">
          <button
            className={`mode-switcher-tab ${chatMode === 'general' ? 'active' : ''}`}
            onClick={() => handleToggleMode('general')}
          >
            🧠 Umum
          </button>
          <button
            className={`mode-switcher-tab ${chatMode === 'trading' ? 'trading-active' : ''}`}
            onClick={() => handleToggleMode('trading')}
          >
            📈 Neurobro
          </button>
        </div>

        <div className="sidebar-section-title">Alat & Pasar</div>
        <div className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${showChartPanel ? 'active' : ''}`}
            onClick={() => setShowChartPanel(!showChartPanel)}
          >
            📊 {showChartPanel ? 'Sembunyikan Chart' : 'Buka Live TradingView'}
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowSopModal(true)}>
            📖 Pedoman Trading (SOP)
          </button>
          <button className="sidebar-nav-item" onClick={loadQuotas}>
            ⚡ Status Kuota API Riil
          </button>
          <button className="sidebar-nav-item" onClick={() => setShowModelModal(true)}>
            ⚙️ Model AI ({mode.toUpperCase()})
          </button>
        </div>

        <div className="sidebar-section-title">Riwayat Obrolan</div>
        <div className="history-scroll-area">
          {sessions.map((s) => {
            const isActive = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                className={`history-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentSessionId(s.id);
                  setSidebarOpen(false);
                }}
              >
                <div className="history-item-left">
                  <div className="history-item-title">
                    {s.mode === 'trading' ? '📈 ' : '💬 '}{s.title}
                  </div>
                  <div className="history-item-meta">{s.messages.length} pesan</div>
                </div>
                <button
                  className="history-delete-btn"
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  title="Hapus obrolan"
                >
                  ✕
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
        {/* Header */}
        <header className="main-header">
          <div className="main-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div
              className={`header-mode-badge ${chatMode}`}
              onClick={() => handleToggleMode(chatMode === 'general' ? 'trading' : 'general')}
            >
              {chatMode === 'trading' ? '📈 Mode Trading Neurobro (Aktif)' : '🧠 Asisten AI Umum'}
            </div>
          </div>

          <div className="main-header-right">
            <button
              className={`header-btn ${showChartPanel ? 'active-chart' : ''}`}
              onClick={() => setShowChartPanel(!showChartPanel)}
              title="Toggle Widescreen 16:9 Live Chart"
            >
              📊 {showChartPanel ? 'Tutup Chart' : 'TradingView (16:9)'}
            </button>
            <button className="header-btn" onClick={loadQuotas}>
              ⚡ Kuota
            </button>
            <button className="header-btn" onClick={() => setShowSopModal(true)}>
              📖 SOP
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="chat-stream-container" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`message-row ${m.role}`}>
              {m.role === 'assistant' && (
                <div className="assistant-avatar-circle">✦</div>
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

                <div className="message-body">{m.content}</div>

                {m.role === 'assistant' && (
                  <div className="message-actions-row">
                    <button
                      className={`message-action-pill ${speakingId === m.id ? 'active' : ''}`}
                      onClick={() => handleToggleTts(m.id, m.content)}
                    >
                      {speakingId === m.id ? '⏹️ Stop' : '🔊 Suara'}
                    </button>
                    <button
                      className="message-action-pill"
                      onClick={() => handleCopy(m.id, m.content)}
                    >
                      {copiedId === m.id ? '✓ Tersalin' : '📋 Salin'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="thinking-container">
              <div className="assistant-avatar-circle">✦</div>
              <div className="thinking-pill">
                <div className="spinner" />
                <span>NOVA sedang menganalisa pasar & data live…</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Composer */}
        <footer className="composer-dock">
          {attachment && (
            <div className="attachment-preview-capsule">
              <img src={attachment.uri} alt="Thumb" className="attachment-thumb" />
              <div className="attachment-info">
                <div className="attachment-name">{attachment.name}</div>
                <div className="attachment-hint">
                  {chatMode === 'trading' ? '📈 Siap dianalisis dengan SOP Neurobro' : 'Siap dianalisis oleh NOVA'}
                </div>
              </div>
              <button className="attachment-close-btn" onClick={() => setAttachment(null)}>✕</button>
            </div>
          )}

          <div className="composer-box">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />

            <button
              className="composer-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah Gambar / Chart"
            >
              📷
            </button>

            <button
              className={`composer-icon-btn ${isListening ? 'active-mic' : ''}`}
              onClick={handleToggleVoiceInput}
              title="Input Suara (Web Speech)"
            >
              🎤
            </button>

            <textarea
              className="composer-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                chatMode === 'trading'
                  ? 'Ketik "Analisa BTC" atau tanyakan setup… (Enter kirim)'
                  : 'Ketik pesan untuk NOVA… (Enter kirim, Shift+Enter baris baru)'
              }
              rows={1}
            />

            <button
              className="composer-send-btn"
              onClick={handleSend}
              disabled={busy || (!input.trim() && !attachment)}
            >
              ➤
            </button>
          </div>
        </footer>
      </main>

      {/* ==================================================================== */}
      {/* REAL INTERACTIVE TRADINGVIEW 16:9 WIDESCREEN PANEL                   */}
      {/* ==================================================================== */}
      {showChartPanel && (
        <aside className="trading-panel animate-fade-in">
          <div className="trading-panel-header">
            <div className="trading-panel-title">
              <span>📈</span> Live TradingView (16:9 Widescreen)
            </div>
            <button className="modal-close-btn" onClick={() => setShowChartPanel(false)}>✕</button>
          </div>

          {/* Symbol Selectors */}
          <div className="symbol-tab-bar">
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XAUUSDT'].map((sym) => (
              <button
                key={sym}
                className={`symbol-tab ${selectedSymbol === sym ? 'active' : ''}`}
                onClick={() => setSelectedSymbol(sym)}
              >
                {sym.replace('USDT', '/USDT')}
              </button>
            ))}
          </div>

          {/* Real Interactive TradingView Iframe Widget */}
          <div className="tv-iframe-wrapper">
            <iframe
              title="TradingView Interactive Widget"
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=BINANCE:${selectedSymbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0D111A&studies=%5B%5D&theme=dark&style=1&timezone=Asia%2FJakarta`}
            />
          </div>

          {/* Real-Time MTF Dashboard below Chart */}
          <div className="mtf-dashboard-section">
            {marketStats && (
              <div className="mtf-stats-grid">
                <div className="mtf-card-box">
                  <div className="mtf-card-label">H4 Trend</div>
                  <div className={`mtf-card-val ${marketStats.h4.trend === 'BULLISH' ? 'bull' : 'bear'}`}>
                    {marketStats.h4.trend}
                  </div>
                </div>

                <div className="mtf-card-box">
                  <div className="mtf-card-label">M15 RSI (14)</div>
                  <div className="mtf-card-val">{marketStats.m15.rsi}</div>
                </div>

                <div className="mtf-card-box">
                  <div className="mtf-card-label">M5 Candle</div>
                  <div className={`mtf-card-val ${marketStats.m5.candle === 'BULLISH' ? 'bull' : 'bear'}`}>
                    {marketStats.m5.candle}
                  </div>
                </div>
              </div>
            )}

            {/* 1-Click Auto-Analysis (MCP Tooling) */}
            <button
              className="auto-analyze-hero-btn"
              onClick={() => triggerAutoAnalysis(selectedSymbol)}
              disabled={busy}
            >
              <span className="auto-analyze-icon">⚡</span>
              <div>
                <div className="auto-analyze-title">Analisis Otomatis {selectedSymbol}</div>
                <div className="auto-analyze-sub">
                  Tarik data live bursa & jalankan analisa Neurobro (R:R ≥ 1:2)
                </div>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PEDOMAN TRADING SOP                                           */}
      {/* ==================================================================== */}
      {showSopModal && (
        <div className="modal-overlay" onClick={() => setShowSopModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Pedoman & Aturan Trading Neurobro</div>
                <div className="modal-subtitle">Buku pedoman baku dari AI YM_Trading</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSopModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="sop-card-item">
                <div className="sop-card-title">🧠 Pelajaran 1: Filosofi AI Trading</div>
                <div className="sop-card-content">
                  • <strong>No Hallucination:</strong> Wajib konfirmasi data chart live. Jika data tidak terlihat, bilang "Tidak tahu".<br />
                  • <strong>Pisahkan Kalkulasi dari Interpretasi:</strong> Fokus membaca aksi harga dan indikator faktual yang terlihat.
                </div>
              </div>

              <div className="sop-card-item">
                <div className="sop-card-title">🔥 Pelajaran 2: Rahasia Dapur Eksekusi</div>
                <div className="sop-card-content">
                  • <strong>Hirarki Juara:</strong> Struktur {'>'} Volume {'>'} Momentum. Momentum tanpa konfirmasi Struktur mutlak di-SKIP.<br />
                  • <strong>Long/Short Ratio:</strong> Rasio ekstrem adalah filter skeptis tambahan, BUKAN pemicu open posisi.<br />
                  • <strong>Breakout vs Fakeout:</strong> Tembus hanya dengan wick adalah Liquidity Grab. Wajib tunggu candle close dan retest volume.
                </div>
              </div>

              <div className="sop-card-item">
                <div className="sop-card-title">⚙️ Pelajaran 3: Parameter Indikator Baku</div>
                <div className="sop-card-content">
                  • <strong>MACD:</strong> 12 / 26 / 9 (EMA Close) — Wajib candle close.<br />
                  • <strong>RSI:</strong> Length 14 — Dilarang short membabi buta hanya karena RSI {'>'} 70.<br />
                  • <strong>Volume:</strong> MA 20 — Konfirmasi breakout terhadap rata-rata 20 candle.
                </div>
              </div>

              <div className="sop-card-item">
                <div className="sop-card-title">⏱️ Pelajaran 4: Multi-Timeframe (Top-Down)</div>
                <div className="sop-card-content">
                  • <strong>H4 (Bias Utama):</strong> Tren makro, S/R mayor, Swing High/Low.<br />
                  • <strong>M15 (Setup):</strong> Area pullback, penembusan, pengujian ulang.<br />
                  • <strong>M5 (Eksekusi):</strong> Validasi struktur kecil & volume.<br />
                  • <strong>M1:</strong> Diabaikan karena terlalu berisik (noise).
                </div>
              </div>

              <div className="sop-card-item">
                <div className="sop-card-title">🛡️ Pelajaran 5: Kritik & Validasi Neurobro</div>
                <div className="sop-card-content">
                  • <strong>Matematika R:R:</strong> Minimal 1:2 mutlak. Dilarang memberikan entry dengan rasio di bawah 1:2.<br />
                  • <strong>Fakta vs Narasi:</strong> Dilarang narasi spekulatif ("smart money menjebak ritel"). Chart hanya menampilkan reaksi harga mekanis.<br />
                  • <strong>Batas Batal (Invalidasi Close):</strong> Setiap setup wajib memiliki satu harga acuan di mana jika candle close menembus angka tersebut, eksekusi dibatalkan.
                </div>
              </div>

              <div className="sop-card-item">
                <div className="sop-card-title">🔗 Pelajaran 6: Korelasi Pasar (Cuaca BTC)</div>
                <div className="sop-card-content">
                  • Bitcoin adalah indeks utama pasar. Algoritma bot mengikat seluruh altcoin ke pergerakan BTC.<br />
                  • <strong>DILARANG KERAS</strong> mengambil setup Long di Altcoin jika BTC sedang breakdown/dump agresif!
                </div>
              </div>

              <button
                className="new-chat-btn"
                style={{ backgroundColor: '#059669', marginTop: 10 }}
                onClick={() => {
                  handleToggleMode('trading');
                  setShowSopModal(false);
                }}
              >
                ⚡ Terapkan Mode Trading Neurobro untuk Sesi Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: HONEST QUOTAS                                                 */}
      {/* ==================================================================== */}
      {showQuotaModal && (
        <div className="modal-overlay" onClick={() => setShowQuotaModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Status Kuota & Limit OpenRouter Riil</div>
                <div className="modal-subtitle">100% Data faktual dari server resmi tanpa angka buatan</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowQuotaModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="sop-card-item" style={{ background: '#0B132B', borderColor: '#1C2E5E' }}>
                <div style={{ color: '#60A5FA', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
                  ℹ️ Fakta Limit OpenRouter
                </div>
                <div style={{ color: '#93C5FD', fontSize: 11.5, lineHeight: 1.6 }}>
                  OpenRouter model gratis (:free) tidak memiliki batas waktu 5 jam atau kuota persentase mingguan. Pembatasan terjadi melalui batas kecepatan antrean (Rate Limit HTTP 429) ketika traffic server sedang padat. Sistem 4 kunci NOVA menjaga koneksi Anda tetap aktif tanpa jeda.
                </div>
              </div>

              {loadingQuota ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#818CF8' }}>
                  Memeriksa kesehatan kunci API langsung ke server...
                </div>
              ) : (
                quotaData.map((q, idx) => (
                  <div key={idx} className={`quota-key-box ${q.status === '200 OK' ? 'active' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>KUNCI API #{idx + 1}</span>
                      <span style={{ color: q.status === '200 OK' ? '#10B981' : '#EF4444', fontWeight: 800, fontSize: 12 }}>
                        {q.status}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                      {q.masked}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      Tier: <strong>{q.free ? 'Free Tier (Gratis)' : 'Standar'}</strong> · Pemakaian: <strong>${q.usage.toFixed(4)}</strong>
                    </div>
                  </div>
                ))
              )}

              <button className="new-chat-btn" onClick={loadQuotas} style={{ marginTop: 8 }}>
                🔄 Segarkan Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MODEL PRESET                                                  */}
      {/* ==================================================================== */}
      {showModelModal && (
        <div className="modal-overlay" onClick={() => setShowModelModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Pilih Preset Model AI</div>
                <div className="modal-subtitle">Pilih arsitektur penalaran yang Anda inginkan</div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModelModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {[
                { id: 'max' as AgentMode, title: 'Flagship Reasoning (MAX)', desc: 'Claude Sonnet 3.7 / 3.5 & GPT-6 Astra. Penalaran mendalam & analisis teknikal chart tingkat lanjut.' },
                { id: 'fast' as AgentMode, title: 'High-Speed Multimodal (FAST)', desc: 'Gemini 3.8 Flash & GPT-5.6 Luna. Respon kilat untuk percakapan harian dan membaca gambar.' },
                { id: 'auto' as AgentMode, title: 'Dynamic Cascade (AUTO)', desc: 'Otomatis memilih model terbaik berdasarkan ketersediaan server.' }
              ].map((item) => (
                <div
                  key={item.id}
                  className={`quota-key-box ${mode === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setMode(item.id);
                    setShowModelModal(false);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: mode === item.id ? '#60A5FA' : '#F8FAFC' }}>
                    {item.title} {mode === item.id && '✓'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
