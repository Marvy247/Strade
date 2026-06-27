#!/usr/bin/env node
// Cancels all pending mempool txs by replacing them with 0-value self-transfers at higher fee
import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey, makeSTXTokenTransfer, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ACCOUNTS_TO_CANCEL = [24, 25, 26, 27, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49];
const CANCEL_FEE = 2000n; // higher than original to replace

const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];

let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < 50; i++) wallet = generateNewAccount(wallet);

const network = new StacksMainnet();

for (const i of ACCOUNTS_TO_CANCEL) {
  const pk = wallet.accounts[i].stxPrivateKey;
  const address = getAddressFromPrivateKey(pk, network.version);

  // Get pending txs from mempool
  const mempool = JSON.parse(execSync(`curl -s 'https://api.hiro.so/extended/v1/address/${address}/mempool?limit=50'`).toString());
  const pendingTxs = mempool.results ?? [];

  if (pendingTxs.length === 0) {
    console.log(`Account ${i}: ${address} — no pending txs`);
    continue;
  }

  // Get unique nonces of pending txs
  const nonces: Set<number> = new Set(pendingTxs.map((tx: any) => tx.nonce));
  console.log(`Account ${i}: ${address} — cancelling nonces: ${[...nonces].join(', ')}`);

  for (const nonce of nonces) {
    const bal = BigInt(JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${address}?proof=0'`).toString()).balance);
    if (bal < CANCEL_FEE) { console.log(`  nonce ${nonce}: insufficient balance, skipping`); continue; }

    const tx = await makeSTXTokenTransfer({
      recipient: address, // send to self
      amount: 1n,
      senderKey: pk,
      network,
      anchorMode: AnchorMode.Any,
      nonce,
      fee: CANCEL_FEE,
    });

    const tmp = `/tmp/cancel_${i}_${nonce}.bin`;
    writeFileSync(tmp, tx.serialize());
    const result = execSync(`curl -s --max-time 30 -X POST 'https://api.hiro.so/v2/transactions' -H 'Content-Type: application/octet-stream' --data-binary @${tmp}`, { timeout: 35000 }).toString();
    unlinkSync(tmp);

    const parsed = JSON.parse(result);
    if (typeof parsed === 'string' && parsed.length === 64) {
      console.log(`  ✅ nonce ${nonce} replaced — txid: ${parsed}`);
    } else {
      console.error(`  ❌ nonce ${nonce} — ${result}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

console.log('\nDone! Run drain-accounts.ts after these confirm.');
