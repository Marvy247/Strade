#!/usr/bin/env node
/**
 * Git Activity Generator for Strade
 * Creates commits for GitHub activity. Supports resuming from existing commits.
 * 
 * Usage:
 *   npx tsx scripts/git-activity-generator.ts --help
 *   npx tsx scripts/git-activity-generator.ts --dry-run
 *   npx tsx scripts/git-activity-generator.ts
 *   npx tsx scripts/git-activity-generator.ts --total 500
 * 
 * WARNINGS:
 * - Creates temp files in ./temp-commits/ and commits them.
 * - Rate limited by GitHub (consider delays).
 * - Check GitHub TOS; for testing only.
 * - Runs `git push`, `gh pr create`. Ensure authenticated.
 * - Cleanup: rm -rf temp-commits/ && git branch -D fake-activity-pr-*
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = join(__dirname, '../temp-commits');
const NUM_PRS = 5;
const TOTAL_COMMITS = process.argv.includes('--total') ? parseInt(process.argv[process.argv.indexOf('--total') + 1] || '100') : 100;
const COMMITS_PER_PR = Math.ceil(TOTAL_COMMITS / NUM_PRS);
const PR_START = 194;
const COUNTER_OFFSET = 35044;
const DRY_RUN = process.argv.includes('--dry-run');
const HELP = process.argv.includes('--help');

if (HELP) {
  console.log(`Usage: npx tsx ${join('scripts/git-activity-generator.ts')} [--dry-run] [--help] [--total <num>]\n`);
  console.log('Options:\n  --dry-run  Simulate without git/gh commands\n  --help     Show this help\n  --total   Number of commits to make (default: 500)\n');
  process.exit(0);
}

function run(cmd: string, options: { cwd?: string; dryRun?: boolean } = {}) {
  const { cwd, dryRun } = options;
  if (dryRun || DRY_RUN) {
    console.log(`[DRY-RUN] cd ${cwd || process.cwd()} && ${cmd}`);
    return;
  }
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

function log(msg: string) {
  console.log(`\n>>> ${msg}`);
}

async function main() {
  // Get existing file count to continue from where we left off
  let startCommit = 1;
  if (existsSync(TEMP_DIR)) {
    const existingFiles = readdirSync(TEMP_DIR).filter(f => f.startsWith('counter') && f.endsWith('.txt'));
    if (existingFiles.length > 0) {
      const maxCounter = Math.max(...existingFiles.map(f => parseInt(f.replace('counter', '').replace('.txt', ''))));
      startCommit = maxCounter - COUNTER_OFFSET + 1;
      console.log(`\n>>> Continuing from existing commit ${startCommit} (found ${existingFiles.length} existing files, max counter: ${maxCounter})`);
    } else {
      // Cleanup previous if empty
      rmSync(TEMP_DIR, { recursive: true });
      mkdirSync(TEMP_DIR, { recursive: true });
    }
  } else {
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Create new temp files only for commits that don't exist yet
  for (let i = startCommit; i <= TOTAL_COMMITS; i++) {
    const file = join(TEMP_DIR, `counter${COUNTER_OFFSET + i}.txt`);
    if (!existsSync(file)) {
      writeFileSync(file, `Commit counter #${COUNTER_OFFSET + i} - ${Date.now()}\nMinor change for activity.\n`);
    }
  }

  run('git add temp-commits/');
  try { execSync('git commit -m "chore: add temp-commits dir for activity tracking"', { stdio: 'inherit' }); } catch {}

  for (let pr = 1; pr <= NUM_PRS; pr++) {
    log(`=== PR ${pr}/${NUM_PRS} (commits ${((pr-1)*COMMITS_PER_PR + 1)}-${pr*COMMITS_PER_PR}) ===`);

    const branch = `fake-activity-pr-${PR_START + pr - 1}-${COUNTER_OFFSET}`;
    
    // Create & switch branch
    run(`git checkout -b ${branch}`, { dryRun: DRY_RUN });
    
    // Make commits for this PR
    for (let c = (pr-1)*COMMITS_PER_PR + 1; c <= Math.min(pr*COMMITS_PER_PR, TOTAL_COMMITS); c++) {
      if (c > TOTAL_COMMITS) break;
      const file = join(TEMP_DIR, `counter${COUNTER_OFFSET + c}.txt`);
      const content = `Commit counter #${COUNTER_OFFSET + c} - ${Date.now() + c}\nUpdated at ${new Date().toISOString()}\nMinor change for activity.\n`;
      writeFileSync(file, content);
      
      run(`git add temp-commits/counter${COUNTER_OFFSET + c}.txt`, { cwd: process.cwd(), dryRun: DRY_RUN });
      if ((c - 1) % 50 === 0 || c === Math.min(pr*COMMITS_PER_PR, TOTAL_COMMITS)) {
        console.log(`  Progress: PR${pr} commit ${c}/${Math.min(pr*COMMITS_PER_PR, TOTAL_COMMITS)} (${Math.min(TOTAL_COMMITS, pr*COMMITS_PER_PR)}/${TOTAL_COMMITS} total)`);
      }
      run(`git commit -m "chore: bump counter ${COUNTER_OFFSET + c} for activity tracking"`, { dryRun: DRY_RUN });
    }
    
    // Push & create PR
    run(`git push origin ${branch}`, { dryRun: DRY_RUN });
    run(`gh pr create --title "chore: activity batch #${pr} - ${COMMITS_PER_PR} minor updates" --body "Batch of ${COMMITS_PER_PR} commits for activity tracking. Changes in temp-commits/. #automation" --base main`, { dryRun: DRY_RUN });
    
    log(`PR ${pr} created! Merging to main...`);

    // Switch back to main
    run(`git checkout main`, { dryRun: DRY_RUN });

    // Merge the PR and delete the remote branch
    run(`gh pr merge ${branch} --merge --delete-branch --subject "chore: merge activity batch #${pr}"`, { dryRun: DRY_RUN });

    // Delete local branch if it still exists
    try { execSync(`git branch -D ${branch}`, { stdio: 'inherit' }); } catch {}

    // Pull latest main
    run(`git pull origin main`, { dryRun: DRY_RUN });

    log(`PR ${pr} merged and deleted!`);
  }

  // Safety: stash if dirty, checkout main
  try { execSync('git stash push -m "pre-activity auto-save"', { stdio: 'inherit' }); } catch {}
  try { execSync('git checkout main', { stdio: 'inherit' }); } catch {
    execSync('git checkout master', { stdio: 'inherit' });
  }
  try { execSync('git stash pop', { stdio: 'inherit' }); } catch {}

  // Clean up temp-commits
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true });
    log('Temp files cleaned up');
  }

  // Update counter file
  writeFileSync('.activity_counter', TOTAL_COMMITS.toString());
  console.log(`Updated .activity_counter to ${TOTAL_COMMITS}`);
  
  log('✅ Complete! All PRs merged and deleted.');
  if (!DRY_RUN) {
    console.log(`\nSummary: ${TOTAL_COMMITS} commits across ${NUM_PRS} PRs, all merged to main and PRs deleted.`);
  }
}

main().catch(console.error);
