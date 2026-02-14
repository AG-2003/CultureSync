'use client';

import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { HagglingCard } from '@/components/HagglingCard';
import type { Message } from '@/components/ChatArea';

interface PriceCardData {
  item: string;
  local_low: number;
  local_high: number;
  tourist_low: number;
  tourist_high: number;
  opening: number;
  walk_away: number;
}

interface MessageBubbleProps {
  message: Message;
}

function extractPriceCard(content: string): { priceCard: PriceCardData | null; cleanContent: string } {
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.item && data.local_low !== undefined) {
        const cleanContent = content.replace(/```json\s*\{[\s\S]*?\}\s*```/, '').trim();
        return { priceCard: data as PriceCardData, cleanContent };
      }
    } catch { /* ignore parse errors */ }
  }
  return { priceCard: null, cleanContent: content };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const { priceCard, cleanContent } = isUser
    ? { priceCard: null, cleanContent: message.content }
    : extractPriceCard(message.content);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-orange-500' : 'bg-neutral-700'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
          isUser
            ? 'bg-orange-500 text-white rounded-tr-sm'
            : 'bg-neutral-800 text-white rounded-tl-sm'
        }`}>
          {isUser && message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Uploaded"
              className="w-full max-w-[240px] rounded-lg mb-2"
            />
          )}
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-body text-sm leading-relaxed">
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {priceCard && (
          <div className="max-w-[85%] w-full">
            <HagglingCard
              item={priceCard.item}
              localPrice={`Rs ${priceCard.local_low.toLocaleString()} - ${priceCard.local_high.toLocaleString()}`}
              touristPrice={`Rs ${priceCard.tourist_low.toLocaleString()} - ${priceCard.tourist_high.toLocaleString()}`}
              openingOffer={`Rs ${priceCard.opening.toLocaleString()}`}
              walkAwayPrice={`Rs ${priceCard.walk_away.toLocaleString()}`}
            />
          </div>
        )}

        {message.explanation && !isUser && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 max-w-[85%]">
            <p className="text-xs text-neutral-300 leading-relaxed">{message.explanation}</p>
          </div>
        )}

        <span className="text-xs text-neutral-500 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
