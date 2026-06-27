#!/usr/bin/env node
/**
 * Funds derived accounts 1-49 from account 0.
 * Run once before generate-activity.ts
 */
import {
  makeSTXTokenTransfer,
  AnchorMode,
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// Use curl-based fetch to bypass Node.js network restrictions
const curlFetch = async (url: string, opts: any = {}) => {
  const method = opts.method || 'GET';
  const body = opts.body ? `-d '${opts.body}'` : '';
  const headers = opts.headers ? Object.entries(opts.headers).map(([k,v]) => `-H '${k}: ${v}'`).join(' ') : '';
  const result = execSync(`curl -s -X ${method} ${headers} ${body} '${url}'`, { timeout: 15000 }).toString();
  return { ok: true, json: async () => JSON.parse(result), text: async () => result };
};

const NUM_ACCOUNTS = 50;
const FUND_AMOUNT = 100_000n; // 0.1 STX in microSTX
const FEE = 300n;

const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < NUM_ACCOUNTS; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet({ fetchFn: curlFetch as any });
const senderKey = wallet.accounts[0].stxPrivateKey;
const senderAddress = getAddressFromPrivateKey(senderKey, network.version);

const res = await curlFetch(`https://api.hiro.so/v2/accounts/${senderAddress}?proof=0`);
const data = await res.json() as { nonce: number; balance: string };
let nonce = data.nonce;
const balance = BigInt(data.balance);

console.log(`Sender: ${senderAddress}`);
console.log(`Balance: ${Number(balance) / 1e6} STX`);
console.log(`Funding ${NUM_ACCOUNTS - 1} accounts with ${Number(FUND_AMOUNT) / 1e6} STX each\n`);

const totalNeeded = (FUND_AMOUNT + FEE) * BigInt(NUM_ACCOUNTS - 1) + FEE;
if (balance < totalNeeded) {
  console.error(`Insufficient balance. Need ${Number(totalNeeded) / 1e6} STX, have ${Number(balance) / 1e6} STX`);
  process.exit(1);
}

import { writeFileSync, unlinkSync } from 'fs';

for (let i = 1; i < NUM_ACCOUNTS; i++) {
  const recipient = getAddressFromPrivateKey(wallet.accounts[i].stxPrivateKey, network.version);
  const tx = await makeSTXTokenTransfer({
    recipient,
    amount: FUND_AMOUNT,
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    nonce,
    fee: FEE,
  });

  // Write serialized tx to temp file and POST via curl
  const tmpFile = `/tmp/stx_tx_${i}.bin`;
  writeFileSync(tmpFile, tx.serialize());
  const result = execSync(
    `curl -s -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmpFile}`,
    { timeout: 15000 }
  ).toString();
  unlinkSync(tmpFile);

  const parsed = JSON.parse(result);
  if (typeof parsed === 'string' && parsed.length === 64) {
    console.log(`✅ Funded account ${i}: ${recipient} — txid: ${parsed}`);
  } else {
    console.error(`❌ Failed account ${i}: ${recipient} — ${result}`);
  }
  nonce++;
  await new Promise(r => setTimeout(r, 500));
}

console.log('\nDone! Wait ~10 min for txs to confirm before running generate-activity.ts');
