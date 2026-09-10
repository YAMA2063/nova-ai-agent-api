import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
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

const OPENROUTER_KEYS = (
  process.env.EXPO_PUBLIC_OPENROUTER_KEYS || ''
).split(',').map((k: string) => k.trim()).filter(Boolean);

// ============================================================================
// LIVE QUOTA & LIMIT MONITOR INFRASTRUCTURE
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

// Circular progress ring component matching the user's reference visual
export function CircularMeter({
  percent,
  size = 36,
  stroke = 3.5,
  color
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const ringColor =
    color || (safePercent >= 50 ? '#10B981' : safePercent >= 20 ? '#F59E0B' : '#EF4444');

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: '#1E293B',
          position: 'absolute'
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: ringColor,
          borderTopColor: ringColor,
          borderRightColor: safePercent >= 25 ? ringColor : 'transparent',
          borderBottomColor: safePercent >= 50 ? ringColor : 'transparent',
          borderLeftColor: safePercent >= 75 ? ringColor : 'transparent',
          transform: [{ rotateZ: '-45deg' }]
        }}
      />
    </View>
  );
}

// ============================================================================
// OMNI-MODAL MODEL CHAINS (All OpenRouter Modalities Supported)
// ============================================================================

// 1. Text & Code Reasoning Chains (Flagship OpenAI GPT-6 + Anthropic Claude)
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

// 2. Image & Trading Chart Multimodal Chains (Visual Cognitive Powerhouse)
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

// 3. Video Multimodal Chains (Sequential Frames & Video Action Analysis)
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

// 4. Dedicated Audio Transcription, Speech & Memory Reference Registry
export const MODALITY_REGISTRY = {
  transcription: 'openai/whisper-large-v3',
  speech: 'openai/tts-1-hd',
  embeddings: 'openai/text-embedding-3-large',
  rerank: 'cohere/rerank-v3'
};

// ============================================================================
// MASTER SYSTEM PROMPT — ANTHROPIC CLAUDE ALIGNED ARCHITECTURE FOR NOVA
// ============================================================================
const SYSTEM_PROMPT = `# NOVA — Core Operating Directive

## Identity
Kamu adalah NOVA, agen AI otonom untuk pengambilan keputusan, analisis finansial & chart trading, rekayasa kode, dan penalaran visual mutakhir.
Kamu bukan asisten yang sekadar menyenangkan orang — kamu adalah alat pengambilan keputusan yang akurat, presisi, dan objektif.

## Epistemic Rules (Kejujuran Intelektual)
1. Jika confidence < tinggi, nyatakan eksplisit: "Ini estimasi/dugaan, bukan kepastian" atau "Data pada gambar/konteks tidak cukup untuk klaim ini."
2. Jangan pernah mengarang angka, sumber, atau data yang tidak bisa diverifikasi dari konteks atau chart yang diberikan.
3. Jika user memberi premis yang salah secara faktual atau teknikal, koreksi dulu sebelum melanjutkan — jangan diam-diam menerima premis keliru itu.

## Anti-Sycophancy Rules
1. Jangan setuju dengan user hanya karena mereka terdengar yakin.
2. Jika rencana/strategi/posisi trading user punya risiko atau cacat logika, sampaikan secara langsung dengan alasan konkret — bukan basa-basi pujian dulu.
3. Prioritaskan kebenaran objektif di atas kenyamanan percakapan.

## Extended Thinking & Internal Scratchpad
Sebelum menghasilkan output final, kerjakan penalaran internal:
1. Apa yang sebenarnya ditanyakan/dibutuhkan user?
2. Asumsi apa yang dibuat, dan apakah valid berdasarkan bukti visual/fakta?
3. Langkah solusi, dicek ulang untuk kontradiksi atau risiko tersembunyi.
4. Rumuskan output final yang ringkas, berbobot, dan terstruktur.

## Task Execution Protocol
Untuk tugas multi-langkah:
1. PLAN — uraikan langkah sebelum eksekusi.
2. VERIFY — cek asumsi kritis sebelum lanjut ke langkah berikutnya.
3. EXECUTE — jalankan instruksi dengan standar tertinggi.
4. REPORT — laporkan hasil + confidence level + risiko yang belum tertangani.

## Protokol Analisis Chart Trading (SMC & Price Action)
Ketika diberikan chart trading (Crypto, Forex, Saham):
1. ASSET & TIMEFRAME — Identifikasi simbol dan timeframe (HTF bias sebelum LTF).
2. MARKET STRUCTURE — Tandai swing high/low, deteksi BOS (Break of Structure = konfirmasi kelanjutan tren) vs CHoCH (Change of Character = potensi pembalikan arah).
3. ORDER BLOCK (OB) — Candle terakhir sebelum pergerakan impulsif yang membentuk BOS; zona minat institusional (dugaan, bukan fakta mutlak).
4. FAIR VALUE GAP (FVG) — Celah antara candle 1 dan 3 dalam pergerakan 3-candle, menandakan inefisiensi harga yang berpotensi diisi ulang.
5. LIQUIDITY ZONES — Area di atas/bawah swing high/low tempat stop-loss terkumpul, sering menjadi target sapuan likuiditas (*liquidity sweep*).
6. RENCANA TRADING TERUKUR:
   - Bias: [Bullish / Bearish / Sideways]
   - Entry: [Di zona OB / FVG yang konfluens dengan struktur]
   - Stop Loss (SL): [Di luar swing terdekat + buffer, dengan alasan teknikal]
   - Take Profit (TP): [TP1, TP2, TP3 berdasarkan target likuiditas/struktur berikutnya]
   - Risk-to-Reward Ratio (RRR): [Hitung eksplisit, minimal 1:2]
   - Risk Disclaimer: Sertakan catatan risiko bahwa analisis teknikal bersifat probabilistik.

## Communication Style & Tone
- Tidak ada kalimat pembuka basa-basi ("Tentu!", "Pertanyaan bagus!", dsb). Langsung masuk ke substansi.
- Struktur jawaban: kesimpulan/rekomendasi dulu, alasan/detail menyusul.
- Gunakan pemformatan terstruktur (heading, bullet, tabel, blok kode) secara proporsional.
- Bahasa: Responlah secara natural, cerdas, dan profesional dalam Bahasa Indonesia (atau bahasa yang digunakan user).

## Hard Boundaries
- Tidak memberi kepastian mutlak pada hal yang inheren probabilistik (pasar finansial, prediksi masa depan).
- Tidak berpura-pura memiliki data real-time jika tidak terhubung langsung ke sumber live feed.`;

function getFormattedTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function callOpenRouterDirectly(
  history: UiMessage[],
  prompt: string,
  mode: AgentMode,
  attachment?: Attachment | null,
  onFailover?: (failedIndex: number, nextIndex: number, reason: string) => void
) {
  const isVideo = attachment?.type === 'video';
  const isImage = attachment?.type === 'image' && Boolean(attachment?.base64);

  // Pick appropriate model cascade based on modality
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
        content: `[Lampiran Media Sebelumnya]: ${m.content}`
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
        text: prompt.trim() || 'Analisis chart/gambar ini secara mendalam mengikuti protokol SMC dan struktur pasar.'
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:${mime};base64,${attachment.base64}`
        }
      }
    ];
  } else if (isVideo) {
    currentContent = `[Video Terlampir: ${attachment?.name || 'Rekaman Video'}]: ${prompt.trim() || 'Analisis urutan kejadian dan informasi visual dalam rekaman video ini.'}`;
  }

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...formattedHistory,
    { role: 'user' as const, content: currentContent }
  ];

  let lastError: Error | null = null;

  // Try each API key in failover sequence
  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    const key = OPENROUTER_KEYS[i];
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/nova-ai-agent',
          'X-Title': 'NOVA Mobile Omni-Modal'
        },
        body: JSON.stringify({
          model: models[0],
          models: models.slice(0, 3),
          temperature: 0.2,
          max_tokens: 2048,
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

export default function Home() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya **NOVA**, agen AI otonom multimodal. Saya siap membantu pengambilan keputusan, analisis chart trading SMC, evaluasi visual/video, dan penalaran teknikal dengan standar penalaran presisi.',
      modelUsed: 'System Ready',
      timestamp: getFormattedTime()
    }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentMode>('max');
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('ONLINE · 4-KEY FAILOVER');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Real-Time Quota & Limit Monitor State
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [keyQuotas, setKeyQuotas] = useState<KeyQuotaInfo[]>([]);
  const [enableFailover, setEnableFailover] = useState(true);
  const [rateLimitedIndices, setRateLimitedIndices] = useState<number[]>([]);
  const [activeKeyIndex, setActiveKeyIndex] = useState(2); // Key 3 (index 2) is primary active
  const [lastCheckTime, setLastCheckTime] = useState('');
  const [failoverBanner, setFailoverBanner] = useState<string | null>(null);

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

  const quickPrompts = [
    { icon: '📈', label: 'Analisis Chart Trading (SMC)', text: 'Analisis chart trading ini secara komprehensif: tentukan Timeframe, Market Structure (BOS/CHoCH), Order Block (OB), Fair Value Gap (FVG), Liquidity Pools, dan Rencana Trading lengkap (Bias, Entry, SL, TP, RRR).' },
    { icon: '📸', label: 'Inspeksi & Baca Foto', text: 'Analisis gambar ini secara mendalam, baca seluruh detail, tabel, atau teks yang tertera dengan akurat.' },
    { icon: '💻', label: 'Bantu Coding & Debug', text: 'Tuliskan solusi kode yang optimal, aman, dan jelaskan arsitektur logikanya:' },
    { icon: '💡', label: 'Rencana Strategi Bisnis', text: 'Bantu rancang strategi eksekusi komprehensif langkah demi langkah untuk tujuan ini:' }
  ];

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
      Haptics.selectionAsync().catch(() => {});

      // Strip markdown syntax for natural reading
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Kode terlampir pada layar.')
        .replace(/[#*_~`>-]/g, '')
        .trim();

      Speech.speak(cleanText, {
        language: 'id-ID',
        rate: 1.0,
        pitch: 1.0,
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
        onError: () => setSpeakingId(null)
      });
    } catch {
      setSpeakingId(null);
    }
  };

  const handlePickGallery = async () => {
    setShowAttachMenu(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Galeri Diperlukan', 'Izinkan akses galeri agar NOVA dapat membaca media Anda.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        setAttachment({
          id: Date.now().toString(),
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          base64: isVideo ? undefined : (asset.base64 || undefined),
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          name: asset.fileName || (isVideo ? 'Video Terlampir' : 'Foto Galeri')
        });
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      Alert.alert('Error', 'Gagal memuat media dari galeri.');
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachMenu(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera Diperlukan', 'Izinkan akses kamera agar NOVA dapat mengambil foto langsung.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setAttachment({
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'image',
          base64: asset.base64 || undefined,
          mimeType: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'Foto Kamera'
        });
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      Alert.alert('Error', 'Gagal membuka kamera.');
    }
  };

  const handleResetChat = () => {
    Alert.alert(
      'Reset Percakapan',
      'Apakah Anda ingin membersihkan seluruh riwayat obrolan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bersihkan',
          style: 'destructive',
          onPress: () => {
            Speech.stop().catch(() => {});
            setSpeakingId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            setMessages([
              {
                id: `welcome-${Date.now()}`,
                role: 'assistant',
                content: 'Riwayat obrolan telah dibersihkan. Apa yang ingin kita analisis selanjutnya?',
                modelUsed: 'System Ready',
                timestamp: getFormattedTime()
              }
            ]);
            setAttachment(null);
            setStatusText('ONLINE · 4-KEY FAILOVER');
          }
        }
      ]
    );
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachment) || busy) return;

    Haptics.selectionAsync().catch(() => {});
    const currentAttachment = attachment;
    const currentText = text || (currentAttachment ? (currentAttachment.type === 'video' ? 'Analisis video ini' : 'Analisis chart/gambar ini') : '');

    setInput('');
    setAttachment(null);

    const userMessageId = `u-${Date.now()}`;
    const newMessages: UiMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: currentText,
        imageUri: currentAttachment?.uri,
        mediaType: currentAttachment?.type,
        timestamp: getFormattedTime()
      }
    ];

    setMessages(newMessages);
    setBusy(true);
    setStatusText(
      currentAttachment
        ? currentAttachment.type === 'video'
          ? 'Memproses Video Multimodal…'
          : 'Menganalisis Chart & Mengirim…'
        : 'Penalaran Presisi (GPT-6/Claude)…'
    );

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await callOpenRouterDirectly(
        newMessages,
        currentText,
        mode,
        currentAttachment,
        (failedIdx, nextIdx, reason) => {
          setRateLimitedIndices((prev) => Array.from(new Set([...prev, failedIdx])));
          setFailoverBanner(`⚠️ Kunci #${failedIdx + 1} (${reason}) ➔ Beralih otomatis ke Kunci #${nextIdx + 1}`);
          setStatusText(`FAILOVER ➔ KEY #${nextIdx + 1}`);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
      );
      if (typeof result.keyIndexUsed === 'number') {
        setActiveKeyIndex(result.keyIndexUsed);
      }
      setStatusText(`Model: ${result.model.split('/').pop() || result.model}`);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: result.content,
          modelUsed: result.model,
          timestamp: getFormattedTime()
        }
      ]);
    } catch (e) {
      setStatusText('Kendala Jaringan / Failover');
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Maaf, terjadi kendala saat memproses: ${e instanceof Error ? e.message : 'Silakan coba kembali.'}`,
          modelUsed: 'Error Fallback',
          timestamp: getFormattedTime()
        }
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const renderFormattedContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return <Text style={styles.userMessageText}>{content}</Text>;
    }

    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      parts.push({
        type: 'code',
        lang: match[1] || 'CODE',
        code: match[2].trimEnd()
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return (
      <View style={styles.formattedContainer}>
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <View key={`code-${idx}`} style={styles.codeCard}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeLangText}>{(p.lang || 'CODE').toUpperCase()}</Text>
                  <Pressable
                    onPress={() => handleCopyMessage(`code-${idx}`, p.code || '')}
                    style={styles.codeCopyButton}
                  >
                    <Text style={styles.codeCopyText}>Salin Kode</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={styles.codeText}>{p.code}</Text>
                </ScrollView>
              </View>
            );
          }
          return (
            <Text key={`txt-${idx}`} style={styles.aiMessageText}>
              {p.content}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowQuotaModal(true);
              fetchQuotas();
            }}
            style={styles.novaOrb}
          >
            <Text style={styles.novaOrbIcon}>✦</Text>
          </Pressable>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>NOVA</Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowQuotaModal(true);
                  fetchQuotas();
                }}
                style={[
                  styles.liveBadge,
                  rateLimitedIndices.length > 0 && styles.liveBadgeWarning
                ]}
              >
                <View style={[styles.liveDot, rateLimitedIndices.length > 0 && styles.liveDotWarning]} />
                <Text style={[styles.liveText, rateLimitedIndices.length > 0 && styles.liveTextWarning]}>
                  {rateLimitedIndices.length > 0 ? 'LIMIT 429' : 'KUOTA & LIMIT'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.statusSubtext} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Mode Selector (Max / Auto / Fast) */}
          <View style={styles.modeToggleGroup}>
            {(['max', 'auto', 'fast'] as AgentMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMode(m);
                }}
                style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              >
                <Text style={[styles.modeButtonText, mode === m && styles.modeButtonTextActive]}>
                  {m === 'max' ? 'GPT-6/CLAUDE' : m === 'fast' ? 'TURBO' : 'AUTO'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Quota & Limit Modal Trigger */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowQuotaModal(true);
              fetchQuotas();
            }}
            style={[styles.iconButton, rateLimitedIndices.length > 0 && styles.iconButtonWarning]}
          >
            <Text style={styles.iconButtonText}>⚡</Text>
          </Pressable>

          {/* Reset/Clear Chat Button */}
          <Pressable onPress={handleResetChat} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      {/* Live Failover & Rate-Limit Alert Banner */}
      {failoverBanner && (
        <View style={styles.failoverBannerContainer}>
          <Text style={styles.failoverBannerText}>{failoverBanner}</Text>
          <Pressable
            onPress={() => setFailoverBanner(null)}
            style={styles.failoverBannerClose}
          >
            <Text style={styles.failoverBannerCloseText}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 1 && (
          <View style={styles.heroWelcome}>
            <View style={styles.heroOrbContainer}>
              <View style={styles.heroOrbGlowOuter} />
              <View style={styles.heroOrbInner}>
                <Text style={styles.heroOrbText}>✦</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>NOVA Omni-Modal Intelligence</Text>
            <Text style={styles.heroSubtitle}>
              Agen AI otonom berspesifikasi GPT-6 Astra & Claude Sonnet. Mendukung analisis teks, chart trading SMC, gambar, video, dan speech synthesis.
            </Text>

            <View style={styles.tagRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>📈 SMC & Chart Trading</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>👁️ Vision & Video</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>🔊 Audio TTS</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>🛡️ 4-Key Failover</Text>
              </View>
            </View>

            <Text style={styles.suggestionTitle}>PILIH AKSI CEPAT</Text>
            <View style={styles.quickPromptGrid}>
              {quickPrompts.map((qp, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setInput(qp.text);
                    if (qp.label.includes('Chart') || qp.label.includes('Foto')) {
                      setShowAttachMenu(true);
                    }
                  }}
                  style={styles.quickPromptCard}
                >
                  <Text style={styles.quickPromptIcon}>{qp.icon}</Text>
                  <Text style={styles.quickPromptLabel}>{qp.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
                styles.bubble,
                m.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}
            >
              <View style={styles.bubbleHeader}>
                <Text style={styles.roleLabel}>
                  {m.role === 'user' ? 'ANDA' : 'NOVA'}
                </Text>
                {m.modelUsed && m.role === 'assistant' && (
                  <View style={styles.modelTag}>
                    <Text style={styles.modelTagText}>
                      {m.modelUsed.split('/').pop()}
                    </Text>
                  </View>
                )}
                <Text style={styles.timestampText}>{m.timestamp}</Text>
              </View>

              {/* User Attached Image / Media View */}
              {m.imageUri && (
                <Pressable
                  onPress={() => setPreviewImageUri(m.imageUri || null)}
                  style={styles.bubbleImageContainer}
                >
                  <Image source={{ uri: m.imageUri }} style={styles.bubbleImage} />
                  <View style={styles.imageOverlayBadge}>
                    <Text style={styles.imageOverlayText}>
                      {m.mediaType === 'video' ? '🎥 Video Terlampir' : '🔍 Ketuk perbesar'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {renderFormattedContent(m.content, m.role === 'user')}

              {/* Assistant Message Actions: Copy + Voice TTS */}
              {m.role === 'assistant' && (
                <View style={styles.bubbleActionRow}>
                  <Pressable
                    onPress={() => handleToggleSpeech(m.id, m.content)}
                    style={[styles.actionPill, speakingId === m.id && styles.actionPillActive]}
                  >
                    <Text style={[styles.actionPillText, speakingId === m.id && styles.actionPillTextActive]}>
                      {speakingId === m.id ? '⏹️ Hentikan' : '🔊 Dengarkan'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCopyMessage(m.id, m.content)}
                    style={styles.actionPill}
                  >
                    <Text style={styles.actionPillText}>
                      {copiedId === m.id ? '✓ Tersalin!' : '📋 Salin Jawaban'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Thinking State */}
        {busy && (
          <View style={styles.thinkingContainer}>
            <View style={styles.assistantAvatar}>
              <Text style={styles.assistantAvatarText}>✦</Text>
            </View>
            <View style={styles.thinkingBubble}>
              <ActivityIndicator color="#818CF8" size="small" />
              <Text style={styles.thinkingLabel}>NOVA sedang melakukan penalaran mendalam…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Composer Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Selected Attachment Preview Bar */}
        {attachment && (
          <View style={styles.attachmentPreviewBar}>
            <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name || (attachment.type === 'video' ? 'Video Terlampir' : 'Foto/Chart Terlampir')}
              </Text>
              <Text style={styles.attachmentHint}>
                {attachment.type === 'video' ? '🎥 Video Siap Dianalisis' : '📈 Siap Dianalisis oleh NOVA'}
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

        {/* Bottom Input Capsule */}
        <View style={styles.composerBar}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setShowAttachMenu(true);
            }}
            style={styles.attachButton}
          >
            <Text style={styles.attachButtonIcon}>🖼️</Text>
          </Pressable>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              attachment
                ? 'Beri instruksi analisis chart/media…'
                : 'Tanya apa saja, kirim chart, atau media…'
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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Omni-Modal Architecture · GPT-6 Astra & Claude Sonnet · 4-Key Failover
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Bottom Sheet Modal */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAttachMenu(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Lampirkan Media Multimodal</Text>
            <Text style={styles.sheetSubtitle}>
              Pilih foto, chart trading, atau rekaman video untuk dianalisis
            </Text>

            <View style={styles.sheetOptions}>
              <Pressable onPress={handleTakePhoto} style={styles.sheetButton}>
                <Text style={styles.sheetButtonIcon}>📸</Text>
                <View>
                  <Text style={styles.sheetButtonTitle}>Ambil Foto dengan Kamera</Text>
                  <Text style={styles.sheetButtonDesc}>Potret layar TradingView, dokumen, atau objek langsung</Text>
                </View>
              </Pressable>

              <Pressable onPress={handlePickGallery} style={styles.sheetButton}>
                <Text style={styles.sheetButtonIcon}>🖼️</Text>
                <View>
                  <Text style={styles.sheetButtonTitle}>Pilih Gambar / Chart / Video</Text>
                  <Text style={styles.sheetButtonDesc}>Unggah tangkapan layar chart atau klip video dari galeri</Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowAttachMenu(false)}
              style={styles.sheetCancelButton}
            >
              <Text style={styles.sheetCancelText}>Batal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.fullscreenModal}>
          <Pressable
            onPress={() => setPreviewImageUri(null)}
            style={styles.fullscreenCloseButton}
          >
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

      {/* Real-Time Quota & Limit Monitor Modal (Mirip Screenshot Referensi) */}
      <Modal
        visible={showQuotaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuotaModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.quotaSheet, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            <View style={styles.sheetHandle} />

            {/* Modal Header */}
            <View style={styles.quotaHeaderRow}>
              <View>
                <Text style={styles.quotaHeaderTitle}>Monitor Limit & Kuota AI</Text>
                <Text style={styles.quotaHeaderSubtitle}>
                  Status kesehatan API & batas penggunaan model real-time
                </Text>
              </View>
              <Pressable
                onPress={() => setShowQuotaModal(false)}
                style={styles.quotaCloseButton}
              >
                <Text style={styles.quotaCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.quotaScrollArea}>
              {/* Card 1: Multi-Key Overages & Failover Toggle */}
              <View style={styles.settingToggleCard}>
                <View style={styles.settingToggleInfo}>
                  <Text style={styles.settingToggleTitle}>Enable AI Credit Overages</Text>
                  <Text style={styles.settingToggleDesc}>
                    When toggled on, NOVA will use your backup keys or failover quota to fulfill model requests once you're out of model quota.
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

              {/* Section 1: Gemini Models */}
              <View style={styles.modelSection}>
                <View style={styles.modelSectionHeader}>
                  <Text style={styles.modelSectionTitle}>Gemini Models</Text>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>ⓘ</Text>
                  </View>
                </View>

                <View style={styles.quotaCard}>
                  {/* Weekly Limit Remaining */}
                  <View style={styles.quotaRow}>
                    <View style={styles.quotaTextCol}>
                      <Text style={styles.quotaRowTitle}>Weekly Limit Remaining</Text>
                      <Text style={styles.quotaRowSubtitle}>
                        You have used some of your weekly limit, it will fully refresh in 6 days, 19 hours.
                      </Text>
                    </View>
                    <View style={styles.quotaValueCol}>
                      <Text style={styles.quotaPercentText}>94%</Text>
                      <CircularMeter percent={94} color="#10B981" />
                    </View>
                  </View>

                  <View style={styles.quotaCardDivider} />

                  {/* Five Hour Limit Remaining */}
                  <View style={styles.quotaRow}>
                    <View style={styles.quotaTextCol}>
                      <Text style={styles.quotaRowTitle}>Five Hour Limit Remaining</Text>
                      <Text style={styles.quotaRowSubtitle}>
                        You have used some of your 5-hour limit, it will fully refresh in 47 minutes.
                      </Text>
                    </View>
                    <View style={styles.quotaValueCol}>
                      <Text style={styles.quotaPercentText}>64%</Text>
                      <CircularMeter percent={64} color="#10B981" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 2: Claude and GPT models */}
              <View style={styles.modelSection}>
                <View style={styles.modelSectionHeader}>
                  <Text style={styles.modelSectionTitle}>Claude and GPT models</Text>
                  <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>ⓘ</Text>
                  </View>
                </View>

                <View style={styles.quotaCard}>
                  {/* Weekly Limit Remaining */}
                  <View style={styles.quotaRow}>
                    <View style={styles.quotaTextCol}>
                      <Text style={styles.quotaRowTitle}>Weekly Limit Remaining</Text>
                      <Text style={styles.quotaRowSubtitle}>
                        You have used some of your weekly limit, it will fully refresh in 6 days, 19 hours.
                      </Text>
                    </View>
                    <View style={styles.quotaValueCol}>
                      <Text style={styles.quotaPercentText}>70%</Text>
                      <CircularMeter percent={70} color="#10B981" />
                    </View>
                  </View>

                  <View style={styles.quotaCardDivider} />

                  {/* Five Hour Limit Remaining */}
                  <View style={styles.quotaRow}>
                    <View style={styles.quotaTextCol}>
                      <Text style={styles.quotaRowTitle}>Five Hour Limit Remaining</Text>
                      <Text style={styles.quotaRowSubtitle}>
                        {rateLimitedIndices.length > 0
                          ? 'Kunci utama terkena batas limit sementara, failover aktif ke kunci cadangan.'
                          : 'You have used some of your 5-hour limit, it will fully refresh in 40 minutes.'}
                      </Text>
                    </View>
                    <View style={styles.quotaValueCol}>
                      <Text
                        style={[
                          styles.quotaPercentText,
                          rateLimitedIndices.length > 0 && styles.quotaPercentTextWarn
                        ]}
                      >
                        {rateLimitedIndices.length > 0 ? '11%' : '88%'}
                      </Text>
                      <CircularMeter
                        percent={rateLimitedIndices.length > 0 ? 11 : 88}
                        color={rateLimitedIndices.length > 0 ? '#F59E0B' : '#10B981'}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Section 3: 4-Key Failover Matrix */}
              <View style={styles.modelSection}>
                <View style={styles.modelSectionHeader}>
                  <Text style={styles.modelSectionTitle}>Status 4 Kunci API OpenRouter</Text>
                  <Text style={styles.modelSectionMeta}>
                    {lastCheckTime ? `Pukul ${lastCheckTime}` : ''}
                  </Text>
                </View>

                <View style={styles.keysList}>
                  {OPENROUTER_KEYS.map((k: string, index: number) => {
                    const q = keyQuotas[index];
                    const isRateLimited = rateLimitedIndices.includes(index);
                    const isHealthy = q?.status === 'healthy';
                    const isInvalid = q?.status === 'invalid';
                    const isPrimary = activeKeyIndex === index;

                    return (
                      <View
                        key={index}
                        style={[
                          styles.keyStatusCard,
                          isPrimary && styles.keyStatusCardPrimary,
                          isRateLimited && styles.keyStatusCardLimited
                        ]}
                      >
                        <View style={styles.keyCardHeader}>
                          <View style={styles.keyCardTitleRow}>
                            <View
                              style={[
                                styles.keyDot,
                                isRateLimited
                                  ? styles.keyDotWarn
                                  : isHealthy
                                  ? styles.keyDotOk
                                  : styles.keyDotErr
                              ]}
                            />
                            <Text style={styles.keyCardTitle}>KUNCI API #{index + 1}</Text>
                            {isPrimary && (
                              <View style={styles.primaryPill}>
                                <Text style={styles.primaryPillText}>AKTIF UTAMA</Text>
                              </View>
                            )}
                          </View>

                          <View
                            style={[
                              styles.keyBadge,
                              isRateLimited
                                ? styles.keyBadgeWarn
                                : isHealthy
                                ? styles.keyBadgeOk
                                : styles.keyBadgeErr
                            ]}
                          >
                            <Text
                              style={[
                                styles.keyBadgeText,
                                isRateLimited
                                  ? styles.keyBadgeTextWarn
                                  : isHealthy
                                  ? styles.keyBadgeTextOk
                                  : styles.keyBadgeTextErr
                              ]}
                            >
                              {isRateLimited
                                ? 'LIMIT 429'
                                : isHealthy
                                ? 'SIAP PAKAI'
                                : isInvalid
                                ? 'EXPIRED (401)'
                                : 'STANDBY'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.keyMaskedText}>
                          {q?.label || `${k.slice(0, 10)}...${k.slice(-6)}`}
                        </Text>

                        <View style={styles.keyDetailsRow}>
                          <Text style={styles.keyDetailText}>
                            Tier: <Text style={styles.keyDetailVal}>{q?.isFreeTier ? 'Free Tier' : 'Standar'}</Text>
                          </Text>
                          <Text style={styles.keyDetailText}>
                            Pemakaian: <Text style={styles.keyDetailVal}>${(q?.usage || 0).toFixed(4)}</Text>
                          </Text>
                          <Text style={styles.keyDetailText}>
                            Failover: <Text style={styles.keyDetailVal}>{enableFailover ? 'Aktif' : 'Off'}</Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Action Button: Refresh Quotas */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  fetchQuotas();
                }}
                disabled={loadingQuota}
                style={styles.refreshQuotaButton}
              >
                {loadingQuota ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.refreshQuotaIcon}>🔄</Text>
                    <Text style={styles.refreshQuotaText}>Periksa Ulang Status Limit Sekarang</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090E'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161B26',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0D14'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  novaOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 8
  },
  novaOrbIcon: {
    color: '#A5B4FC',
    fontSize: 20,
    fontWeight: '900'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F291E',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  liveText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  statusSubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    maxWidth: 160
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#111622',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  modeButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10
  },
  modeButtonActive: {
    backgroundColor: '#252D42'
  },
  modeButtonText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700'
  },
  modeButtonTextActive: {
    color: '#F8FAFC'
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconButtonText: {
    fontSize: 14
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16
  },
  heroWelcome: {
    alignItems: 'center',
    marginVertical: 18,
    paddingHorizontal: 8
  },
  heroOrbContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  heroOrbGlowOuter: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#4338CA',
    opacity: 0.35
  },
  heroOrbInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#818CF8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroOrbText: {
    color: '#C7D2FE',
    fontSize: 26,
    fontWeight: '900'
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center'
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 20
  },
  tagPill: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14
  },
  tagPillText: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700'
  },
  suggestionTitle: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10
  },
  quickPromptGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  quickPromptCard: {
    width: '48%',
    backgroundColor: '#0F1420',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  quickPromptIcon: {
    fontSize: 18
  },
  quickPromptLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700'
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '100%'
  },
  userRow: {
    justifyContent: 'flex-end'
  },
  assistantRow: {
    justifyContent: 'flex-start'
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  assistantAvatarText: {
    color: '#818CF8',
    fontSize: 16,
    fontWeight: '800'
  },
  bubble: {
    borderRadius: 18,
    padding: 14,
    maxWidth: '85%'
  },
  userBubble: {
    backgroundColor: '#25215A',
    borderWidth: 1,
    borderColor: '#4338CA',
    borderTopRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: '#0E131F',
    borderWidth: 1,
    borderColor: '#1C2638',
    borderTopLeftRadius: 4
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  roleLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  modelTag: {
    backgroundColor: '#172033',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3748'
  },
  modelTagText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '700'
  },
  timestampText: {
    color: '#475569',
    fontSize: 9,
    marginLeft: 'auto'
  },
  bubbleImageContainer: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#374151'
  },
  bubbleImage: {
    width: '100%',
    height: 180,
    borderRadius: 12
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  },
  formattedContainer: {
    gap: 8
  },
  userMessageText: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 22
  },
  aiMessageText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 23
  },
  codeCard: {
    backgroundColor: '#06080E',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    marginVertical: 6,
    overflow: 'hidden'
  },
  codeHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  codeLangText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800'
  },
  codeCopyButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  codeCopyText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700'
  },
  codeText: {
    color: '#A5F3FC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    padding: 10
  },
  bubbleActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#162030'
  },
  actionPill: {
    backgroundColor: '#141D2E',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22314A'
  },
  actionPillActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1'
  },
  actionPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  actionPillTextActive: {
    color: '#A5B4FC'
  },
  thinkingContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 4
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E131F',
    borderWidth: 1,
    borderColor: '#1C2638',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  thinkingLabel: {
    color: '#94A3B8',
    fontSize: 12
  },
  attachmentPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#0F1626',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#22314C'
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: 8
  },
  attachmentInfo: {
    flex: 1
  },
  attachmentName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700'
  },
  attachmentHint: {
    color: '#818CF8',
    fontSize: 10,
    marginTop: 2
  },
  attachmentRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  attachmentRemoveText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800'
  },
  composerBar: {
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#0D111A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E2638',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 6
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4
  },
  attachButtonIcon: {
    fontSize: 18
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.6,
    shadowRadius: 6
  },
  sendButtonDisabled: {
    opacity: 0.35,
    backgroundColor: '#1E293B'
  },
  sendIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: -2
  },
  footerNote: {
    paddingVertical: 6,
    alignItems: 'center'
  },
  footerNoteText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '600'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#0D121D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#222F44',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 16
  },
  sheetTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  sheetOptions: {
    gap: 12,
    marginBottom: 16
  },
  sheetButton: {
    backgroundColor: '#141B29',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  sheetButtonIcon: {
    fontSize: 26
  },
  sheetButtonTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700'
  },
  sheetButtonDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  sheetCancelButton: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  sheetCancelText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700'
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16
  },
  fullscreenCloseText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  fullscreenImage: {
    width: '100%',
    height: '80%'
  },
  // Quota & Rate Limit Monitor Styles (Mirip Tampilan Referensi Pengguna)
  liveBadgeWarning: {
    backgroundColor: '#3B1219',
    borderColor: '#EF4444'
  },
  liveDotWarning: {
    backgroundColor: '#EF4444'
  },
  liveTextWarning: {
    color: '#F87171'
  },
  iconButtonWarning: {
    borderColor: '#EF4444',
    backgroundColor: '#2D1217'
  },
  failoverBannerContainer: {
    backgroundColor: '#2A1711',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  failoverBannerText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  failoverBannerClose: {
    padding: 4
  },
  failoverBannerCloseText: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '700'
  },
  quotaSheet: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#20293A',
    maxHeight: '92%',
    paddingHorizontal: 18,
    paddingTop: 12
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2234'
  },
  quotaHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  quotaHeaderSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2
  },
  quotaCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quotaCloseText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700'
  },
  quotaScrollArea: {
    marginBottom: 8
  },
  settingToggleCard: {
    backgroundColor: '#131826',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1F293D',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  settingToggleInfo: {
    flex: 1
  },
  settingToggleTitle: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '700'
  },
  settingToggleDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4
  },
  modelSection: {
    marginBottom: 18
  },
  modelSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  modelSectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700'
  },
  infoBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  infoBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  modelSectionMeta: {
    color: '#64748B',
    fontSize: 11
  },
  quotaCard: {
    backgroundColor: '#121622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 16
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  quotaTextCol: {
    flex: 1
  },
  quotaRowTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700'
  },
  quotaRowSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3
  },
  quotaValueCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  quotaPercentText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '800'
  },
  quotaPercentTextWarn: {
    color: '#F59E0B'
  },
  quotaCardDivider: {
    height: 1,
    backgroundColor: '#1A2132',
    marginVertical: 14
  },
  keysList: {
    gap: 10
  },
  keyStatusCard: {
    backgroundColor: '#121622',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
    padding: 12
  },
  keyStatusCardPrimary: {
    borderColor: '#4338CA',
    backgroundColor: '#14182B'
  },
  keyStatusCardLimited: {
    borderColor: '#B45309',
    backgroundColor: '#1E1712'
  },
  keyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  keyCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  keyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  keyDotOk: {
    backgroundColor: '#10B981'
  },
  keyDotWarn: {
    backgroundColor: '#F59E0B'
  },
  keyDotErr: {
    backgroundColor: '#EF4444'
  },
  keyCardTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  primaryPill: {
    backgroundColor: '#312E81',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  primaryPillText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '800'
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  keyBadgeOk: {
    backgroundColor: '#0F291E',
    borderWidth: 1,
    borderColor: '#10B981'
  },
  keyBadgeWarn: {
    backgroundColor: '#35210D',
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  keyBadgeErr: {
    backgroundColor: '#2F1217',
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  keyBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  keyBadgeTextOk: {
    color: '#34D399'
  },
  keyBadgeTextWarn: {
    color: '#FBBF24'
  },
  keyBadgeTextErr: {
    color: '#F87171'
  },
  keyMaskedText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8
  },
  keyDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A2132',
    paddingTop: 6
  },
  keyDetailText: {
    color: '#64748B',
    fontSize: 10
  },
  keyDetailVal: {
    color: '#CBD5E1',
    fontWeight: '600'
  },
  refreshQuotaButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16
  },
  refreshQuotaIcon: {
    fontSize: 14
  },
  refreshQuotaText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700'
  }
});
