import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import type { AgentMode, ChatMessage } from '@nova/shared';

type UiMessage = ChatMessage & { id: string };

const OPENROUTER_KEYS = (
  process.env.EXPO_PUBLIC_OPENROUTER_KEYS || ''
).split(',').map((k: string) => k.trim()).filter(Boolean);

const MODEL_CHAINS: Record<AgentMode, string[]> = {
  max: [
    'anthropic/claude-sonnet-5',
    'google/gemini-3.8-flash',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ],
  fast: [
    'google/gemini-3.8-flash',
    'openai/gpt-5.6-luna',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ],
  auto: [
    'anthropic/claude-sonnet-5',
    'google/gemini-3.8-flash',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ]
};

const SYSTEM_PROMPT = `You are NOVA, a highly capable personal AI agent.
Be proactive, accurate, and concise. Break complex requests into practical steps, verify important results, and clearly state uncertainty.
Respond naturally and helpfully in the user's language.`;

async function callOpenRouterDirectly(history: ChatMessage[], prompt: string, mode: AgentMode) {
  const models = MODEL_CHAINS[mode] || MODEL_CHAINS.auto;
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.filter((m) => m.role !== 'system'),
    { role: 'user' as const, content: prompt }
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
          messages
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if ((response.status === 429 || response.status === 401) && i < OPENROUTER_KEYS.length - 1) {
          continue;
        }
        throw new Error(`OpenRouter (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || 'Tidak ada jawaban.',
        model: data.model || models[0]
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < OPENROUTER_KEYS.length - 1) continue;
    }
  }

  throw lastError || new Error('Gagal menghubungi OpenRouter.');
}

export default function Home() {
  const [messages, setMessages] = useState<UiMessage[]>([
    { id: 'welcome', role: 'assistant', content: 'Halo! Saya NOVA. AI pribadi Anda yang terhubung langsung ke OpenRouter. Berikan saya tugas atau pertanyaan apa saja!' }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AgentMode>('auto');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Siap (Direct Mobile)');
  const history = useMemo(() => messages.map(({ role, content }) => ({ role, content })), [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    Haptics.selectionAsync().catch(() => undefined);
    setInput('');
    const id = `${Date.now()}-${Math.random()}`;
    setMessages((m) => [...m, { id, role: 'user', content: text }]);
    setBusy(true);
    setStatus('Berpikir & Menentukan Model…');

    try {
      const result = await callOpenRouterDirectly(history, text, mode);
      setStatus(`OpenRouter · ${result.model}`);
      setMessages((m) => [...m, { id: `${Date.now()}-a`, role: 'assistant', content: result.content }]);
    } catch (e) {
      setStatus('Terjadi kendala');
      setMessages((m) => [
        ...m,
        { id: `${Date.now()}-e`, role: 'assistant', content: `Maaf, terjadi kendala: ${e instanceof Error ? e.message : 'Silakan coba lagi.'}` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>NOVA</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
        <View style={styles.pillRow}>
          {(['auto', 'max', 'fast'] as AgentMode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.pill, mode === m && styles.pillActive]}>
              <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>{m.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.chat} keyboardShouldPersistTaps="handled">
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.role}>{m.role === 'user' ? 'ANDA' : 'NOVA'}</Text>
            <Text style={[styles.message, m.role === 'user' && styles.userMessage]}>{m.content}</Text>
          </View>
        ))}
        {busy && (
          <View style={styles.thinking}>
            <ActivityIndicator color="#aaa" />
            <Text style={styles.thinkingText}>NOVA sedang berpikir…</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.composerWrap}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          placeholder="Ketik pesan atau tugas untuk NOVA…"
          placeholderTextColor="#777"
          multiline
          style={styles.input}
        />
        <Pressable onPress={send} disabled={busy || !input.trim()} style={[styles.send, (busy || !input.trim()) && styles.sendDisabled]}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>Direct OpenRouter Connection · 100% Mandiri di HP</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090909' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e1e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#fff', fontSize: 27, fontWeight: '800', letterSpacing: 2 },
  status: { color: '#8d8d8d', marginTop: 2, fontSize: 11 },
  pillRow: { flexDirection: 'row', gap: 5 },
  pill: { borderWidth: 1, borderColor: '#292929', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
  pillActive: { borderColor: '#8c8c8c', backgroundColor: '#181818' },
  pillText: { fontSize: 9, color: '#777', fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  chat: { padding: 18, gap: 12, paddingBottom: 24 },
  bubble: { borderRadius: 18, padding: 14, maxWidth: '92%' },
  aiBubble: { backgroundColor: '#141414', alignSelf: 'flex-start', borderTopLeftRadius: 5 },
  userBubble: { backgroundColor: '#f0f0f0', alignSelf: 'flex-end', borderTopRightRadius: 5 },
  role: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#777', marginBottom: 6 },
  message: { fontSize: 15, lineHeight: 22, color: '#eee' },
  userMessage: { color: '#111' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 8 },
  thinkingText: { color: '#9a9a9a', fontSize: 13 },
  composerWrap: { margin: 12, marginTop: 0, borderWidth: 1, borderColor: '#282828', backgroundColor: '#111', borderRadius: 20, flexDirection: 'row', alignItems: 'flex-end', padding: 8 },
  input: { flex: 1, color: '#fff', paddingHorizontal: 11, paddingVertical: 8, minHeight: 42, maxHeight: 120, fontSize: 15 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.35 },
  sendText: { color: '#111', fontSize: 20, fontWeight: '800', marginLeft: 2 },
  footer: { color: '#5f5f5f', fontSize: 9, textAlign: 'center', paddingBottom: Platform.OS === 'ios' ? 10 : 7 }
});
