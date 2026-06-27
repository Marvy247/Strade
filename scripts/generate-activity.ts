#!/usr/bin/env node
/**
 * Strade Activity Generator
 * Usage:
 *   1. Set PRIVATE_KEY below (64-char hex)
 *   2. Set DRY_RUN=false when ready
 *   3. npx tsx scripts/generate-activity.ts
 */

import {
  broadcastTransaction,
  makeContractCall,
  noneCV,
  principalCV,
  stringUtf8CV,
  uintCV,
  AnchorMode,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const DRY_RUN = false; // set to false to broadcast

// curl-based fetch to bypass Node.js network restrictions
const curlFetch = async (url: string, opts: any = {}) => {
  const method = opts.method || 'GET';
  const headers = opts.headers ? Object.entries(opts.headers).map(([k,v]) => `-H '${k}: ${v}'`).join(' ') : '';
  if (opts.body) {
    const tmpFile = `/tmp/stx_req_${Date.now()}.bin`;
    const { writeFileSync, unlinkSync } = await import('fs');
    writeFileSync(tmpFile, opts.body);
    const result = execSync(`curl -s --max-time 30 -X ${method} ${headers} --data-binary @${tmpFile} '${url}'`, { timeout: 35000 }).toString();
    unlinkSync(tmpFile);
    return { ok: true, json: async () => JSON.parse(result), text: async () => result };
  }
  const result = execSync(`curl -s -X ${method} ${headers} '${url}'`, { timeout: 15000 }).toString();
  return { ok: true, json: async () => JSON.parse(result), text: async () => result };
};

// Read mnemonic from settings/Mainnet.toml
const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonicMatch = toml.match(/mnemonic\s*=\s*"([^"]+)"/);
if (!mnemonicMatch) { console.error('mnemonic not found in settings/Mainnet.toml'); process.exit(1); }
const MNEMONIC = mnemonicMatch[1];

// Derive 100 accounts from the same mnemonic (indices 0-99)
const NUM_ACCOUNTS = 50;
const baseWallet = await generateWallet({ secretKey: MNEMONIC, password: '' });
let wallet = baseWallet;
for (let i = 1; i < NUM_ACCOUNTS; i++) {
  wallet = generateNewAccount(wallet);
}
const accounts = wallet.accounts.slice(0, NUM_ACCOUNTS).map(a => a.stxPrivateKey);
const CONTRACT_PRINCIPAL = 'SPB669EVRTKWYGY5GNQ7VEBZ7RF8A3K01EP6GN8N';
const DELAY_MS = 3000;

const network = new StacksMainnet({ fetchFn: curlFetch as any });
const rand = () => Math.random().toString(36).slice(2, 8);

async function getNonce(address: string): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = execSync(`curl -s --max-time 15 'https://api.hiro.so/extended/v1/address/${address}/nonces'`, { timeout: 20000 }).toString();
      if (result.includes('Per-minute') || result.includes('rate limit')) throw new Error('rate limited');
      const data = JSON.parse(result) as { possible_next_nonce: number };
      return data.possible_next_nonce;
    } catch (e: any) {
      console.error(`  getNonce attempt ${attempt}/3 failed: ${e.message}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 10000)); // 10s backoff on rate limit
    }
  }
  throw new Error('Failed to get nonce after 3 attempts');
}

async function sendTx(contractName: string, fn: string, args: any[], nonce: number, privateKey: string) {
  const tx = await makeContractCall({
    contractAddress: CONTRACT_PRINCIPAL,
    contractName,
    functionName: fn,
    functionArgs: args,
    senderKey: privateKey,
    validateWithAbi: false,
    network,
    anchorMode: AnchorMode.Any,
    nonce,
    fee: 4_000, // 0.2 STX total per cycle across 50 accounts
  });

  console.log(`[${nonce}] ${contractName}.${fn}`);

  if (DRY_RUN) {
    console.log('  DRY-RUN: skipped');
    return;
  }

  try {
    const res = await broadcastTransaction(tx, network);
    if ('txid' in res) {
      console.log(`  ✅ https://explorer.hiro.so/txid/${res.txid}`);
    } else {
      console.error(`  ❌ ${JSON.stringify(res)}`);
    }
  } catch (e: any) {
    console.error(`  ❌ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, DELAY_MS));
}

async function main() {
  const { getAddressFromPrivateKey } = await import('@stacks/transactions');

  // Build per-account state sequentially to avoid rate limiting
  const allStates = [];
  for (let i = 0; i < accounts.length; i++) {
    const pk = accounts[i];
    const { getAddressFromPrivateKey } = await import('@stacks/transactions');
    const address = getAddressFromPrivateKey(pk, network.version);
    const nonce = await getNonce(address);
    let pending = 0, balance = 0;
    try {
      const mempool = JSON.parse(execSync(`curl -s --max-time 15 'https://api.hiro.so/extended/v1/address/${address}/mempool?limit=1'`, { timeout: 20000 }).toString());
      pending = mempool.total ?? 0;
      const balData = JSON.parse(execSync(`curl -s --max-time 15 'https://api.hiro.so/v2/accounts/${address}?proof=0'`, { timeout: 20000 }).toString());
      balance = parseInt(balData.balance, 16);
    } catch { pending = 0; }
    console.log(`Account ${i}: ${address} (nonce: ${nonce}, pending: ${pending}, balance: ${(balance/1e6).toFixed(4)} STX)`);
    allStates.push({ pk, address, nonce, pending, balance });
    await new Promise(r => setTimeout(r, 2000));
  }

  const accountStates = allStates.filter(s => s.pending < 3 && s.balance > 1000);
  if (accountStates.length === 0) { console.log('All accounts have too many pending txs. Try again later.'); return; }
  console.log(`\nUsing ${accountStates.length}/${allStates.length} accounts\nDRY_RUN=${DRY_RUN}\n`);

  // 1 tx per account per run — rotate through different contract calls
  // Rotate through different contract calls - 1 per account per run
  const calls = [
    (s: any) => sendTx('UserProfile', 'update-profile', [
      stringUtf8CV(`Bio ${rand()}`), stringUtf8CV(`${rand()}@test.com`)
    ], s.nonce++, s.pk),

    (s: any) => sendTx('CoreMarketPlace', 'create-listing', [
      stringUtf8CV(`Item ${rand()}`), stringUtf8CV(`Desc ${rand()}`), uintCV(500_000), uintCV(144)
    ], s.nonce++, s.pk),

    (s: any) => sendTx('CoreMarketPlace', 'update-listing', [
      uintCV(Math.floor(Math.random() * 100) + 1),
      uintCV(750_000),
      stringUtf8CV(`Updated desc ${rand()}`)
    ], s.nonce++, s.pk),

    (s: any) => sendTx('UserProfile', 'rate-user', [
      principalCV(accountStates[(accountStates.indexOf(s) + 1) % accountStates.length].address),
      uintCV(Math.floor(Math.random() * 5) + 1)
    ], s.nonce++, s.pk),

    (s: any) => sendTx('UserProfile', 'calculate-reputation', [
      principalCV(s.address)
    ], s.nonce++, s.pk),

    (s: any) => sendTx('CoreMarketPlace', 'create-listing', [
      stringUtf8CV(`Product ${rand()}`), stringUtf8CV(`Details ${rand()}`), uintCV(1_000_000), uintCV(288)
    ], s.nonce++, s.pk),
  ];

  for (let i = 0; i < accountStates.length; i++) {
    const s = accountStates[i];
    // Re-fetch nonce right before sending to avoid BadNonce
    s.nonce = await getNonce(s.address);
    await calls[i % calls.length](s);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone!');
}

main().catch(console.error);
