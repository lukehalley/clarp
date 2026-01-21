'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import chatbotResponses from '@/data/chatbot-responses.json';

type ResponseCategory = {
  patterns: string[];
  responses: string[];
};

type ChatbotResponses = {
  [key: string]: ResponseCategory;
};

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
}

export default function ClarpAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [usedResponses, setUsedResponses] = useState<Set<string>>(new Set());
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle visual viewport changes (keyboard open/close on mobile)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      // When keyboard opens, visualViewport.height shrinks
      setViewportHeight(window.visualViewport?.height ?? null);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    // Initial value
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Scroll input into view when focused on mobile
  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
    // Small delay to let keyboard open
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
  }, []);

  const findMatchingCategory = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();
    const responses = chatbotResponses as ChatbotResponses;

    // Check each category for pattern matches
    for (const [category, data] of Object.entries(responses)) {
      if (category === 'default') continue;

      for (const pattern of data.patterns) {
        // Check if the pattern exists in the input
        if (input.includes(pattern.toLowerCase())) {
          return category;
        }
      }
    }

    return 'default';
  };

  const getRandomResponse = (userInput: string) => {
    const responses = chatbotResponses as ChatbotResponses;
    const category = findMatchingCategory(userInput);
    const categoryResponses = responses[category]?.responses || responses.default.responses;

    // Create a unique key for tracking used responses per category
    const categoryKey = category;

    // Get or initialize the set of used indices for this category
    const usedInCategory = new Set(
      Array.from(usedResponses).filter(key => key.startsWith(`${categoryKey}:`)).map(key => parseInt(key.split(':')[1]))
    );

    // If all responses in category have been used, reset for this category
    if (usedInCategory.size >= categoryResponses.length) {
      // Remove all used responses for this category
      setUsedResponses(prev => {
        const newSet = new Set(prev);
        Array.from(newSet).forEach(key => {
          if (key.startsWith(`${categoryKey}:`)) {
            newSet.delete(key);
          }
        });
        return newSet;
      });
      usedInCategory.clear();
    }

    let index: number;
    do {
      index = Math.floor(Math.random() * categoryResponses.length);
    } while (usedInCategory.has(index) && usedInCategory.size < categoryResponses.length);

    setUsedResponses((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${categoryKey}:${index}`);
      return newSet;
    });

    return categoryResponses[index];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userInput = input.trim();
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: userInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const thinkTime = 800 + Math.random() * 1500;

    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: getRandomResponse(userInput),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
      if (!isOpen) {
        setHasNewMessage(true);
      }
    }, thinkTime);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Chat window */}
      <div
        ref={chatWindowRef}
        className={`fixed z-[90] transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        } ${isInputFocused ? 'sm:bottom-auto' : ''}`}
        style={{
          // On mobile when input is focused, position at top of visual viewport
          ...(isInputFocused && viewportHeight && viewportHeight < 500
            ? {
                bottom: 'auto',
                top: '0',
                left: '0',
                right: '0',
                height: `${viewportHeight}px`,
              }
            : {
                bottom: 'max(1rem, env(safe-area-inset-bottom))',
                right: 'max(1rem, env(safe-area-inset-right))',
              }),
        }}
      >
        <div
          className={`bg-slate-dark text-ivory-light font-mono overflow-hidden transition-all duration-300 ${
            isInputFocused && viewportHeight && viewportHeight < 500
              ? 'w-full h-full flex flex-col'
              : 'w-[calc(100vw-2rem)] sm:w-[380px]'
          }`}
          style={{
            border: isInputFocused && viewportHeight && viewportHeight < 500 ? 'none' : '2px solid var(--danger-orange)',
            boxShadow: isInputFocused && viewportHeight && viewportHeight < 500 ? 'none' : '0 0 0 1px rgba(255, 107, 53, 0.3), 0 0 40px rgba(255, 107, 53, 0.15), 8px 8px 0 black',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 border-b-2 border-danger-orange/50"
            style={{ background: 'linear-gradient(90deg, rgba(255, 107, 53, 0.15), transparent)' }}
          >
            <div className="w-2.5 h-2.5 bg-larp-red" />
            <div className="w-2.5 h-2.5 bg-larp-yellow" />
            <div className="w-2.5 h-2.5 bg-larp-green" />
            <span className="ml-2 text-xs text-ivory-light/50">clarp-ai v0.0.0</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[10px] text-danger-orange">
                {isTyping ? '[ thinking ]' : '[ idle ]'}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ivory-light/50 hover:text-danger-orange transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className={`overflow-y-auto p-4 scrollbar-hide ${
              isInputFocused && viewportHeight && viewportHeight < 500
                ? 'flex-1'
                : 'h-[300px] sm:h-[350px]'
            }`}
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 107, 53, 0.02) 2px, rgba(255, 107, 53, 0.02) 4px)',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                {message.type === 'user' ? (
                  <div className="inline-block max-w-[85%]">
                    <div className="text-[9px] text-cloud-medium mb-0.5 mr-1">you</div>
                    <div
                      className="inline-block px-3 py-2 text-xs text-left bg-slate-medium/50 border border-cloud-medium/30"
                      style={{ wordBreak: 'break-word' }}
                    >
                      <span className="text-cloud-light">&gt;</span> {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="inline-block max-w-[85%]">
                    <div className="text-[9px] text-danger-orange mb-0.5 ml-1 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-danger-orange" />
                      clarp
                    </div>
                    <div
                      className="inline-block px-3 py-2 text-xs text-left border border-danger-orange/40"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), transparent)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="mb-3 text-left">
                <div className="text-[9px] text-danger-orange mb-0.5 ml-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-danger-orange animate-pulse" />
                  clarp
                </div>
                <div
                  className="inline-block px-3 py-2 text-xs border border-danger-orange/40"
                  style={{ background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), transparent)' }}
                >
                  <span className="inline-flex gap-0.5">
                    <span className="typing-dot" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="typing-dot" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="typing-dot" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                  <span className="ml-1 text-ivory-light/30 text-[10px]">(pretending)</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t-2 border-danger-orange/50 p-3"
            style={{ background: 'linear-gradient(180deg, rgba(255, 107, 53, 0.05), transparent)' }}
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-danger-orange text-xs">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="type something..."
                  disabled={isTyping}
                  className="w-full bg-slate-dark/80 text-ivory-light text-base sm:text-xs pl-6 pr-2 py-2 border border-danger-orange/30 focus:border-danger-orange focus:outline-none placeholder:text-ivory-light/30 disabled:opacity-50"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)' }}
                />
              </div>
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="px-3 py-2 bg-danger-orange text-black font-mono font-bold text-xs border-2 border-black transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:translate-x-[1px] hover:enabled:translate-y-[1px]"
                style={{
                  boxShadow: isTyping || !input.trim() ? '1px 1px 0 black' : '3px 3px 0 black',
                }}
              >
                {isTyping ? '...' : '→'}
              </button>
            </div>
            <div className="mt-1.5 text-[9px] text-ivory-light/30 text-center">
              0% helpful. 100% judgmental.
            </div>
          </form>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={handleOpen}
        className={`fixed z-[90] group transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        aria-label="Open chat"
      >
        <div
          className="relative w-14 h-14 sm:w-16 sm:h-16 bg-danger-orange flex items-center justify-center border-2 border-black transition-all duration-150 group-hover:translate-x-[2px] group-hover:translate-y-[2px]"
          style={{ boxShadow: '4px 4px 0 black' }}
        >
          {/* Chat icon */}
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          {/* Notification dot */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-larp-red border border-black flex items-center justify-center">
              <span className="text-[8px] text-black font-bold">!</span>
            </span>
          )}

          {/* Pulse ring */}
          <span className="absolute inset-0 border-2 border-danger-orange animate-ping opacity-20" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div
            className="bg-slate-dark text-ivory-light text-[10px] font-mono px-2 py-1 border border-danger-orange whitespace-nowrap"
            style={{ boxShadow: '2px 2px 0 black' }}
          >
            ask clarp ai (don't)
          </div>
        </div>
      </button>

      {/* Styles */}
      <style jsx>{`
        .typing-dot {
          display: inline-block;
          animation: typing-bounce 0.6s infinite;
        }
        @keyframes typing-bounce {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
