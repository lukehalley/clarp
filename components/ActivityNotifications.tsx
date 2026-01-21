'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: string;
  type: 'buy' | 'sell' | 'panic' | 'whale' | 'cope' | 'ngmi';
  message: string;
  detail?: string;
  timestamp: number;
  exiting?: boolean;
}

const WALLET_PREFIXES = ['0x7f', '0x3d', '0x9a', '0x2b', '0xf4', '0x8c', '0x1e', '0x5k', '0xde', '0xab', '0x00', '0xff'];
const WALLET_SUFFIXES = ['3d', '7f', 'a9', '2e', 'b4', 'c8', 'f1', '0x', 'ad', '69', '42', 'ee'];

const AMOUNTS = [
  '420.69 SOL',
  '69.42 SOL',
  '0.001 SOL (still too much)',
  '$69,420',
  '$4.20 (their net worth)',
  'their entire savings',
  'rent money (again)',
  'kid\'s college fund',
  'emergency fund (lol)',
  'money they don\'t have',
  'borrowed funds',
  'margin they can\'t cover',
  'wedding budget',
  '3 months salary',
  'inheritance from grandma',
  'student loan disbursement',
  'tax refund',
  'car payment money',
  'grocery money for the month',
  'literally everything',
];

const generateWallet = () => {
  const prefix = WALLET_PREFIXES[Math.floor(Math.random() * WALLET_PREFIXES.length)];
  const suffix = WALLET_SUFFIXES[Math.floor(Math.random() * WALLET_SUFFIXES.length)];
  return `${prefix}...${suffix}`;
};

const generateAmount = () => AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];

type NotificationType = 'buy' | 'sell' | 'panic' | 'whale' | 'cope' | 'ngmi';

const NOTIFICATION_TEMPLATES: { type: NotificationType; messages: string[]; details?: string[] }[] = [
  {
    type: 'buy',
    messages: [
      'bought $CLARP after reading "vaporware". literacy: questionable.',
      'aped into $CLARP despite the warnings. respect.',
      'saw "building nothing" and clicked buy. legend.',
      'read the whole site. still bought. commitment.',
      'bought $CLARP. the satire didn\'t land.',
      'fomo\'d into admitted vaporware. bold strategy.',
      'used rent money on a joke token. landlord will understand.',
      'bought because the roasts were funny.',
      'scrolled past "exit liquidity". bought anyway.',
      'saw 98.6% rug rate. bet on the 1.4%.',
      'trusted a site calling itself a scam. interesting.',
      'bought $CLARP to "support the art". sure.',
      'market bought after reading whitepaper (blank).',
      'leveraged into satire. 100x cope.',
      'sold eth to buy admitted nothing. degen.',
      'bought because "at least they\'re honest".',
      'clicked connect wallet on parody site. delivered.',
      'read "you are exit liquidity". became exit liquidity.',
      'saw progress bar at 99%. felt hopeful.',
      'bought to prove the site wrong. won\'t.',
    ],
    details: ['{amount} → vaporware', 'funding the joke: {amount}', 'satire fee: {amount}', '{amount} for honesty', 'comedy premium: {amount}'],
  },
  {
    type: 'sell',
    messages: [
      'panic sold $CLARP. we told you.',
      'sold after re-reading the website. fair.',
      'finally accepted it was vaporware. growth.',
      'ragequit at -94%. the site warned you.',
      'sold $CLARP. the joke stopped being funny.',
      'capitulated on admitted vaporware. expected.',
      'sold after checking the roadmap. q2 forever.',
      'realized "transparent scam" was literal.',
      'sold to buy actual vaporware instead.',
      'dumped $CLARP. bought something "serious".',
      'couldn\'t handle honest tokenomics.',
      'sold because it actually shipped nothing.',
      'exited the comedy. entered the tragedy.',
      'the whitepaper being blank finally clicked.',
      'sold after products said "none exist".',
    ],
    details: ['satire refund: {amount}', 'joke\'s over: {amount}', 'honesty hurts: {amount}', 'vaporware divested', 'comedy ended'],
  },
  {
    type: 'panic',
    messages: [
      'refreshing $CLARP chart on a parody token.',
      'asking "wen product" on a vaporware site.',
      'checking if $CLARP roadmap updated. (it won\'t.)',
      'dm\'d clarp ai for alpha. got roasted.',
      'drawing TA on admitted vaporware.',
      'googling "is $CLARP a scam". bro the site says yes.',
      'wondering why q2 never arrives.',
      'checking if the blank whitepaper updated.',
      'asking discord if product is coming. ever.',
      'analyzing tokenomics that say "you lose".',
      'convinced the satire is reverse psychology.',
      'watching $CLARP at 3am. it\'s still vaporware.',
      'writing bullish thesis on admitted nothing.',
      'blaming devs for doing exactly what they said.',
    ],
    details: ['reading comprehension: 0', 'cope: $CLARP-grade', 'denial: professional', 'accepting: never', 'ngmi: confirmed'],
  },
  {
    type: 'whale',
    messages: [
      'someone dumped $CLARP. shocking. (not shocking.)',
      '$CLARP dev sold. the tokenomics page said this.',
      'whale exited $CLARP. like the site promised.',
      'kol dumped their $CLARP allocation. per roadmap.',
      'liquidity event on admitted vaporware.',
      '"community wallet" did what community wallets do.',
      'early buyer sold $CLARP. as foretold.',
      'team took profits. transparency achieved.',
      'marketing wallet used for "marketing". (selling.)',
      'exactly what the tokenomics section described.',
    ],
    details: ['as documented: {amount}', 'per the website: {amount}', 'honesty delivered', 'promised rug: complete', 'roadmap: accurate'],
  },
  {
    type: 'cope',
    messages: [
      'says $CLARP is "actually bullish". narrator: it wasn\'t.',
      'called $CLARP losses "a learning experience".',
      'unironically said "i\'m in it for the satire".',
      'tweeted "zoom out" on 2 week old vaporware.',
      'posted diamond hands. site says "ngmi".',
      'said $CLARP team is "based for being honest".',
      'called -90% "expected for early projects".',
      'compared $CLARP to early bitcoin. interesting.',
      'said "at least they admit it" while crying.',
      '"the blank whitepaper is actually deep".',
      'claims $CLARP is "performance art". coping.',
      'said "comedy has value". down 97%.',
      '"i\'m supporting the message". the message is "ngmi".',
    ],
    details: ['copium: $CLARP strength', 'denial: artistic', 'meta-cope achieved', 'irony: terminal', 'self-aware: no'],
  },
  {
    type: 'ngmi',
    messages: [
      'new $CLARP holder minted. despite everything.',
      '$CLARP exit liquidity located. (you.)',
      'achievement: bought admitted vaporware.',
      'lesson will not be learned. $CLARP proves it.',
      'same degen. new ticker. same result.',
      '$CLARP portfolio: -99%. site accuracy: 100%.',
      'bought after reading all warnings. impressive.',
      'successfully funded the joke. thank you.',
      'financial advisor: a parody website.',
      'due diligence: read "none exist", bought.',
      'strategy: "the honesty is bullish".',
      'thesis: vaporware that admits it will win.',
      'conviction: until the 98.6% hits.',
      '$CLARP bag secured. dignity: questionable.',
    ],
    details: ['comedy tuition: {amount}', 'satire school: expensive', 'ngmi certificate: earned', 'exit liquidity: confirmed', 'lesson: unlearned'],
  },
];

const TYPE_CONFIG: Record<NotificationType, { icon: string; label: string; color: string }> = {
  buy: { icon: '↑', label: 'buy', color: 'text-larp-green' },
  sell: { icon: '↓', label: 'sell', color: 'text-larp-red' },
  panic: { icon: '!', label: 'panic', color: 'text-larp-yellow' },
  whale: { icon: '◆', label: 'whale', color: 'text-danger-orange' },
  cope: { icon: '○', label: 'cope', color: 'text-larp-purple' },
  ngmi: { icon: '✗', label: 'ngmi', color: 'text-larp-red' },
};

const generateNotification = (): Notification => {
  const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];
  const detailTemplate = template.details
    ? template.details[Math.floor(Math.random() * template.details.length)]
    : undefined;
  const detail = detailTemplate?.replace('{amount}', generateAmount());

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: template.type,
    message: `${generateWallet()} ${message}`,
    detail,
    timestamp: Date.now(),
  };
};

const NOTIFICATION_DURATION = 6000;
const FADE_DURATION = 300;
const MAX_VISIBLE = 3;

export default function ActivityNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [, setTick] = useState(0);
  const exitingRef = useRef<Set<string>>(new Set());

  const startExit = useCallback((id: string) => {
    if (exitingRef.current.has(id)) return;
    exitingRef.current.add(id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, exiting: true } : n))
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      exitingRef.current.delete(id);
    }, FADE_DURATION);
  }, []);

  const addNotification = useCallback(() => {
    const newNotification = generateNotification();

    setNotifications((prev) => {
      const nonExiting = prev.filter(n => !n.exiting);

      // If we already have MAX_VISIBLE non-exiting notifications, exit the oldest one
      if (nonExiting.length >= MAX_VISIBLE) {
        const oldest = nonExiting[nonExiting.length - 1];
        if (oldest && !exitingRef.current.has(oldest.id)) {
          setTimeout(() => startExit(oldest.id), 0);
        }
      }

      return [newNotification, ...prev];
    });

    // Schedule this notification to exit after duration
    setTimeout(() => {
      startExit(newNotification.id);
    }, NOTIFICATION_DURATION);
  }, [startExit]);

  const removeNotification = useCallback((id: string) => {
    startExit(id);
  }, [startExit]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Progress bar animation tick
  useEffect(() => {
    if (!isClient || notifications.length === 0) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isClient, notifications.length]);

  useEffect(() => {
    if (!isClient) return;

    // Initial notification after shorter delay
    const initialTimeout = setTimeout(() => {
      addNotification();
    }, 5000);

    // More frequent intervals
    const getRandomDelay = () => {
      const roll = Math.random();
      if (roll < 0.3) {
        // 30% chance: quick (5-10s)
        return 5000 + Math.random() * 5000;
      } else if (roll < 0.6) {
        // 30% chance: moderate (10-20s)
        return 10000 + Math.random() * 10000;
      } else if (roll < 0.85) {
        // 25% chance: slow (20-35s)
        return 20000 + Math.random() * 15000;
      } else {
        // 15% chance: longer pause (35-50s)
        return 35000 + Math.random() * 15000;
      }
    };

    const scheduleNext = () => {
      const delay = getRandomDelay();
      return setTimeout(() => {
        addNotification();
        intervalRef = scheduleNext();
      }, delay);
    };

    let intervalRef = scheduleNext();

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(intervalRef);
    };
  }, [isClient, addNotification]);

  if (!isClient) return null;

  return (
    <div
      className="fixed left-2 sm:left-4 z-[60] flex flex-col-reverse gap-2 pointer-events-none"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {notifications.map((notification) => {
        const config = TYPE_CONFIG[notification.type];
        const age = Date.now() - notification.timestamp;
        const progress = Math.max(0, 100 - (age / NOTIFICATION_DURATION) * 100);

        return (
          <div
            key={notification.id}
            className={`notification-toast bg-ivory-light border-2 border-slate-dark font-mono text-xs w-[280px] sm:w-[360px] pointer-events-auto ${
              notification.exiting ? 'animate-slide-out' : 'animate-slide-in'
            }`}
            style={{
              boxShadow: '4px 4px 0 var(--slate-dark)',
            }}
          >
            {/* Header with type badge */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-dark/30 bg-slate-dark/5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-current ${config.color}`}
                >
                  {config.icon}
                </span>
                <span className="text-slate-light text-[9px] uppercase tracking-wider">
                  {config.label}
                </span>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="w-4 h-4 flex items-center justify-center text-slate-light hover:text-larp-red hover:bg-larp-red/10 transition-colors text-[10px]"
              >
                ✗
              </button>
            </div>

            {/* Content */}
            <div className="px-3 py-1.5">
              <p className="text-slate-dark leading-tight text-[11px]">{notification.message}</p>
              {notification.detail && (
                <p className="text-slate-light text-[9px] mt-0.5 opacity-70">{notification.detail}</p>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-slate-dark/10 overflow-hidden">
              <div
                className="h-full bg-danger-orange transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
