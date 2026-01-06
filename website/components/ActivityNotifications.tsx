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
      'bought the top. again. idiot.',
      'aped in without reading anything',
      'fomo\'d at ath like a moron',
      'saw a tweet from a 19yo and market bought',
      'bought because the chart looked cool',
      'mortgaged house for shitcoins',
      'used rent money. landlord will understand.',
      'convinced this time is different',
      'bought a token named after a dog',
      'trusted "dyor" from a pfp account',
      'clicked a link in their dms',
      'bought because the ticker was funny',
      'market bought on a red candle',
      'averaged up instead of down',
      'went all in on a 2 day old token',
      'bought because discord said so',
      'leveraged their entire stack',
      'took out a loan to buy more',
      'sold eth to buy this',
      'paper traded successfully then lost real money',
    ],
    details: ['{amount} vaporized', 'bye bye {amount}', '{amount} → dev wallet', 'rip {amount}', '{amount} gone instantly'],
  },
  {
    type: 'sell',
    messages: [
      'panic sold at the literal bottom',
      'sold 5 minutes before 10x. classic.',
      'paper handed instantly. embarrassing.',
      'ragequit at -94%. it pumped after.',
      'sold the bottom to buy the top',
      'finally capitulated. watch it moon now.',
      'weak hands detected and punished',
      'sold for a loss to buy another loss',
      'market sold into no liquidity',
      'sold their whole bag for gas money',
      'couldn\'t handle a 5% dip',
      'sold because twitter told them to',
      'panic sold then fomo\'d back higher',
      'sold at a loss. twice. same day.',
      'got shaken out by a -2% move',
      'sold to "take profits" at -60%',
      'sold the bottom. bought the top. repeat.',
      'liquidated themselves somehow',
    ],
    details: ['donated {amount}', 'fumbled {amount}', 'skill issue', 'ngmi', 'L', 'massive L'],
  },
  {
    type: 'panic',
    messages: [
      'refreshing portfolio every 3 seconds',
      'posted "this is fine" while down 80%',
      'asking "wen moon" in a dead discord',
      'dm\'d a 16yo for "alpha"',
      'bought a $2000 trading course',
      'drew lines on a chart. felt smart.',
      'called their position "a long term hold" now',
      'googling "how to explain losses to wife"',
      'checking if binance has a refund policy',
      'considering becoming a "trader"',
      'just discovered what stop losses are',
      'learning what liquidation means the hard way',
      'texting "bro trust me" to friends',
      'watching charts at 3am. again.',
      'joining their 47th alpha discord',
      'asking if they should buy more',
      'writing a "trading strategy"',
      'blaming market makers for everything',
      'convinced there\'s a conspiracy against them',
      'asking how to report a rug to the sec',
      'looking up how to reverse a transaction',
      'wondering if their ledger is broken',
    ],
    details: ['copium: terminal', 'bags: crippling', 'hope: delusional', 'iq: low', 'stress: maximum'],
  },
  {
    type: 'whale',
    messages: [
      'dev just dumped on your head',
      'insider rugged. you were the exit.',
      'team wallet emptied. thanks for playing.',
      '"community wallet" withdrawn to bahamas',
      'liquidity pulled. doors locked.',
      'your favorite kol just sold. on you.',
      'smart money exit. dumb money bag.',
      'founder\'s "locked" tokens unlocked early',
      'marketing wallet sold for "expenses"',
      'advisor dumped their allocation',
      'early investor just market sold everything',
      'seed round exiting on your face',
      'vc unlocks hitting different today',
      'team "taking profit for runway"',
      'anonymous dev doxxed themselves accidentally',
      'treasury diversification = dump',
      '"strategic partner" strategically exited',
      'whale wallet moved to exchange. rip.',
    ],
    details: ['{amount} extracted', 'you funded this', 'exit liquidity: you', 'thanks for participating', 'L bozo'],
  },
  {
    type: 'cope',
    messages: [
      'unironically said "i\'m in it for the tech"',
      'called -90% a "healthy correction"',
      'tweeted "this is bullish" while bleeding',
      'said "zoom out" about a 3 week old token',
      'called themselves "early" at the top',
      'posted diamond hands while crying',
      'wrote "accumulating" in the discord. lying.',
      'said "weak hands getting shaken out"',
      'compared their bags to amazon in 2001',
      'unironically mentioned "generational wealth"',
      'called paper hands "ngmi" then panic sold',
      'said "i\'m comfortable with my position" (not)',
      'tweeted "this is the dip i wanted"',
      'called the dump "manipulation"',
      'said "only invest what you can afford to lose" after losing rent',
      'blamed the fed for their trades',
      'said they\'re "dca-ing" into a dead project',
      'called a scam "misunderstood"',
      'said "the fundamentals haven\'t changed"',
      'told themselves "at least i learned something"',
      'tweeted "still early" at -95%',
    ],
    details: ['coping hard', 'denial stage', 'see you at $0', 'delusion: max', 'hopium overdose'],
  },
  {
    type: 'ngmi',
    messages: [
      'new bag holder minted',
      'exit liquidity successfully located',
      'another victim acquired',
      'darwin award: financial edition',
      'lesson will not be learned',
      'same mistake. 47th time.',
      'portfolio update: still poor',
      'net worth approaching zero',
      'bought high sold low speedrun',
      'achievement unlocked: bag holder',
      'successfully donated to devs',
      'trading career: -99% and counting',
      'retirement plan: destroyed',
      'financial advisor: twitter',
      'risk management: none',
      'due diligence: skipped',
      'strategy: vibes only',
      'analysis: the chart goes up',
      'thesis: number go up technology',
      'research: read the ticker',
      'conviction: until first red candle',
      'holding: until it goes to zero',
      'learning: no',
      'improving: also no',
    ],
    details: ['tuition: {amount}', 'expensive lesson', 'won\'t learn anyway', 'certified ngmi', 'skill issue fr'],
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

    // Initial notification after short delay
    const initialTimeout = setTimeout(() => {
      addNotification();
    }, 3000);

    // Sporadic intervals - sometimes rapid bursts, sometimes long pauses
    const getRandomDelay = () => {
      const roll = Math.random();
      if (roll < 0.15) {
        // 15% chance: rapid burst (0.8-1.5s)
        return 800 + Math.random() * 700;
      } else if (roll < 0.35) {
        // 20% chance: quick (2-4s)
        return 2000 + Math.random() * 2000;
      } else if (roll < 0.7) {
        // 35% chance: normal (5-10s)
        return 5000 + Math.random() * 5000;
      } else if (roll < 0.9) {
        // 20% chance: slow (12-20s)
        return 12000 + Math.random() * 8000;
      } else {
        // 10% chance: long pause (25-40s)
        return 25000 + Math.random() * 15000;
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
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col-reverse gap-2 max-w-[320px] sm:max-w-[360px]">
      {notifications.map((notification) => {
        const config = TYPE_CONFIG[notification.type];
        const age = Date.now() - notification.timestamp;
        const progress = Math.max(0, 100 - (age / NOTIFICATION_DURATION) * 100);

        return (
          <div
            key={notification.id}
            className={`notification-toast bg-ivory-light border-2 border-slate-dark font-mono text-xs sm:text-sm ${
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
