#!/usr/bin/env npx tsx
/**
 * Seed Entities Script
 *
 * Seeds the database by running handles through the same scan pipeline
 * that end users use. This ensures data consistency.
 *
 * Usage:
 *   npx tsx scripts/seed-entities.ts
 *   npx tsx scripts/seed-entities.ts --force    # Force rescan even if cached
 *   npx tsx scripts/seed-entities.ts --dry-run  # Just print what would be scanned
 *
 * Requirements:
 *   - XAI_API_KEY environment variable
 *   - ENABLE_REAL_X_API=true
 *   - Supabase configured (optional, for persistence)
 */

import { submitScan, getScanJob, getCachedReport } from '../lib/terminal/xintel/scan-service';

// ============================================================================
// SEED DATA - Handles to scan
// ============================================================================

interface SeedHandle {
  handle: string;
  category: 'kol' | 'dev' | 'project';
  notes?: string;
}

// Top KOLs - Influencers who make calls
const KOLS: SeedHandle[] = [
  { handle: 'ansem', category: 'kol', notes: 'Top Solana KOL' },
  { handle: 'blknoiz06', category: 'kol', notes: 'Memecoin caller' },
  { handle: 'deaborysux', category: 'kol', notes: 'Analysis focused' },
  { handle: 'Fitzybrypto', category: 'kol', notes: 'Solana calls' },
  { handle: 'CryptoKaleo', category: 'kol', notes: 'Chart analysis' },
  { handle: 'MoonOverlord', category: 'kol', notes: 'Memecoin degen' },
  { handle: 'CryptoGodJohn', category: 'kol', notes: 'High engagement' },
  { handle: 'KoroushAK', category: 'kol', notes: 'Technical analysis' },
  { handle: 'HsakaTrades', category: 'kol', notes: 'Derivatives trader' },
  { handle: 'AltcoinSherpa', category: 'kol', notes: 'Altcoin calls' },
  // Add more KOLs here...
];

// Top Developers - Builders who ship
const DEVS: SeedHandle[] = [
  { handle: 'taborj', category: 'dev', notes: 'Jupiter founder' },
  { handle: 'armaniferrante', category: 'dev', notes: 'Anchor/Backpack' },
  { handle: 'aaboronkov', category: 'dev', notes: 'Marinade' },
  { handle: 'dev_skill_issue', category: 'dev', notes: 'Solana dev' },
  { handle: 'notorious_d_e_v', category: 'dev', notes: 'Solana dev' },
  { handle: 'theraboronkov', category: 'dev', notes: 'Marinade dev' },
  { handle: 'rawfalafel', category: 'dev', notes: 'Tensor' },
  { handle: 'pencilflip', category: 'dev', notes: 'Solana core' },
  { handle: 'jaboronkov', category: 'dev', notes: 'Squads' },
  { handle: 'buffalu__', category: 'dev', notes: 'Jito' },
  // Add more devs here...
];

// Projects - Protocols and platforms
const PROJECTS: SeedHandle[] = [
  { handle: 'JupiterExchange', category: 'project', notes: 'DEX aggregator' },
  { handle: 'MagicEden', category: 'project', notes: 'NFT marketplace' },
  { handle: 'tensor_hq', category: 'project', notes: 'NFT trading' },
  { handle: 'MarinadeFinance', category: 'project', notes: 'Liquid staking' },
  { handle: 'solaboronkov', category: 'project', notes: 'Squads protocol' },
  { handle: 'ZeraLabs', category: 'project', notes: 'AI project' },
  { handle: 'PayAINetwork', category: 'project', notes: 'AI payments' },
  { handle: 'Drift', category: 'project', notes: 'Perpetuals' },
  { handle: 'RaydiumProtocol', category: 'project', notes: 'AMM' },
  { handle: 'aboronkov', category: 'project', notes: 'Orca DEX' },
  // Add more projects here...
];

// Combine all handles
const ALL_HANDLES: SeedHandle[] = [...KOLS, ...DEVS, ...PROJECTS];

// ============================================================================
// SCRIPT LOGIC
// ============================================================================

interface ScanResult {
  handle: string;
  category: string;
  status: 'success' | 'cached' | 'failed' | 'skipped';
  error?: string;
  duration?: number;
}

async function waitForScanCompletion(jobId: string, handle: string, maxWaitMs = 120000): Promise<'success' | 'failed'> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const job = getScanJob(jobId);

    if (!job) {
      console.log(`  ⚠️  Job not found for @${handle}`);
      return 'failed';
    }

    if (job.status === 'complete') {
      return 'success';
    }

    if (job.status === 'failed') {
      console.log(`  ❌ Scan failed: ${job.error}`);
      return 'failed';
    }

    // Show progress
    process.stdout.write(`\r  ⏳ ${job.status} (${job.progress}%) - ${job.statusMessage || '...'}`);

    await sleep(pollInterval);
  }

  console.log(`\n  ⚠️  Timeout waiting for @${handle}`);
  return 'failed';
}

async function scanHandle(seed: SeedHandle, force: boolean): Promise<ScanResult> {
  const startTime = Date.now();

  try {
    console.log(`\n📡 Scanning @${seed.handle} (${seed.category})...`);

    const result = await submitScan({
      handle: seed.handle,
      force,
    });

    if (result.error) {
      return {
        handle: seed.handle,
        category: seed.category,
        status: 'failed',
        error: result.error,
      };
    }

    if (result.cached) {
      console.log(`  ✅ Cached (already in database)`);
      return {
        handle: seed.handle,
        category: seed.category,
        status: 'cached',
        duration: Date.now() - startTime,
      };
    }

    // Wait for scan to complete
    const scanStatus = await waitForScanCompletion(result.jobId, seed.handle);
    console.log(''); // New line after progress

    if (scanStatus === 'success') {
      console.log(`  ✅ Scan complete`);
      return {
        handle: seed.handle,
        category: seed.category,
        status: 'success',
        duration: Date.now() - startTime,
      };
    }

    return {
      handle: seed.handle,
      category: seed.category,
      status: 'failed',
      error: 'Scan did not complete successfully',
      duration: Date.now() - startTime,
    };

  } catch (error) {
    return {
      handle: seed.handle,
      category: seed.category,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const category = args.find(a => a.startsWith('--category='))?.split('=')[1];

  console.log('🌱 CLARP Entity Seeder');
  console.log('='.repeat(50));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : force ? 'FORCE RESCAN' : 'NORMAL'}`);
  console.log(`Total handles: ${ALL_HANDLES.length}`);
  console.log('');

  // Filter by category if specified
  let handles = ALL_HANDLES;
  if (category) {
    handles = ALL_HANDLES.filter(h => h.category === category);
    console.log(`Filtering to category: ${category} (${handles.length} handles)`);
  }

  if (dryRun) {
    console.log('\n📋 Handles to scan:');
    handles.forEach(h => {
      console.log(`  - @${h.handle} (${h.category}) ${h.notes ? `- ${h.notes}` : ''}`);
    });
    console.log('\nRun without --dry-run to actually scan.');
    return;
  }

  // Check environment
  if (!process.env.XAI_API_KEY) {
    console.error('❌ XAI_API_KEY not set. Cannot run scans.');
    process.exit(1);
  }

  if (process.env.ENABLE_REAL_X_API !== 'true') {
    console.error('❌ ENABLE_REAL_X_API not set to true. Set it to enable scanning.');
    process.exit(1);
  }

  const results: ScanResult[] = [];
  const delayBetweenScans = 5000; // 5 seconds between scans to avoid rate limits

  for (let i = 0; i < handles.length; i++) {
    const seed = handles[i];
    console.log(`\n[${i + 1}/${handles.length}]`);

    const result = await scanHandle(seed, force);
    results.push(result);

    // Add delay between scans (except for cached results)
    if (i < handles.length - 1 && result.status !== 'cached') {
      console.log(`  ⏸️  Waiting ${delayBetweenScans / 1000}s before next scan...`);
      await sleep(delayBetweenScans);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('='.repeat(50));

  const success = results.filter(r => r.status === 'success').length;
  const cached = results.filter(r => r.status === 'cached').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`✅ New scans: ${success}`);
  console.log(`📦 Already cached: ${cached}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed handles:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => console.log(`  - @${r.handle}: ${r.error}`));
  }

  console.log('\n✨ Seeding complete!');
}

// Run
main().catch(console.error);
