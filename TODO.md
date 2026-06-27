# TODO.md - Git Activity Generator: Run 2000 More Commits

## Plan Summary
**Information Gathered:**
- `scripts/git-activity-generator.ts`: Generates ~2000 git commits (7 PRs × 286 commits) via temp-commits/counter26XX.txt files (updates content, commits "chore: bump counter X"). Offset 2602, total files seen up to ~2753, .activity_counter=300 (likely tracks something else or reset).
- Existing temp-commits/ has many files; will clean to avoid conflicts.
- Uses `gh pr create` (assumes GitHub CLI auth'd).
- `generate-activity.ts`/`auto-activity.sh`: On-chain tx generator, not git-related.

**Plan:**
1. Edit `scripts/git-activity-generator.ts`:
   - Clean temp-commits/ fully on start.
   - Set new offset = 2754 (next after visible files).
   - Keep NUM_PRS=7, COMMITS_PER_PR=286 (~2000 total).
   - Add progress logging, optional --count CLI arg for flexibility.
   - Ensure safe git ops (stash if dirty, checkout main at end).
2. No dependent files (self-contained).

**Dependent Files to be edited:** None.

**Followup steps:**
1. Run dry-run: `npx tsx scripts/git-activity-generator.ts --dry-run`
2. Ensure `gh auth status` (install/auth if needed).
3. Execute: `npx tsx scripts/git-activity-generator.ts`
4. Verify: `gh pr list`, `git log --oneline -10`
5. Optional cleanup: rm -rf temp-commits/, git branch -D fake-activity-pr-*

✅ Plan approved by user.

## Progress
- [x] Create TODO.md
- [x] Step 1: Edit git-activity-generator.ts ✅ (offset 2754, --total CLI, progress, safety stashes, counter update)
- [ ] Step 2: Test dry-run
- [ ] Step 3: Run production
