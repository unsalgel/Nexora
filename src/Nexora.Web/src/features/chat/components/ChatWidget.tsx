import { safeChatLink } from '../safeChatLink';
import { SafeImage } from '../../../components/common/SafeImage';
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useCart } from '../../../context/CartContext';

interface FormatterOptions {
  onCloseChat?: () => void;
  onAddToCart?: (productId: string) => Promise<boolean>;
  addingProductId?: string | null;
}
const QUICK_SUGGESTIONS = [
  { label: 'Ürünleri İncele', prompt: 'Mağazanızdaki ürünleri listeler misin?' },
  { label: 'Akıllı Saatler', prompt: 'Akıllı saat modelleriniz nelerdir?' },
  { label: 'Kargo Bilgileri', prompt: 'Siparişler ne zaman kargoya verilir ve kargo ücreti ne kadar?' },
  { label: 'İade Koşulları', prompt: 'İade ve değişim süreciniz nasıl işliyor?' },
];const renderFormattedContent = (content: string, options: FormatterOptions) => {
  const tokenRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\)|\[PRODUCT_CARD\|.*?\|.*?\|.*?\|.*?\])/g;
  const parts = content.split(tokenRegex);

  return parts.map((part, index) => {
    const cardMatch = part.match(/^\[PRODUCT_CARD\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]$/);
    if (cardMatch) {
      const [, id, title, price, rawImageUrl] = cardMatch;
      const cleanImg = rawImageUrl && rawImageUrl.trim() !== 'none' && rawImageUrl.trim() !== '' ? rawImageUrl.trim() : null;
      
      const isAdding = options.addingProductId === id;

      return (
        <div
          key={index}
          className="my-3 p-2.5 bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 group w-full"
        >
          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <SafeImage
              src={cleanImg}
              alt={title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-gray-900 truncate leading-snug" title={title}>
              {title}
            </h4>
            <p className="text-xs font-bold text-orange-600 whitespace-nowrap mt-0.5">{price}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {options.onAddToCart && (
              <button aria-label="Sepete Ekle"
                type="button"
                title="Sepete Ekle"
                disabled={isAdding}
                onClick={() => options.onAddToCart!(id)}
                className="p-1.5 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-600 rounded-lg border border-orange-200 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isAdding ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
              </button>
            )}
            <Link
              to={`/products/${id}`}
              onClick={() => options.onCloseChat?.()}
              className="px-2 py-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>İncele</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, linkText, linkUrl] = linkMatch;
      const destination = safeChatLink(linkUrl);
      if (!destination) return linkText;
      return (
        <Link
          key={index}
          to={destination}
          onClick={() => options.onCloseChat?.()}
          className="inline-flex items-center gap-1 my-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-xs rounded-lg border border-orange-200 transition-colors shadow-xs"
        >
          <span>{linkText}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      );
    }

    return part;
  });
};
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!globalAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        globalAudioCtx = new AudioCtxClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
};
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playHarmonicChime = () => {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.16);

      gain2.gain.setValueAtTime(0.0001, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.1, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.35);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playHarmonicChime()).catch(() => {});
    } else {
      playHarmonicChime();
    }
  } catch (err) {
    console.error('Audio play error:', err);
  }
};

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const { messages, sendMessage, isLoading, clearChat } = useChat({ onMessageReceived: playNotificationSound });
  const { addToCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);
  const scrollChips = (direction: 'left' | 'right') => {
    if (chipsScrollRef.current) {
      chipsScrollRef.current.scrollBy({
        left: direction === 'left' ? -130 : 130,
        behavior: 'smooth'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingProductId(productId);
      return await addToCart(productId, 1);
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[530px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden mb-3 transition-all duration-300">
          <div className="bg-slate-800 text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Nexora Asistan</h3>
                <p className="text-xs text-slate-300 font-medium">Yapay zekâ destekli alışveriş yardımı</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={clearChat}
                title="Sohbeti Temizle"
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Kapat"
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={"flex " + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={"max-w-[92%] sm:max-w-[88%] px-3.5 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed " + (
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm'
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.role === 'assistant'
                      ? renderFormattedContent(msg.content, {
                          onCloseChat: () => setIsOpen(false),
                          onAddToCart: handleAddToCart,
                          addingProductId,
                        })
                      : msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="relative bg-white border-t border-gray-100 px-2 py-2 flex items-center group">
            <button
              type="button"
              onClick={() => scrollChips('left')}
              className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
              title="Sola Kaydır"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              ref={chipsScrollRef}
              onWheel={(e) => {
                if (e.deltaY !== 0 && chipsScrollRef.current) {
                  chipsScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 flex items-center space-x-1.5 overflow-x-auto scroll-smooth py-0.5 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => sendMessage(item.prompt)}
                  className="flex-shrink-0 px-2.5 py-1 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 active:bg-orange-100 border border-gray-200 text-gray-600 text-xs font-medium rounded-full transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollChips('right')}
              className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex-shrink-0"
              title="Sağa Kaydır"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              aria-label="Asistana mesajınız" maxLength={1000} placeholder="Mesajınızı yazın..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              aria-label="Mesajı gönder" disabled={!inputMessage.trim() || isLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
        className="ml-auto flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 shadow-sm transition-colors hover:border-orange-500 hover:text-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
        aria-label={isOpen ? "Yardımı kapat" : "Yardımı aç"} aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="font-medium text-sm">Yardım</span>
          </div>
        )}
      </button>
    </div>
  );
};
