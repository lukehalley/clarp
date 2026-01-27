'use client';

import { useRouter } from 'next/navigation';
import {
  Radar,
  CheckCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  Code,
  Users,
  Search,
} from 'lucide-react';
import FeedSection from './FeedSection';
import type { EntityCategory, KOLEntity, DevEntity, UnifiedEntity } from '@/types/unified-terminal';
import { formatHandle, isValidHandle } from '@/types/xintel';

// =============================================================================
// MOCK DATA - Replace with real data from Supabase
// =============================================================================

// Top KOLs - ranked by win rate and trust score
const MOCK_TOP_KOLS: KOLEntity[] = [
  {
    id: '1',
    category: 'kol',
    handle: 'ansem',
    displayName: 'Ansem',
    trustScore: { score: 82, tier: 'trusted', confidence: 'high', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 72, topVouchers: [] },
    tags: ['solana', '68% win rate', '48 calls'],
    lastScanAt: new Date(),
    followers: 450000,
    accountAgeDays: 1200,
    callTrackRecord: {
      totalCalls: 48,
      winRate: 68,
      avgReturn: 340,
      avgPeakMultiple: 4.2,
      rugsPromoted: 2,
      recentCalls: [],
    },
    topInteractions: [],
    recentActivity: { postsPerWeek: 45, engagementRate: 8.2, shillFrequency: 35 },
  },
  {
    id: '2',
    category: 'kol',
    handle: 'blknoiz06',
    displayName: 'Blknoiz',
    trustScore: { score: 72, tier: 'trusted', confidence: 'medium', trend: 'rising', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 60, topVouchers: [] },
    tags: ['memecoins', '52% win rate', '156 calls'],
    lastScanAt: new Date(),
    followers: 280000,
    accountAgeDays: 800,
    callTrackRecord: {
      totalCalls: 156,
      winRate: 52,
      avgReturn: 180,
      avgPeakMultiple: 3.8,
      rugsPromoted: 8,
      recentCalls: [],
    },
    topInteractions: [],
    recentActivity: { postsPerWeek: 120, engagementRate: 5.4, shillFrequency: 75 },
  },
  {
    id: '3',
    category: 'kol',
    handle: 'deaborysux',
    displayName: 'Deborah',
    trustScore: { score: 78, tier: 'trusted', confidence: 'high', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 65, topVouchers: [] },
    tags: ['analysis', '61% win rate', '89 calls'],
    lastScanAt: new Date(),
    followers: 185000,
    accountAgeDays: 950,
    callTrackRecord: {
      totalCalls: 89,
      winRate: 61,
      avgReturn: 220,
      avgPeakMultiple: 3.1,
      rugsPromoted: 3,
      recentCalls: [],
    },
    topInteractions: [],
    recentActivity: { postsPerWeek: 30, engagementRate: 6.8, shillFrequency: 25 },
  },
];

// Top Devs - ranked by shipping history
const MOCK_TOP_DEVS: DevEntity[] = [
  {
    id: '4',
    category: 'dev',
    handle: 'taborj',
    displayName: 'Tabor',
    bio: 'Building Jupiter',
    trustScore: { score: 94, tier: 'verified', confidence: 'high', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 85, topVouchers: [] },
    tags: ['jupiter', '3 shipped', 'active'],
    lastScanAt: new Date(),
    followers: 125000,
    projects: [{ name: 'Jupiter', role: 'Founder', status: 'active' }],
    commitActivity: { totalCommits: 2400, recentCommits30d: 45, languages: ['Rust', 'TypeScript'] },
    shippedProducts: 3,
    abandonedProducts: 0,
  },
  {
    id: '5',
    category: 'dev',
    handle: 'armaniferrante',
    displayName: 'Armani',
    bio: 'Anchor, Backpack',
    trustScore: { score: 96, tier: 'verified', confidence: 'high', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 92, topVouchers: [] },
    tags: ['anchor', '5 shipped', 'active'],
    lastScanAt: new Date(),
    followers: 89000,
    projects: [
      { name: 'Anchor', role: 'Creator', status: 'active' },
      { name: 'Backpack', role: 'Founder', status: 'active' },
    ],
    commitActivity: { totalCommits: 4800, recentCommits30d: 28, languages: ['Rust', 'TypeScript'] },
    shippedProducts: 5,
    abandonedProducts: 0,
  },
  {
    id: '6',
    category: 'dev',
    handle: 'aaboronkov',
    displayName: 'Anton',
    bio: 'Marinade Finance',
    trustScore: { score: 88, tier: 'trusted', confidence: 'high', trend: 'rising', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 78, topVouchers: [] },
    tags: ['marinade', '2 shipped', 'active'],
    lastScanAt: new Date(),
    followers: 42000,
    projects: [{ name: 'Marinade', role: 'Lead Dev', status: 'active' }],
    commitActivity: { totalCommits: 1800, recentCommits30d: 62, languages: ['Rust', 'TypeScript'] },
    shippedProducts: 2,
    abandonedProducts: 0,
  },
];

// Recently scanned - what users are checking
const MOCK_RECENTLY_SCANNED: UnifiedEntity[] = [
  {
    id: '7',
    category: 'kol',
    handle: 'cryptobanter',
    displayName: 'Crypto Banter',
    trustScore: { score: 45, tier: 'caution', confidence: 'medium', trend: 'falling', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 25, topVouchers: [] },
    tags: ['youtube', 'paid promos'],
    lastScanAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: '8',
    category: 'dev',
    handle: 'rawfalafel',
    displayName: 'raw falafel',
    trustScore: { score: 76, tier: 'trusted', confidence: 'medium', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 58, topVouchers: [] },
    tags: ['tensor', 'nft'],
    lastScanAt: new Date(Date.now() - 1000 * 60 * 12), // 12 min ago
  },
  {
    id: '9',
    category: 'kol',
    handle: 'notthreadguy',
    displayName: 'Thread Guy',
    trustScore: { score: 62, tier: 'neutral', confidence: 'low', trend: 'stable', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 40, topVouchers: [] },
    tags: ['threads', 'analysis'],
    lastScanAt: new Date(Date.now() - 1000 * 60 * 28), // 28 min ago
  },
];

// Warnings - flagged accounts
const MOCK_WARNINGS: UnifiedEntity[] = [
  {
    id: '10',
    category: 'kol',
    handle: 'cryptoscammer',
    displayName: 'Crypto Alpha',
    trustScore: { score: 12, tier: 'danger', confidence: 'high', trend: 'falling', lastUpdated: new Date() },
    vouchNetwork: { incomingVouches: [], outgoingVouches: [], vouchScore: 5, topVouchers: [] },
    tags: ['rug x3', 'avoid'],
    lastScanAt: new Date(),
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function UnifiedHomePage() {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    if (!query?.trim()) return;

    const normalized = formatHandle(query);
    if (query.startsWith('@') || isValidHandle(normalized)) {
      router.push(`/terminal/xintel?q=${encodeURIComponent(normalized)}`);
    } else {
      router.push(`/terminal/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Compact with search */}
      <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-ivory-light/10 shrink-0">
        <div className="flex items-center gap-2">
          <Radar size={20} className="text-danger-orange" />
          <h1 className="text-lg font-mono font-bold text-ivory-light">
            <span className="text-danger-orange">CLARP</span> TERMINAL
          </h1>
          <span className="text-ivory-light/30 font-mono text-xs hidden sm:block">
            Find real builders & reliable KOLs
          </span>
        </div>

        {/* Compact search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ivory-light/5 border border-ivory-light/20 hover:border-ivory-light/40 transition-colors">
            <Search size={14} className="text-ivory-light/40" />
            <input
              type="text"
              name="q"
              placeholder="@handle"
              className="bg-transparent text-ivory-light font-mono text-sm w-24 sm:w-32 outline-none placeholder:text-ivory-light/30"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-danger-orange text-black font-mono text-xs font-bold border border-black hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
            style={{ boxShadow: '2px 2px 0 black' }}
          >
            SCAN
          </button>
        </form>
      </div>

      {/* Main Grid - 4 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2">
        {/* Column 1: Top KOLs */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-ivory-light/[0.02] border border-ivory-light/10 p-2">
          <FeedSection
            title="Top KOLs"
            icon={<TrendingUp size={14} />}
            iconColor="#9B59B6"
            entities={MOCK_TOP_KOLS}
            viewAllHref="/terminal/leaderboard/kols"
            emptyMessage="No KOLs ranked yet"
          />
        </div>

        {/* Column 2: Top Devs */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-ivory-light/[0.02] border border-ivory-light/10 p-2">
          <FeedSection
            title="Top Builders"
            icon={<Code size={14} />}
            iconColor="#22c55e"
            entities={MOCK_TOP_DEVS}
            viewAllHref="/terminal/leaderboard/builders"
            emptyMessage="No builders ranked yet"
          />
        </div>

        {/* Column 3: Recently Scanned */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-ivory-light/[0.02] border border-ivory-light/10 p-2">
          <FeedSection
            title="Recently Scanned"
            icon={<Clock size={14} />}
            iconColor="#6b7280"
            entities={MOCK_RECENTLY_SCANNED}
            emptyMessage="No recent scans"
            compact
          />
        </div>

        {/* Column 4: Warnings + Stats */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-2">
          {/* Warnings */}
          <div className="flex-1 min-h-0 bg-larp-red/5 border border-larp-red/20 p-2">
            <FeedSection
              title="Warnings"
              icon={<AlertTriangle size={14} />}
              iconColor="#dc2626"
              entities={MOCK_WARNINGS}
              viewAllHref="/terminal/warnings"
              emptyMessage="No active warnings"
              compact
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-medium/30 border border-ivory-light/10 p-2">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-ivory-light/10">
              <CheckCircle size={12} className="text-larp-green" />
              <span className="font-mono text-[10px] font-bold text-ivory-light uppercase">
                Network
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox icon={<Users size={10} />} label="KOLs" value="2,847" />
              <StatBox icon={<Code size={10} />} label="Devs" value="384" />
              <StatBox icon={<CheckCircle size={10} />} label="Verified" value="89" color="#22c55e" />
              <StatBox icon={<AlertTriangle size={10} />} label="Flagged" value="127" color="#dc2626" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color = '#FAF9F5'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5 text-ivory-light/40">
        {icon}
        <span className="font-mono text-[8px] uppercase">{label}</span>
      </div>
      <div className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
