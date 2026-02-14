import { useState, useCallback } from 'react';
import { sendChatMessage, streamChatMessage, type ChatRequest, type ChatResponse } from '@/lib/api';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  explanation?: string;
  imageUrl?: string;
  timestamp: Date;
  priceCard?: ChatResponse['priceCard'];
  culturalNotes?: ChatResponse['culturalNotes'];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    mode: ChatRequest['mode'],
    city: string,
    options?: {
      imageBase64?: string;
      imageUrl?: string;
      targetLanguage?: string;
      targetScript?: string;
      useStreaming?: boolean;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      imageUrl: options?.imageUrl,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const request: ChatRequest = {
        mode,
        message: content,
        city,
        targetLanguage: options?.targetLanguage,
        targetScript: options?.targetScript,
        imageBase64: options?.imageBase64,
      };

      if (options?.useStreaming) {
        // Streaming response
        const aiMessageId = (Date.now() + 1).toString();
        let streamedContent = '';

        // Add empty AI message that will be updated
        const aiMessage: Message = {
          id: aiMessageId,
          type: 'ai',
          content: '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);

        try {
          // Stream the response
          for await (const chunk of streamChatMessage(request)) {
            streamedContent += chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: streamedContent }
                  : msg
              )
            );
          }
        } catch (streamError) {
          // Remove the empty message on error
          setMessages((prev) => prev.filter((msg) => msg.id !== aiMessageId));
          throw streamError;
        }
      } else {
        // Regular response
        const response = await sendChatMessage(request);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.content,
          explanation: response.explanation,
          priceCard: response.priceCard,
          culturalNotes: response.culturalNotes,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        explanation: errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
