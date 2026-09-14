import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import type { ChatMessageItem } from '../types';

const STORAGE_KEY = 'nexora_chat_history';

const INITIAL_MESSAGES: ChatMessageItem[] = [
  {
    role: 'assistant',
    content: 'Merhaba! Ben Nexora Asistanıyım. Ürünlerimiz, fiyatlar ve stok durumu hakkında sorularınızı yanıtlamaktan memnuniyet duyarım. Size nasıl yardımcı olabilirim?',
  },
];

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Hata durumunda varsayılana dön
    }
    return INITIAL_MESSAGES;
  });

  // Mesajlar değiştikçe localStorage'a kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Depolama hatasını sessizce yoksay
    }
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (userMessage: string) => {
      const history = messages.map(({ role, content }) => ({ role, content }));
      return chatService.sendMessage({ message: userMessage, history });
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    },
    onError: () => {
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
    mutation.mutate(trimmed);
  };

  const clearChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    clearChat,
  };
};
