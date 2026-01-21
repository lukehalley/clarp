'use client';

interface WarningTickerProps {
  messages: string[];
  direction: 'left' | 'right';
}

export default function WarningTicker({ messages, direction }: WarningTickerProps) {
  const animationClass = direction === 'left' ? 'ticker-scroll-left' : 'ticker-scroll-right';
  const duration = direction === 'left' ? '25s' : '30s';

  return (
    <div className="bg-slate-dark border-y-2 border-danger-orange overflow-hidden select-none">
      <div className="py-2 overflow-hidden">
        <div
          className={`${animationClass} flex whitespace-nowrap`}
          style={{ animationDuration: duration }}
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 text-xs font-mono">
              {messages.map((msg, j) => (
                <span key={j} className="flex items-center gap-6">
                  <span className={j === 0 ? 'text-danger-orange' : j % 3 === 0 ? 'text-larp-red' : j % 3 === 1 ? 'text-larp-yellow' : 'text-ivory-light'}>
                    {msg}
                  </span>
                  <span className="text-danger-orange/50">●</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-scroll-left {
          animation: ticker-left linear infinite;
        }
        .ticker-scroll-right {
          animation: ticker-right linear infinite;
        }
        @keyframes ticker-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
