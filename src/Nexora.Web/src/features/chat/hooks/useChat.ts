import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import type { ChatMessageItem } from '../types';
import { CHAT_STORAGE_PREFIX, useAccessToken } from '../../../lib/session';
import { buildChatHistory } from '../history';
import { decodeJwt } from '../../../lib/jwt';


const INITIAL_MESSAGES: ChatMessageItem[] = [
  {
    role: 'assistant',
    content: 'Merhaba! Ben Nexora Asistanıyım. Ürünlerimiz, fiyatlar ve stok durumu hakkında sorularınızı yanıtlamaktan memnuniyet duyarım. Size nasıl yardımcı olabilirim?',
  },
];

interface UseChatOptions {
  onMessageReceived?: () => void;
}

export const useChat = (options?: UseChatOptions) => {
  const token = useAccessToken();
  const generation = useRef(0);
  const storageKey = CHAT_STORAGE_PREFIX + (token ? decodeJwt(token)?.id || 'guest' : 'guest');
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item =>
          item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')) return parsed.slice(-50);
      }
    } catch {
    }
    return INITIAL_MESSAGES;
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
    } catch {
    }
  }, [messages, storageKey]);

  const mutation = useMutation({
    mutationFn: (request: { message: string; generation: number }) => {
      return chatService.sendMessage({ message: request.message, history: buildChatHistory(messages) });
    },
    onSuccess: (data, request) => {
      if (request.generation !== generation.current) return;
      try {
        options?.onMessageReceived?.();
      } catch {}

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    },
    onError: (_error, request) => {
      if (request.generation !== generation.current) return;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
        },
      ]);
    },
  });

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    mutation.mutate({ message: trimmed, generation: generation.current });
  };

  const clearChat = () => {
    generation.current++;
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    clearChat,
  };
};
