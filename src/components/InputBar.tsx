'use client';

import React, { useState, useEffect } from 'react';
import { Send, Mic, Image as ImageIcon, Camera, X } from 'lucide-react';
import type { Mode } from '@/components/ModeSelector';
import { CameraCapture } from '@/components/CameraCapture';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface InputBarProps {
  mode: Mode;
  onSendMessage: (message: string) => void;
  onImageUpload: (file: File) => void;
  isLoading?: boolean;
}

export function InputBar({
  mode,
  onSendMessage,
  onImageUpload,
  isLoading = false,
}: InputBarProps) {
  const [input, setInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);

  // Speech-to-text for context/haggling modes
  const { isListening, transcript, startListening, stopListening } = useVoiceInput();

  // Sync speech transcript into the input field
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (isListening) stopListening();
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleImageSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
  };

  const handleImageConfirm = () => {
    if (pendingImage) {
      onImageUpload(pendingImage.file);
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }
  };

  const handleImageCancel = () => {
    if (pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
    }
  };

  const handleImageClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageSelect(file);
    };
    fileInput.click();
  };

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    handleImageSelect(file);
  };

  if (mode === 'audio') return null;

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Image preview confirmation */}
      {pendingImage && (
        <div className="bg-neutral-800 border-t border-neutral-700 px-4 py-3">
          <div className="flex items-end gap-3">
            <div className="relative">
              <img
                src={pendingImage.previewUrl}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg border border-neutral-600"
              />
              <button
                onClick={handleImageCancel}
                className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-700 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-xs text-neutral-400">Send this image for analysis?</p>
              <button
                onClick={handleImageConfirm}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main input bar */}
      {!pendingImage && (
        <div className="bg-neutral-800 border-t border-neutral-700 px-4 py-3">
          {isListening && (
            <div className="flex items-center justify-center gap-2 mb-2 text-red-500 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Listening... Tap mic to stop</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {mode === 'visual' && (
              <>
                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={isLoading}
                  className="flex-shrink-0 p-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Upload image"
                  title="Upload from gallery"
                >
                  <ImageIcon className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  disabled={isLoading}
                  className="flex-shrink-0 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Take photo"
                  title="Take photo with camera"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={
                mode === 'context'
                  ? 'Ask about culture, phrases, etiquette...'
                  : mode === 'haggling'
                  ? 'What do you want to buy?'
                  : 'Describe what you see...'
              }
              className="flex-1 bg-neutral-700 text-white placeholder-neutral-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />

            {(mode === 'context' || mode === 'haggling') && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50'
                }`}
                aria-label={isListening ? 'Stop listening' : 'Voice input'}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'text-white' : 'text-neutral-300'}`} />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
