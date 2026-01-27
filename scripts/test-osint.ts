/**
 * Test OSINT Pipeline
 *
 * Tests the full entity resolver with all OSINT sources
 */

import { resolveEntity } from '../lib/terminal/entity-resolver';

const ZERA_TOKEN = '8avjtjHAHFqp4g2RR9ALAGBpSTqKPZR8nRbzSTwZERA';

async function main() {
  console.log('='.repeat(60));
  console.log('OSINT Pipeline Test - ZERA Token');
  console.log('='.repeat(60));
  console.log(`Token: ${ZERA_TOKEN}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const startTime = Date.now();

  try {
    const resolution = await resolveEntity(ZERA_TOKEN);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!resolution.success || !resolution.entity) {
      console.error('Resolution failed:', resolution.error);
      process.exit(1);
    }

    const result = resolution.entity;

    console.log('');
    console.log('='.repeat(60));
    console.log(`RESULTS (completed in ${elapsed}s)`);
    console.log('='.repeat(60));
    console.log('');

    // Basic info
    console.log('--- BASIC INFO ---');
    console.log(`Input Type: ${result.inputType}`);
    console.log(`Canonical ID: ${result.canonicalId}`);
    console.log(`Token Name: ${result.name || result.tokenData?.name || 'N/A'}`);
    console.log(`Token Symbol: ${result.symbol || result.tokenData?.symbol || 'N/A'}`);
    console.log(`Token Address: ${result.tokenAddresses?.[0]?.address || 'N/A'}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log('');

    // Social links
    console.log('--- DISCOVERED LINKS ---');
    console.log(`X Handle: ${result.xHandle ? '@' + result.xHandle : 'N/A'}`);
    console.log(`Website: ${result.website || 'N/A'}`);
    console.log(`GitHub: ${result.github || 'N/A'}`);
    console.log(`Discord: ${result.discord || 'N/A'}`);
    console.log(`Telegram: ${result.telegram || 'N/A'}`);
    console.log(`Docs: ${result.docs || 'N/A'}`);
    console.log('');

    // Security Intel (RugCheck)
    if (result.securityIntel) {
      console.log('--- SECURITY INTEL (RugCheck) ---');
      console.log(`Score: ${result.securityIntel.normalizedScore}/10 (${result.securityIntel.riskLevel})`);
      console.log(`Mint Authority: ${result.securityIntel.mintAuthority}`);
      console.log(`Freeze Authority: ${result.securityIntel.freezeAuthority}`);
      console.log(`LP Locked: ${result.securityIntel.lpLocked ?? 'unknown'}`);
      console.log(`Total Holders: ${result.securityIntel.totalHolders?.toLocaleString() ?? 'N/A'}`);
      console.log(`Is Rugged: ${result.securityIntel.isRugged}`);
      if (result.securityIntel.risks.length > 0) {
        console.log(`Risks (${result.securityIntel.risks.length}):`);
        result.securityIntel.risks.slice(0, 5).forEach(r => {
          console.log(`  - [${r.level}] ${r.name}: ${r.description}`);
        });
      }
      console.log('');
    }

    // Domain Intel
    if (result.domainIntel) {
      console.log('--- DOMAIN INTEL ---');
      console.log(`Domain: ${result.domainIntel.domain}`);
      console.log(`Age: ${result.domainIntel.ageInDays ?? 'unknown'} days`);
      console.log(`Age Risk: ${result.domainIntel.ageRisk}`);
      console.log(`Registrar: ${result.domainIntel.registrar || 'N/A'}`);
      console.log(`Privacy Protected: ${result.domainIntel.isPrivacyProtected}`);
      console.log('');
    }

    // Market Intel
    if (result.marketIntel) {
      console.log('--- MARKET INTEL ---');
      console.log(`Price: $${result.marketIntel.priceUsd?.toFixed(8) ?? 'N/A'}`);
      console.log(`Market Cap: $${result.marketIntel.marketCap?.toLocaleString() ?? 'N/A'}`);
      console.log(`24h Volume: $${result.marketIntel.volume24h?.toLocaleString() ?? 'N/A'}`);
      console.log(`Liquidity: $${result.marketIntel.liquidity?.toLocaleString() ?? 'N/A'}`);
      console.log(`CoinGecko Listed: ${result.marketIntel.isListed}`);
      console.log(`Sources: ${result.marketIntel.sources.join(', ')}`);
      console.log('');
    }

    // History Intel (Wayback)
    if (result.historyIntel) {
      console.log('--- HISTORY INTEL (Wayback) ---');
      console.log(`Has Archives: ${result.historyIntel.hasArchives}`);
      console.log(`Total Snapshots: ${result.historyIntel.totalSnapshots}`);
      console.log(`First Archive: ${result.historyIntel.firstArchiveDate?.toISOString().split('T')[0] ?? 'N/A'}`);
      console.log(`Archive Age: ${result.historyIntel.archiveAgeInDays ?? 'N/A'} days`);
      console.log('');
    }

    // GitHub Intel
    if (result.githubIntel) {
      console.log('--- GITHUB INTEL ---');
      console.log(`Repo: ${result.githubIntel.repoUrl}`);
      console.log(`Stars: ${result.githubIntel.stars}`);
      console.log(`Forks: ${result.githubIntel.forks}`);
      console.log(`Open Issues: ${result.githubIntel.openIssues}`);
      console.log(`Last Commit: ${result.githubIntel.lastCommitDate?.toISOString().split('T')[0] ?? 'N/A'}`);
      console.log(`Total Commits: ${result.githubIntel.totalCommits}`);
      console.log(`Contributors: ${result.githubIntel.contributors}`);
      console.log(`Primary Language: ${result.githubIntel.primaryLanguage || 'N/A'}`);
      console.log(`Has README: ${result.githubIntel.hasReadme}`);
      console.log(`Has License: ${result.githubIntel.hasLicense}`);
      console.log('');
    }

    // Discord Intel
    if (result.discordIntel) {
      console.log('--- DISCORD INTEL ---');
      console.log(`Guild Name: ${result.discordIntel.guildName || 'N/A'}`);
      console.log(`Members: ${result.discordIntel.memberCount?.toLocaleString() ?? 'N/A'}`);
      console.log(`Online: ${result.discordIntel.presenceCount?.toLocaleString() ?? 'N/A'}`);
      console.log(`Verified: ${result.discordIntel.isVerified}`);
      console.log('');
    }

    // Risk Flags
    if (result.riskFlags && result.riskFlags.length > 0) {
      console.log('--- RISK FLAGS ---');
      result.riskFlags.forEach(flag => {
        console.log(`  [${flag.severity}] ${flag.message}`);
      });
      console.log('');
    }

    // Legitimacy Signals
    if (result.legitimacySignals && result.legitimacySignals.length > 0) {
      console.log('--- LEGITIMACY SIGNALS ---');
      result.legitimacySignals.forEach(signal => {
        console.log(`  + ${signal}`);
      });
      console.log('');
    }

    // Website Intel
    if (result.websiteIntel) {
      console.log('--- WEBSITE INTEL ---');
      console.log(`Title: ${result.websiteIntel.title || 'N/A'}`);
      console.log(`Pages Crawled: ${result.websiteIntel.pagesCrawled || 1}`);
      console.log(`Internal Links Found: ${result.websiteIntel.internalLinksFound || 0}`);
      console.log(`Team Size: ${result.websiteIntel.teamSize ?? 'N/A'}`);
      console.log(`Has Whitepaper: ${result.websiteIntel.hasWhitepaper}`);
      console.log(`Has Roadmap: ${result.websiteIntel.hasRoadmap}`);
      if (result.websiteIntel.socialLinks) {
        const links = result.websiteIntel.socialLinks;
        console.log('Social Links Found:');
        if (links.twitter) console.log(`  - Twitter: ${links.twitter}`);
        if (links.github) console.log(`  - GitHub: ${links.github}`);
        if (links.discord) console.log(`  - Discord: ${links.discord}`);
        if (links.telegram) console.log(`  - Telegram: ${links.telegram}`);
        if (links.medium) console.log(`  - Medium: ${links.medium}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exit(1);
  }
}

main();
