'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/MessageBubble';
import { AudioControls } from '@/components/AudioControls';
import { QuickActions } from '@/components/QuickActions';
import type { Mode } from '@/components/ModeSelector';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  explanation?: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  mode: Mode;
  audioDirection: 'you-them' | 'them-you';
  onAudioDirectionChange: (direction: 'you-them' | 'them-you') => void;
  onMicClick: () => void;
  isAudioActive: boolean;
  isAudioConnecting?: boolean;
  isLoading?: boolean;
  onQuickAction?: (action: string) => void;
  targetLanguage?: string;
}

const emptyStateConfig: Record<Mode, { title: string; description: string }> = {
  context: {
    title: 'Context Bridge',
    description: 'Get cultural insights, translations, and etiquette guidance',
  },
  haggling: {
    title: 'Haggling Copilot',
    description: 'Learn fair prices and negotiation strategies for local markets',
  },
  visual: {
    title: 'Visual Decoder',
    description: 'Upload or capture photos to translate signs, menus, and more',
  },
  audio: {
    title: 'Live Audio Bridge',
    description: 'Real-time voice translation for live conversations',
  },
};

export function ChatArea({
  messages,
  mode,
  audioDirection,
  onAudioDirectionChange,
  onMicClick,
  isAudioActive,
  isAudioConnecting = false,
  isLoading = false,
  onQuickAction,
  targetLanguage,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const { title, description } = emptyStateConfig[mode];

  // Audio mode has a special layout — controls always visible
  if (mode === 'audio') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" ref={scrollRef}>
        {/* Audio controls — always visible at top */}
        <AudioControls
          isActive={isAudioActive}
          isConnecting={isAudioConnecting}
          direction={audioDirection}
          onDirectionChange={onAudioDirectionChange}
          onMicClick={onMicClick}
          targetLanguage={targetLanguage}
        />

        {/* Transcription / messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-sm text-neutral-500 mb-4">
                {isAudioActive ? 'Listening... speak now' : 'Tap the mic to start translating'}
              </p>
              <QuickActions mode={mode} onActionClick={onQuickAction} />
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </div>
    );
  }

  // Standard text-based modes (context, haggling, visual)
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" ref={scrollRef}>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-neutral-400">{description}</p>
          </div>
          <QuickActions mode={mode} onActionClick={onQuickAction} />
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-neutral-700">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="flex-1 flex items-center">
            <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
