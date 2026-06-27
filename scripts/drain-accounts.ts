#!/usr/bin/env node
// Drains accounts 10-49 back to account 0
import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey, makeSTXTokenTransfer, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const NUM_ACCOUNTS = 41; // only drain accounts 35 and 40
const KEEP_ACCOUNTS = 35;
const FEE = 300n;

const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < NUM_ACCOUNTS; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet();
const recipient = getAddressFromPrivateKey(wallet.accounts[0].stxPrivateKey, network.version);
console.log(`Draining accounts ${KEEP_ACCOUNTS}-${NUM_ACCOUNTS - 1} → ${recipient}\n`);

for (let i = KEEP_ACCOUNTS; i < NUM_ACCOUNTS; i++) {
  await new Promise(r => setTimeout(r, 4000)); // delay before each account to avoid rate limits
  const pk = wallet.accounts[i].stxPrivateKey;
  const address = getAddressFromPrivateKey(pk, network.version);
  let d: any;
  try {
    d = JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${address}?proof=0'`).toString());
  } catch { console.log(`Account ${i}: rate limited, skipping`); continue; }
  const balance = BigInt(d.balance ?? '0x0');
  const sendAmount = balance - FEE;

  if (sendAmount <= 0n) {
    console.log(`Account ${i}: ${address} — skipped (balance: ${Number(balance)/1e6} STX)`);
    continue;
  }

  const nonceRaw = execSync(`curl -s 'https://api.hiro.so/extended/v1/address/${address}/nonces'`).toString();
  if (nonceRaw.includes('rate limit')) { console.log(`Account ${i}: rate limited on nonce, skipping`); continue; }
  const nonceData = JSON.parse(nonceRaw);
  const nonce = nonceData.possible_next_nonce;

  const tx = await makeSTXTokenTransfer({
    recipient,
    amount: sendAmount,
    senderKey: pk,
    network,
    anchorMode: AnchorMode.Any,
    nonce,
    fee: FEE,
  });

  const tmp = `/tmp/drain_${i}.bin`;
  writeFileSync(tmp, tx.serialize());
  const result = execSync(`curl -s --max-time 30 -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmp}`, { timeout: 35000 }).toString();
  unlinkSync(tmp);

  if (result.includes('rate limit')) { console.log(`Account ${i}: rate limited on broadcast, skipping`); continue; }
  const parsed = JSON.parse(result);
  if (typeof parsed === 'string' && parsed.length === 64) {
    console.log(`✅ Account ${i}: ${address} — drained ${Number(sendAmount)/1e6} STX — txid: ${parsed}`);
  } else {
    console.error(`❌ Account ${i}: ${address} — ${result}`);
  }
  await new Promise(r => setTimeout(r, 1000));
}

console.log('\nDone!');
