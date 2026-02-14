'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { ModeSelector, type Mode } from '@/components/ModeSelector';
import { ChatArea } from '@/components/ChatArea';
import { InputBar } from '@/components/InputBar';
import { NegotiationCheatSheet } from '@/components/NegotiationCheatSheet';
import { useChat } from '@/hooks/useChat';
import { useAudio } from '@/hooks/useAudio';
import { imageToBase64, clearHistory } from '@/lib/api';
import { getLanguageForCity, resolveCity } from '@/lib/language-map';
import { detectLocation } from '@/lib/geolocation';
import { log } from '@/lib/logger';

type LocationStatus = 'loading' | 'detected' | 'manual' | 'pending';

interface PriceCardData {
  item: string;
  local_low: number;
  local_high: number;
  tourist_low: number;
  tourist_high: number;
  opening: number;
  walk_away: number;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('context');
  const [location, setLocation] = useState('');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [audioDirection, setAudioDirection] = useState<'you-them' | 'them-you'>('you-them');

  // Haggling data that persists across mode switches
  const [hagglingPriceCard, setHagglingPriceCard] = useState<PriceCardData | null>(null);
  const [hagglingPhrases, setHagglingPhrases] = useState<string[]>([]);
  const hagglingItemRef = useRef('');

  // Custom hooks
  const { messages: chatMessages, isLoading, sendMessage, clearMessages: clearChatMessages } = useChat();
  const {
    isActive: isAudioActive,
    isConnecting: isAudioConnecting,
    messages: audioMessages,
    startSession,
    stopSession,
    clearMessages: clearAudioMessages,
  } = useAudio();

  // Use audio messages when in audio mode, chat messages otherwise
  const messages = mode === 'audio' ? audioMessages : chatMessages;

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation().then((result) => {
      if (result) {
        setLocation(result.city);
        setLocationStatus('detected');
        log.info(`[Location] Auto-detected: ${result.city}`);
      } else {
        setLocationStatus('pending');
        log.info('[Location] Auto-detect failed, will ask user');
      }
    });
  }, []);

  // Get language settings based on location
  const { language: targetLanguage, script: targetScript } = getLanguageForCity(location);

  // Parse haggling data from AI responses
  const parseHagglingData = useCallback((text: string) => {
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]) as PriceCardData;
        setHagglingPriceCard(data);
        hagglingItemRef.current = data.item;
      } catch { /* ignore parse errors */ }
    }

    const phrases: string[] = [];
    const phrasePatterns = [
      /["""](.*?(?:hai|hain|batao|dunga|dungi|dekhte|theek|zyada|bhaiya|didi|laga).*?)["""]/gi,
      /\*\*[""](.+?)[""]\*\*/g,
    ];
    for (const pattern of phrasePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1].length < 80) phrases.push(match[1]);
      }
    }
    if (phrases.length > 0) setHagglingPhrases(phrases.slice(0, 5));
  }, []);

  // Watch for haggling responses
  useEffect(() => {
    if (mode !== 'haggling') return;
    const lastAiMessage = [...messages].reverse().find(m => m.type === 'ai' && m.content.length > 50);
    if (lastAiMessage) {
      parseHagglingData(lastAiMessage.content);
    }
  }, [messages, mode, parseHagglingData]);

  // Try resolving city from user's chat when location is unknown
  useEffect(() => {
    if (locationStatus !== 'pending' && locationStatus !== 'loading') return;
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage) {
      const matched = resolveCity(lastUserMessage.content);
      if (matched) {
        setLocation(matched.city);
        setLocationStatus('manual');
        log.info(`[Location] Resolved from chat: ${matched.city}`);
      }
    }
  }, [messages, locationStatus]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearChatMessages();
    clearAudioMessages();
    clearHistory();
    if (isAudioActive) {
      stopSession();
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, mode, location, {
      targetLanguage,
      targetScript,
      useStreaming: true,
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      const base64Image = await imageToBase64(file);
      // Create a data URL for rendering the image in the chat bubble
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await sendMessage('[Image uploaded for analysis]', 'visual', location, {
        imageBase64: base64Image,
        imageUrl: imageDataUrl,
        targetLanguage,
        targetScript,
        useStreaming: true,
      });
    } catch (err) {
      log.error('Failed to upload image:', err);
    }
  };

  const handleVoiceInput = async () => {
    if (isAudioActive) {
      stopSession();
    } else {
      await startSession(
        location,
        targetLanguage,
        audioDirection === 'you-them' ? 'outgoing' : 'incoming'
      );
    }
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const handleDismissCheatSheet = () => {
    setHagglingPriceCard(null);
    setHagglingPhrases([]);
  };

  // Location badge config
  const locationBadge = {
    loading: { text: 'Detecting...', color: 'text-slate-400', bg: 'bg-slate-800' },
    detected: { text: location, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border border-emerald-800/30' },
    manual: { text: location, color: 'text-cyan-400', bg: 'bg-cyan-900/30 border border-cyan-800/30' },
    pending: { text: 'Tell me your city', color: 'text-amber-400', bg: 'bg-amber-900/30 border border-amber-800/30' },
  }[locationStatus];

  return (
    <div className="flex flex-col h-dvh bg-[#06080f] max-w-md mx-auto">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg text-cyan-400">CultureSync</h1>
          <span className="text-[10px] font-medium text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className={`text-xs px-2 py-1 rounded-md ${locationBadge.bg} ${locationBadge.color}`}>
            {locationBadge.text}
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector currentMode={mode} onModeChange={handleModeChange} />

      {/* Negotiation Cheat Sheet — shows in Audio mode when haggling data exists */}
      {mode === 'audio' && hagglingPriceCard && (
        <div className="px-4 pt-2">
          <NegotiationCheatSheet
            item={hagglingPriceCard.item}
            localPrice={`Rs ${hagglingPriceCard.local_low.toLocaleString()} - ${hagglingPriceCard.local_high.toLocaleString()}`}
            touristPrice={`Rs ${hagglingPriceCard.tourist_low.toLocaleString()} - ${hagglingPriceCard.tourist_high.toLocaleString()}`}
            openingOffer={`Rs ${hagglingPriceCard.opening.toLocaleString()}`}
            walkAwayPrice={`Rs ${hagglingPriceCard.walk_away.toLocaleString()}`}
            phrases={hagglingPhrases}
            onDismiss={handleDismissCheatSheet}
          />
        </div>
      )}

      {/* Chat Area */}
      <ChatArea
        messages={messages}
        mode={mode}
        audioDirection={audioDirection}
        onAudioDirectionChange={setAudioDirection}
        onMicClick={handleVoiceInput}
        isAudioActive={isAudioActive}
        isAudioConnecting={isAudioConnecting}
        isLoading={isLoading}
        onQuickAction={handleQuickAction}
        targetLanguage={targetLanguage}
      />

      {/* Input Bar */}
      <InputBar
        mode={mode}
        onSendMessage={handleSendMessage}
        onImageUpload={handleImageUpload}
        isLoading={isLoading}
      />
    </div>
  );
}
