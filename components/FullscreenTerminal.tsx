'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface FullscreenTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AnimationState = 'closed' | 'opening' | 'open' | 'closing';

interface FileSystemNode {
  type: 'file' | 'directory';
  content?: string;
  children?: Record<string, FileSystemNode>;
}

// The satirical filesystem - deadpan crypto humor
const FILESYSTEM: Record<string, FileSystemNode> = {
  home: {
    type: 'directory',
    children: {
      jeet: {
        type: 'directory',
        children: {
          'cope.txt': {
            type: 'file',
            content: `COPE JOURNAL - DAY 347

bought the top again. this is fine.
"we're so back" - said 47 times this month
"it's just a healthy correction" - trust
"diamond hands" - can't sell anyway, no liquidity
"the tech is solid" - haven't read the code
"team is shipping" - last github commit: 8 months ago

tomorrow will be different.
it won't be.`,
          },
          'bags.txt': {
            type: 'file',
            content: `CURRENT HOLDINGS (all underwater)

$SAFEMOON     -99.7%  "it's called safe for a reason"
$SQUID        -100%   couldn't sell (feature not bug)
$LUNA         -100%   "algorithmic stability"
$FTT          -100%   "backed by real assets"
$CLARP        ???%    at least this one's honest

total portfolio value: mass delusion
unrealized losses: realized eventually
exit strategy: there isn't one`,
          },
          'alpha_leaks': {
            type: 'directory',
            children: {
              'real_alpha.txt': {
                type: 'file',
                content: `REAL ALPHA (free)

1. every project is vaporware until proven otherwise
2. "coming soon" means never
3. the roadmap is fiction
4. if you saw it on twitter, you're already late
5. the team is "doxxed" to each other
6. "audited" means someone glanced at it
7. your mass is their exit liquidity
8. the tech doesn't matter
9. it was always about the token
10. you will ignore this and buy anyway`,
              },
              'insider_info.txt': {
                type: 'file',
                content: `INSIDER INFORMATION

the insider information is that there is no insider information.
everyone is guessing.
the "whales" are just bigger gamblers.
the "smart money" got lucky once and now has a newsletter.

the real insider info:
- founders sell at launch
- VCs dump on you
- influencers are paid
- none of this is financial advice
- all of this is financial advice`,
              },
              'market_secrets.txt': {
                type: 'file',
                content: `MARKET SECRETS THE ELITES DON'T WANT YOU TO KNOW

1. number go up: good
2. number go down: bad
3. there is no step 3

additional secrets:
- buy high sell low (you will do this)
- zoom out (copium)
- we're early (you're late)
- DYOR (copy someone else's research)
- NFA (definitely financial advice)
- WAGMI (we're all gonna make it) (we're not)`,
              },
              'paid_group_leak.txt': {
                type: 'file',
                content: `LEAKED FROM $500/MONTH ALPHA GROUP

[message from admin]
"hey guys new play dropping soon"
"can't say much but trust me on this one"
"loading up my bags rn"

[3 hours later]
"okay so the play was [REDACTED]"
"some of you got in congrats"
"for everyone else there's always next time"

[next day]
"new play dropping soon"

this message repeats forever.
you keep paying.`,
              },
            },
          },
          'my_strategy.md': {
            type: 'file',
            content: `# TRADING STRATEGY

1. see token on twitter
2. check if up 1000% already
3. buy anyway
4. watch it dump
5. convince yourself to hold
6. it dumps more
7. finally sell at -90%
8. watch it 10x the next day
9. repeat

win rate: 0%
confidence: unwavering`,
          },
          '.bash_history': {
            type: 'file',
            content: `buy $PEPE
buy $WOJAK
buy $COPIUM
why
sell all --force
cat /dev/null > my_savings
sudo rm -rf /hope
wen moon
wen wen
exit`,
          },
        },
      },
    },
  },
  var: {
    type: 'directory',
    children: {
      log: {
        type: 'directory',
        children: {
          rugs: {
            type: 'directory',
            children: {
              'rug_2024_001.log': {
                type: 'file',
                content: `[2024-01-15 03:42:17] INFO: New token deployed: $DEFINITELY_NOT_A_RUG
[2024-01-15 03:42:18] INFO: Liquidity added: $50,000
[2024-01-15 03:42:19] INFO: Twitter raid initiated
[2024-01-15 03:42:20] INFO: "STEALTH LAUNCH" announced to 47 telegram groups
[2024-01-15 03:45:00] INFO: Market cap: $2.3M
[2024-01-15 03:47:33] WARN: Dev wallet moving
[2024-01-15 03:47:34] ERROR: Liquidity removed
[2024-01-15 03:47:34] FATAL: Token value: $0.00
[2024-01-15 03:47:35] INFO: Dev tweets "sorry fam, got hacked"
[2024-01-15 03:47:36] INFO: Dev launches new token
[2024-01-15 03:47:37] INFO: You buy the new token`,
              },
              'rug_2024_002.log': {
                type: 'file',
                content: `[2024-02-03 14:20:00] INFO: "AI AGENT" token launched
[2024-02-03 14:20:01] INFO: Whitepaper: ChatGPT API wrapped in mystery
[2024-02-03 14:20:02] INFO: Claims: "41% win rate" (source: trust me)
[2024-02-03 14:20:03] INFO: Executes: 0 actual trades
[2024-02-03 14:25:00] INFO: Market cap: $50M
[2024-02-03 14:30:00] WARN: Someone reads the code
[2024-02-03 14:30:01] WARN: It's literally console.log("thinking...")
[2024-02-03 14:30:02] ERROR: Price discovery: initiated
[2024-02-03 14:35:00] INFO: Team announces "V2 coming Q2"
[2024-02-03 14:35:01] INFO: It's still Q2. It's always Q2.`,
              },
              'rug_pattern.log': {
                type: 'file',
                content: `STANDARD RUG TIMELINE (for reference)

T+0min:   "stealth launch" (told 5000 people)
T+2min:   influencer tweets (already bought at T-1min)
T+5min:   you see the tweet
T+6min:   you buy
T+7min:   ATH reached (your entry)
T+8min:   "healthy pullback"
T+15min:  dev "steps away for family emergency"
T+20min:  liquidity: gone
T+21min:  you're still holding
T+∞:      "diamond hands"

this pattern has a 98.6% success rate.
for them, not you.`,
              },
            },
          },
          'audit.log': {
            type: 'file',
            content: `[AUDIT COMPLETE]

Auditor: CertiK (paid $200k)
Result: PASSED

Findings ignored:
- Critical: Admin can mint unlimited tokens
- Critical: No timelock on liquidity
- High: Wallet can be blacklisted arbitrarily
- High: Contract is a fork of known rug
- Medium: Code comments are in comic sans

Team response: "These are features, not bugs"
Badge added to website: Yes
Anyone read it: No`,
          },
        },
      },
    },
  },
  etc: {
    type: 'directory',
    children: {
      roadmap: {
        type: 'file',
        content: `$CLARP OFFICIAL ROADMAP
========================

Q1 2025: Launch
  [x] Deploy token
  [x] Make website
  [x] Post on twitter
  [x] Exist

Q2 2025: Growth
  [ ] Partnerships (pending)
  [ ] Exchange listings (pending)
  [ ] Product development (pending)
  [ ] Everything else (pending)

Q3 2025: See Q2 2025

Q4 2025: See Q3 2025

Q∞ 2025: Ship actual product
  Status: Coming Q2

Note: This roadmap will not be updated.
Like all roadmaps.`,
      },
      'tokenomics.conf': {
        type: 'file',
        content: `# TOKENOMICS CONFIGURATION
# "fair launch" edition

TOTAL_SUPPLY=1000000000000
TEAM_ALLOCATION=0%  # (already bought via 47 wallets pre-launch)
MARKETING=10%       # (pays for kol bundles)
DEVELOPMENT=5%      # (new chains on uniswap)
LIQUIDITY=3%        # (until removed)
COMMUNITY=82%       # (exit liquidity)

# Vesting schedule
TEAM_VEST=0 days    # "aligned with community"
MARKETING_VEST=lol
LIQUIDITY_LOCK=2 hours (or until bored)

# Tax
BUY_TAX=5%
SELL_TAX=99%        # jk. maybe.`,
      },
      motd: {
        type: 'file',
        content: `
 ██████╗██╗      █████╗ ██████╗ ██████╗
██╔════╝██║     ██╔══██╗██╔══██╗██╔══██╗
██║     ██║     ███████║██████╔╝██████╔╝
██║     ██║     ██╔══██║██╔══██╗██╔═══╝
╚██████╗███████╗██║  ██║██║  ██║██║
 ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝

welcome to the clarp development environment.
there is no development. there is no environment.
type 'help' if you need it. you do.`,
      },
    },
  },
  dev: {
    type: 'directory',
    children: {
      null: {
        type: 'file',
        content: `> your investment
> your time spent on crypto twitter
> that "alpha" discord subscription
> the gas fees
> the hope

all redirected here successfully.`,
      },
      random: {
        type: 'file',
        content: `GENERATING RANDOM TRADING ADVICE...

Result: Buy high, sell low.

This has been your daily alpha.
Same as yesterday.
Same as tomorrow.`,
      },
      urandom: {
        type: 'file',
        content: `GENERATING VERY RANDOM TRADING ADVICE...

Result: Have you considered just holding cash?

Error: Advice too sensible. Regenerating...

Result: Ape into the next dog coin.

Much better.`,
      },
    },
  },
  usr: {
    type: 'directory',
    children: {
      bin: {
        type: 'directory',
        children: {
          ship: {
            type: 'file',
            content: `#!/bin/bash
# ship - deploy product to production

echo "Error: Product not found"
echo "Error: Product never found"
echo "Error: Product will never be found"
echo ""
echo "Try again Q2.
echo "It's always Q2."

exit 1

# Note: This script has never been executed.
# Note: This script will never be executed.`,
          },
          profit: {
            type: 'file',
            content: `#!/bin/bash
# profit - realize gains

if [ "$PORTFOLIO" -gt 0 ]; then
    echo "Congratulations. This branch is unreachable."
else
    echo "Expected outcome achieved."
    echo "You are functioning as designed."
fi

# Fun fact: No one has ever reached the if branch.
# The else branch has 47 million executions.`,
          },
          moon: {
            type: 'file',
            content: `#!/bin/bash
# moon - reach astronomical valuations

echo "Calculating trajectory..."
sleep infinity

# The sleep command represents your holding period.
# It never completes.
# Neither do you.`,
          },
        },
      },
      share: {
        type: 'directory',
        children: {
          'wisdom.txt': {
            type: 'file',
            content: `COLLECTED WISDOM FROM CRYPTO TWITTER

"WAGMI" - narrator: they did not all make it
"This is gentlemen" - it wasn't
"Few understand" - fewer wanted to
"LFG" - they went. to zero.
"Not selling" - couldn't find buyers anyway
"Generational wealth" - for the dev, yes
"Diamond hands" - more like cement shoes
"DYOR" - translated: "don't blame me when this rugs"
"NFA" - always precedes FA
"Bullish" - said at every price point, including -99%

Use responsibly. You won't.`,
          },
        },
      },
    },
  },
  tmp: {
    type: 'directory',
    children: {
      'hopium.cache': {
        type: 'file',
        content: `HOPIUM CACHE - DO NOT DELETE (you will anyway)

Entry 1: "This time is different"
Entry 2: "The fundamentals are strong"
Entry 3: "Smart money is accumulating"
Entry 4: "The team is doxxed" (pseudonymous anime pfps)
Entry 5: "Audit passed" (paid audit, ignored findings)
Entry 6: "Liquidity locked" (for 24 hours)
Entry 7: "We're so early"
Entry 8: "Think about where ETH was in 2017"
Entry 9: "This is the one"
Entry 10: See Entry 1

Cache full. Clearing...
Cache refilled immediately.`,
      },
      'portfolio_recovery_plan.txt': {
        type: 'file',
        content: `PORTFOLIO RECOVERY PLAN
=======================

Step 1: Accept the loss
        Status: Skipped

Step 2: Stop trading
        Status: "One more trade to make it back"

Step 3: Learn from mistakes
        Status: "It was manipulation"

Step 4: Touch grass
        Status: Grass is a rug

Step 5: Move on
        Status: Downloaded another trading app

Recovery progress: -47%
Time to recovery: N/A`,
      },
    },
  },
  root: {
    type: 'directory',
    children: {
      '.secret_alpha': {
        type: 'file',
        content: `you found the secret file.

the alpha is: there is no alpha.
the edge is: there is no edge.
the opportunity is: your money leaving your wallet.

congratulations on your discovery.
it changes nothing.

- the dev (not doxxed)`,
      },
    },
  },
};

// Command outputs and easter eggs
const EASTER_EGGS: Record<string, string> = {
  rug: `initiating rug protocol...

[##########] 100%

liquidity removed.
twitter deleted.
telegram archived.
you: still holding.

just like the simulation.
because this is the simulation.`,

  moon: `calculating moon trajectory...

current price: $0.00000001
target price: $1.00
required gain: 10,000,000,000%

probability: yes (in your dreams)
reality: no

keep holding. it'll work eventually.
it won't.`,

  wagmi: `WAGMI STATUS CHECK
==================

you: ngmi
them: gmi (already sold)
us: there is no us
we: see above

final verdict: wagmi is a collective delusion.
some made it.
you are not some.`,

  gm: `gm.

it's 3am. you're checking charts.
this is not good morning behavior.
this is degenerate behavior.

the sun will rise.
your portfolio will not.

gm anyway.`,

  wen: `wen: a comprehensive timeline

wen moon: never
wen lambo: public transit
wen product: q2 (always q2)
wen profit: see 'wen moon'
wen recovery: see therapist
wen sense: left the chat

hope this helps.
it won't.`,

  lambo: `LAMBO CALCULATOR
================

your portfolio: $47.23
lambo cost: $250,000
required multiplier: 5,291x

at current trajectory:
- time to lambo: heat death of universe
- alternative vehicle: bus pass
- copium required: infinite

recommendation: the bus is fine.
buses are honest. buses don't rug.`,

  sudo: `you are not in the sudoers file.
nobody is.
there is no admin.
there is no control.
there is only chaos and memecoins.

this incident will be reported.
to no one. no one is listening.`,

  vim: `why are you trying to use vim?

there's nothing to edit.
there's no code.
there's no product.

but if there was code, and you opened vim:
you'd still be trying to exit.

:q!
:wq
:x
^C
^Z
help

none of these work in this terminal either.`,

  npm: `npm ERR! 404 Not Found - GET https://registry.npmjs.org/clarp
npm ERR! 404 'clarp@latest' is not in the npm registry.
npm ERR! 404
npm ERR! 404 You should definitely not bug the author to publish it.
npm ERR! 404 There is no author.
npm ERR! 404 There is no package.
npm ERR! 404 There is only this error message.

npm ERR! A complete log of this run can be found in: /dev/null`,

  git: `fatal: not a git repository (or any of the parent directories)

there's no repo because there's no code.
there's no code because there's no product.
there's no product because there's no point.

git gud at accepting this.`,

  curl: `curl: (7) Failed to connect to api.clarp.dev port 443: Connection refused

the api doesn't exist.
the server doesn't exist.
the backend doesn't exist.

but the frontend looks nice, doesn't it?
that's all that matters in crypto.`,

  ping: `PING reality (127.0.0.1): 56 data bytes
Request timeout for icmp_seq 0
Request timeout for icmp_seq 1
Request timeout for icmp_seq 2

--- reality ping statistics ---
3 packets transmitted, 0 packets received, 100.0% packet loss

reality is unreachable.
this is expected in crypto.`,

  man: `No manual entry for hope.
No manual entry for profit.
No manual entry for success.

Try 'man cope' instead.
Also not found, but more relevant.`,

  top: `top - 03:47:00 up 347 days, 0 users, load average: infinite

Tasks:   1 total,   0 running,   1 delusion
%Cpu(s): 99.9 copium, 0.1 reality
MiB Mem :  4096 total,  0 free, 4096 bags

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM COMMAND
    1 jeet      20   0  999999  99999  0     R  99.9  99.9  checking-charts

you've been running this process for 347 days.
it has produced nothing.
it will produce nothing.
you will not stop it.`,
};

const HELP_TEXT = `CLARP TERMINAL v0.0.1 (there will be no v0.0.2)

available commands:
  ls [path]     list directory contents (mostly disappointment)
  cd <path>     change directory (won't change your situation)
  cat <file>    display file contents (display your mistakes)
  pwd           print working directory (it's not working)
  clear         clear terminal (can't clear your losses)
  whoami        display current user (exit liquidity)
  help          show this message (you need it)
  exit          close terminal (won't close your positions)

hidden commands exist. finding them won't help.

pro tip: the real command was the friends you lost to crypto along the way.`;

const WHOAMI_TEXT = `jeet

uid=1000(jeet) gid=1000(bagholders) groups=1000(bagholders),27(exit-liquidity),1001(ngmi)

you are user 'jeet'.
you have always been user 'jeet'.
you thought you were different.
you weren't.`;

export default function FullscreenTerminal({ isOpen, onClose }: FullscreenTerminalProps) {
  const [history, setHistory] = useState<Array<{ command: string; output: string }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/jeet');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [animationState, setAnimationState] = useState<AnimationState>('closed');

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Handle open/close animation states
  useEffect(() => {
    if (isOpen && animationState === 'closed') {
      setAnimationState('opening');
      const timer = setTimeout(() => setAnimationState('open'), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationState]);

  const handleClose = useCallback(() => {
    if (animationState === 'open' || animationState === 'opening') {
      setAnimationState('closing');
      setTimeout(() => {
        setAnimationState('closed');
        onClose();
      }, 500);
    }
  }, [animationState, onClose]);

  // Initial boot message
  useEffect(() => {
    if (isOpen && history.length === 0) {
      const bootMessage = `CLARP OS v0.0.1 (Kernel: none)
Last login: Never (you just got here)
System status: Perpetually "almost ready"

${FILESYSTEM.etc?.children?.motd?.content || ''}

`;
      setHistory([{ command: '', output: bootMessage }]);
    }
  }, [isOpen, history.length]);

  // Focus input when animation completes
  useEffect(() => {
    if (animationState === 'open' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [animationState]);

  // Scroll to bottom on new output
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // ESC to close - capture phase to ensure it fires before input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true); // capture phase
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleClose]);

  const resolvePath = useCallback((path: string): string => {
    if (path.startsWith('/')) {
      return path;
    }

    if (path === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }

    if (path === '.') {
      return currentPath;
    }

    if (path.startsWith('./')) {
      path = path.slice(2);
    }

    return currentPath === '/' ? `/${path}` : `${currentPath}/${path}`;
  }, [currentPath]);

  const getNode = useCallback((path: string): FileSystemNode | null => {
    const parts = path.split('/').filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = FILESYSTEM;

    for (const part of parts) {
      if (current && typeof current === 'object' && 'type' in current && current.type === 'directory' && current.children) {
        current = current.children;
      }

      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    if (!current) return null;

    // If we're at the root FILESYSTEM level (no type property), wrap it as a directory
    if (!('type' in current)) {
      return { type: 'directory', children: current };
    }

    return current as FileSystemNode;
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const [command, ...args] = trimmed.split(/\s+/);
    let output = '';

    // Add to command history
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Check easter eggs first
    if (EASTER_EGGS[command.toLowerCase()]) {
      output = EASTER_EGGS[command.toLowerCase()];
    } else {
      switch (command.toLowerCase()) {
        case 'ls': {
          const targetPath = args[0] ? resolvePath(args[0]) : currentPath;
          const node = getNode(targetPath);

          if (!node) {
            output = `ls: cannot access '${args[0] || targetPath}': No such file or directory\n(like most things in crypto)`;
          } else if (node.type === 'file') {
            output = args[0] || targetPath.split('/').pop() || '';
          } else if (node.children) {
            const items = Object.entries(node.children).map(([name, n]) => {
              if (n.type === 'directory') {
                return `<dir>${name}/</dir>`;
              }
              return name;
            });
            output = items.join('  ') || '(empty, like your portfolio)';
          }
          break;
        }

        case 'cd': {
          if (!args[0] || args[0] === '~') {
            setCurrentPath('/home/jeet');
            output = '(returned home. still no profit here either.)';
          } else {
            const targetPath = resolvePath(args[0]);
            const node = getNode(targetPath);

            if (!node) {
              output = `cd: no such file or directory: ${args[0]}\n(destination doesn't exist. like your exit strategy.)`;
            } else if (node.type === 'file') {
              output = `cd: not a directory: ${args[0]}\n(you can't enter a file. you can't exit your position either.)`;
            } else {
              setCurrentPath(targetPath === '' ? '/' : targetPath);
              output = '';
            }
          }
          break;
        }

        case 'cat': {
          if (!args[0]) {
            output = 'cat: missing operand\n(like your missing stop-losses)';
          } else {
            const targetPath = resolvePath(args[0]);
            const node = getNode(targetPath);

            if (!node) {
              output = `cat: ${args[0]}: No such file or directory\n(file not found. funds not found either.)`;
            } else if (node.type === 'directory') {
              output = `cat: ${args[0]}: Is a directory\n(you can't read a directory. you can't read charts either, apparently.)`;
            } else {
              output = node.content || '(empty file)';
            }
          }
          break;
        }

        case 'pwd':
          output = `${currentPath}\n(you are here. you've been here. you'll stay here.)`;
          break;

        case 'clear':
          setHistory([]);
          return;

        case 'whoami':
          output = WHOAMI_TEXT;
          break;

        case 'help':
          output = HELP_TEXT;
          break;

        case 'exit':
        case 'quit':
        case 'q':
          output = 'exiting terminal...\n(if only exiting your positions was this easy)';
          setTimeout(handleClose, 1000);
          break;

        default:
          output = `${command}: command not found\n\nthis is a fake terminal.\nthere are no real commands.\nthere is no real product.\n\ntype 'help' for available commands.\nthey won't help, but they exist.`;
      }
    }

    // Add command and output to history instantly
    setHistory(prev => [...prev, { command: trimmed, output }]);
  }, [currentPath, resolvePath, getNode, handleClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Basic tab completion for paths
      const parts = currentInput.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const targetPath = resolvePath(lastPart.replace(/[^/]*$/, ''));
        const searchTerm = lastPart.split('/').pop() || '';
        const node = getNode(targetPath === '' ? currentPath : targetPath);

        if (node?.type === 'directory' && node.children) {
          const matches = Object.keys(node.children).filter(name =>
            name.startsWith(searchTerm)
          );
          if (matches.length === 1) {
            parts[parts.length - 1] = lastPart.replace(/[^/]*$/, '') + matches[0];
            if (node.children[matches[0]].type === 'directory') {
              parts[parts.length - 1] += '/';
            }
            setCurrentInput(parts.join(' '));
          }
        }
      }
    }
  };

  if (animationState === 'closed') return null;

  return (
    <div
      className={`fixed inset-0 z-[200] terminal-crt-container ${
        animationState === 'opening' ? 'terminal-power-on' : ''
      }${animationState === 'closing' ? 'terminal-power-off' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRT screen effect overlay */}
      <div className="terminal-crt-screen bg-slate-dark">
        {/* Scanline flash on open */}
        {animationState === 'opening' && <div className="terminal-scanline-flash" />}

        {/* Construction stripe header */}
        <div className="construction-stripe h-2" />

        {/* Terminal header */}
        <div className="terminal-header shrink-0">
          <div
            className="terminal-dot bg-larp-red opacity-50 cursor-not-allowed"
            title="there's no getting out of this hole"
          />
          <div
            className="terminal-dot bg-larp-yellow cursor-pointer hover:brightness-125 transition-all"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            title="minimize (closes it)"
          />
          <div
            className="terminal-dot bg-larp-green opacity-50 cursor-not-allowed"
            title="you're already maximized. like your losses."
          />
          <span className="ml-3 text-xs text-ivory-light/50 font-mono">terminal</span>
          <span className="ml-auto text-[10px] text-ivory-light/30 font-mono hidden sm:block">
            press ESC to exit (your only successful exit)
          </span>
        </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="h-[calc(100vh-3rem-8px)] overflow-y-auto overflow-x-hidden p-4 sm:p-6 font-mono text-sm text-ivory-light"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 107, 53, 0.02) 2px,
            rgba(255, 107, 53, 0.02) 4px
          )`
        }}
      >
        {/* Command history */}
        {history.map((entry, i) => (
          <div key={i} className="mb-4">
            {entry.command && (
              <div className="flex items-start gap-2 mb-1">
                <span className="text-larp-green shrink-0">jeet@clarp</span>
                <span className="text-ivory-light/50">:</span>
                <span className="text-clay shrink-0">{currentPath}</span>
                <span className="text-ivory-light/50">$</span>
                <span className="text-ivory-light">{entry.command}</span>
              </div>
            )}
            <pre
              className="whitespace-pre-wrap text-ivory-light/80 ml-0 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: entry.output
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/&lt;dir&gt;/g, '<span class="text-sky-400">')
                  .replace(/&lt;\/dir&gt;/g, '</span>')
                  // Style the ASCII logo in orange with glow
                  .replace(/([ ]██████╗██╗[\s\S]*?╚═════╝╚══════╝╚═╝[ ]{2}╚═╝╚═╝[ ]{2}╚═╝╚═╝)/g,
                    '<span class="text-danger-orange" style="text-shadow: 0 0 10px rgba(255, 107, 53, 0.5), 0 0 20px rgba(255, 107, 53, 0.3);">$1</span>'
                  )
              }}
            />
          </div>
        ))}

        {/* Current input line */}
        <div className="flex items-start gap-2">
            <span className="text-larp-green shrink-0">jeet@clarp</span>
            <span className="text-ivory-light/50">:</span>
            <span className="text-clay shrink-0">{currentPath}</span>
            <span className="text-ivory-light/50">$</span>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none text-ivory-light caret-danger-orange"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
