#!/usr/bin/env node
import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey, makeSTXTokenTransfer, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const curlFetch = async (url: string, opts: any = {}) => {
  const method = opts.method || 'GET';
  const headers = opts.headers ? Object.entries(opts.headers).map(([k,v]) => `-H '${k}: ${v}'`).join(' ') : '';
  if (opts.body) {
    const tmp = `/tmp/stx_fund_${Date.now()}.bin`;
    writeFileSync(tmp, opts.body);
    const r = execSync(`curl -s -X ${method} ${headers} --data-binary @${tmp} '${url}'`, { timeout: 15000 }).toString();
    unlinkSync(tmp);
    return { ok: true, json: async () => JSON.parse(r), text: async () => r };
  }
  const r = execSync(`curl -s '${url}'`, { timeout: 15000 }).toString();
  return { ok: true, json: async () => JSON.parse(r), text: async () => r };
};

const FUND_AMOUNT = 200_000n; // 0.2 STX
const NUM_ACCOUNTS = 50;

const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < NUM_ACCOUNTS; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet({ fetchFn: curlFetch as any });
const senderKey = wallet.accounts[0].stxPrivateKey;
const senderAddress = getAddressFromPrivateKey(senderKey, network.version);

// Get sender nonce (possible_next to include mempool)
const nonceData = JSON.parse(execSync(`curl -s 'https://api.hiro.so/extended/v1/address/${senderAddress}/nonces'`).toString());
let nonce = nonceData.possible_next_nonce;

const balData = JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${senderAddress}?proof=0'`).toString());
const balance = BigInt(balData.balance);
console.log(`Sender: ${senderAddress} | Balance: ${Number(balance)/1e6} STX | Nonce: ${nonce}\n`);

// Find accounts with low balance (< 0.05 STX)
const unfunded: { idx: number; address: string }[] = [];
for (let i = 1; i < NUM_ACCOUNTS; i++) {
  const address = getAddressFromPrivateKey(wallet.accounts[i].stxPrivateKey, network.version);
  const d = JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${address}?proof=0'`).toString());
  const bal = parseInt(d.balance, 16);
  console.log(`Account ${i}: ${address} — ${(bal/1e6).toFixed(3)} STX`);
  if (bal < 50_000) unfunded.push({ idx: i, address }); // top up if < 0.05 STX
  await new Promise(r => setTimeout(r, 600));
}

console.log(`\nFound ${unfunded.length} accounts with low balance. Topping up each with 0.1 STX...\n`);

const totalNeeded = FUND_AMOUNT * BigInt(unfunded.length);
if (balance < totalNeeded) {
  console.error(`Insufficient balance. Need ${Number(totalNeeded)/1e6} STX, have ${Number(balance)/1e6} STX`);
  process.exit(1);
}

for (const { idx, address } of unfunded) {
  const tx = await makeSTXTokenTransfer({
    recipient: address,
    amount: FUND_AMOUNT,
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    nonce,
  });

  const tmp = `/tmp/stx_fund_${idx}.bin`;
  writeFileSync(tmp, tx.serialize());
  const result = execSync(`curl -s --max-time 30 -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmp}`, { timeout: 35000 }).toString();
  unlinkSync(tmp);

  const parsed = JSON.parse(result);
  if (typeof parsed === 'string' && parsed.length === 64) {
    console.log(`✅ Account ${idx}: ${address} — txid: ${parsed}`);
  } else {
    console.error(`❌ Account ${idx}: ${address} — ${result}`);
  }
  nonce++;
  await new Promise(r => setTimeout(r, 300));
}

console.log('\nDone!');
