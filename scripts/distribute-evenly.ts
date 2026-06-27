#!/usr/bin/env node
// Distributes 15 STX evenly among all 50 accounts: 0.3 STX each. Account 0 retains its 0.3 STX share, sends 0.3 STX to accounts 1-49.
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

const SEND_AMOUNT = 300_000n; // 0.3 STX each × 49 = 14.7 STX sent, account 0 retains 0.3 STX = 15 STX total
const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < 50; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet({ fetchFn: curlFetch as any });
const senderKey = wallet.accounts[0].stxPrivateKey;
const senderAddress = getAddressFromPrivateKey(senderKey, network.version);
const nonceData = JSON.parse(execSync(`curl -s 'https://api.hiro.so/extended/v1/address/${senderAddress}/nonces'`).toString());
let nonce = nonceData.possible_next_nonce;

console.log(`\nSender: ${senderAddress} | Nonce: ${nonce}`);
console.log(`Distributing ${Number(SEND_AMOUNT * 49n) / 1e6} STX total — account 0 retains ${Number(SEND_AMOUNT) / 1e6} STX, accounts 1-49 each receive ${Number(SEND_AMOUNT) / 1e6} STX\n`);

for (let i = 1; i < 50; i++) {
  const address = getAddressFromPrivateKey(wallet.accounts[i].stxPrivateKey, network.version);
  const tx = await makeSTXTokenTransfer({ recipient: address, amount: SEND_AMOUNT, senderKey, network, anchorMode: AnchorMode.Any, nonce });
  const tmp = `/tmp/dist_${i}.bin`;
  writeFileSync(tmp, tx.serialize());
  const result = execSync(`curl -s --max-time 30 -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmp}`, { timeout: 35000 }).toString();
  unlinkSync(tmp);
  const parsed = JSON.parse(result);
  if (typeof parsed === 'string' && parsed.length === 64) {
    console.log(`✅ Account ${i}: ${address} — sent ${Number(SEND_AMOUNT) / 1e6} STX`);
  } else {
    console.error(`❌ Account ${i}: ${address} — ${result}`);
  }
  nonce++;
  await new Promise(r => setTimeout(r, 500));
}
console.log(`\nDone! ${Number(SEND_AMOUNT * 49n) / 1e6} STX distributed across 49 accounts. Account 0 retains ${Number(SEND_AMOUNT) / 1e6} STX. Total: 15 STX evenly split among all 50 accounts.`);
