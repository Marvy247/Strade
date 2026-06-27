import { generateWallet, generateNewAccount } from '@stacks/wallet-sdk';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const toml = readFileSync(resolve('settings/Mainnet.toml'), 'utf8');
const mnemonic = toml.match(/mnemonic\s*=\s*"([^"]+)"/)![1];
let wallet = await generateWallet({ secretKey: mnemonic, password: '' });
for (let i = 1; i < 50; i++) wallet = generateNewAccount(wallet);
const network = new StacksMainnet();

let total = 0;
for (let i = 0; i < 50; i++) {
  const address = getAddressFromPrivateKey(wallet.accounts[i].stxPrivateKey, network.version);
  const d = JSON.parse(execSync(`curl -s 'https://api.hiro.so/v2/accounts/${address}?proof=0'`).toString());
  const bal = parseInt(d.balance, 16) / 1e6;
  total += bal;
  console.log(`Account ${i.toString().padStart(2)}: ${address} — ${bal.toFixed(6)} STX`);
  await new Promise(r => setTimeout(r, 300));
}
console.log(`\nTotal: ${total.toFixed(6)} STX`);
