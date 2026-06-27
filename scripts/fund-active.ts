#!/usr/bin/env node
// Funds only accounts 1-9 (the 10 active accounts) if balance < 0.05 STX
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
    const tmp = `/tmp/cf_${Date.now()}.bin`;
    writeFileSync(tmp, opts.body);
    const r = execSync(`curl -s --max-time 30 -X ${method} ${headers} --data-binary @${tmp} '${url}'`, { timeout: 35000 }).toString();
    unlinkSync(tmp);
    return { ok: true, json: async () => JSON.parse(r), text: async () => r };
  }
  const r = execSync(`curl -s --max-time 15 '${url}'`, { timeout: 20000 }).toString();
  return { ok: true, json: async () => JSON.parse(r), text: async () => r };
};

const FUND_AMOUNT = 300_000n; // 0.3 STX — evenly distributes ~15 STX across 50 accounts
const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < 50; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet({ fetchFn: curlFetch as any });
const senderKey = wallet.accounts[0].stxPrivateKey;
const senderAddress = getAddressFromPrivateKey(senderKey, network.version);
const nonceData = JSON.parse(execSync(`curl -s 'https://api.hiro.so/extended/v1/address/${senderAddress}/nonces'`).toString());
let nonce = nonceData.possible_next_nonce;

console.log(`Sender: ${senderAddress} | Nonce: ${nonce}\n`);

for (let i = 1; i < 50; i++) {
  const address = getAddressFromPrivateKey(wallet.accounts[i].stxPrivateKey, network.version);
  const d = JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${address}?proof=0'`).toString());
  const bal = parseInt(d.balance, 16);
  if (bal >= 50_000) { console.log(`Account ${i}: ${address} — ${(bal/1e6).toFixed(3)} STX OK`); continue; }

  const tx = await makeSTXTokenTransfer({ recipient: address, amount: FUND_AMOUNT, senderKey, network, anchorMode: AnchorMode.Any, nonce });
  const tmp = `/tmp/fund10_${i}.bin`;
  writeFileSync(tmp, tx.serialize());
  const result = execSync(`curl -s --max-time 30 -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmp}`, { timeout: 35000 }).toString();
  unlinkSync(tmp);
  const parsed = JSON.parse(result);
  if (typeof parsed === 'string' && parsed.length === 64) {
    console.log(`✅ Account ${i}: ${address} — funded 0.2 STX`);
  } else {
    console.error(`❌ Account ${i}: ${address} — ${result}`);
  }
  nonce++;
  await new Promise(r => setTimeout(r, 500));
}
console.log('\nDone!');
