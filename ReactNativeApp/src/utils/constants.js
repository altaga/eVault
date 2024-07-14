import {AptosConfig, Network} from '@aptos-labs/ts-sdk';
import {Image} from 'react-native';
import APT from '../assets/logos/apt.png';
import USDC from '../assets/logos/usdc.png';
import USDT from '../assets/logos/usdt.png';
import WETH from '../assets/logos/weth.png';

const w = 50;
const h = 50;

export const network = Network.MAINNET;
export const fullnode = 'https://api.mainnet.aptoslabs.com/v1';

export const refreshTime = 1000 * 60 * 1;

export const iconsBlockchain = {
  apt: <Image source={APT} style={{width: w, height: h, borderRadius: 10}} />,
  usdc: <Image source={USDC} style={{width: w, height: h, borderRadius: 10}} />,
  usdt: <Image source={USDT} style={{width: w, height: h, borderRadius: 10}} />,
  weth: <Image source={WETH} style={{width: w, height: h, borderRadius: 10}} />,
};

export const blockchain = {
  network: 'Aptos',
  token: 'APT',
  api: fullnode,
  chainId: 1,
  blockExplorer: 'https://aptoscan.com/',
  iconSymbol: 'apt',
  decimals: 8,
  aptosConfig: new AptosConfig({
    network,
  }),
  tokens: [
    // Updated 05/MAY/2024
    {
      name: 'Aptos Coin',
      symbol: 'APT',
      address: '0x1::aptos_coin::AptosCoin',
      decimals: 8,
      icon: iconsBlockchain.apt,
      coingecko: 'aptos',
    },
    {
      name: 'USD Coin',
      symbol: 'zUSDC',
      address:
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
      decimals: 6,
      icon: iconsBlockchain.usdc,
      coingecko: 'usd-coin',
    },
    {
      name: 'Tether',
      symbol: 'zUSDT',
      address:
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT',
      decimals: 6,
      icon: iconsBlockchain.usdt,
      coingecko: 'tether',
    },
    {
      name: 'Wrapper (Ether)',
      symbol: 'zWETH',
      address:
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH',
      decimals: 6,
      icon: iconsBlockchain.weth,
      coingecko: 'weth',
    },
  ],
};

export const EntryPoint = '0x0835980A1f2f32A12CA510E73bE3954D9F437114';
export const CloudAccountController =
  '0x72b9EB24BFf9897faD10B3100D35CEE8eDF8E43b';
export const AccountAbstractionFactory =
  '0x2D991fE2767FF819F6b3dab83625d331ecCe61a3';
export const BatchTokenBalancesAddress =
  '0xcdEE75520dcE5240C39a308A705Ed3D6c6D82664';
export const BatchTransactionsAddress =
  '0x0000000000000000000000000000000000000808';
export const CloudPublicKeyEncryption = `
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAtflt9yF4G1bPqTHtOch47UW9hkSi4u2EZDHYLLSKhGMwvHjajTM+
wcgxV8dlaTh1av/2dWb1EE3UMK0KF3CB3TZ4t/p+aQGhyfsGtBbXZuwZAd8CotTn
BLRckt6s3jPqDNR3XR9KbfXzFObNafXYzP9vCGQPdJQzuTSdx5mWcPpK147QfQbR
K0gmiDABYJMMUos8qaiKVQmSAwyg6Lce8x+mWvFAZD0PvaTNwYqcY6maIztT6h/W
mfQHzt9Z0nwQ7gv31KCw0Tlh7n7rMnDbr70+QVd8e3qMEgDYnx7Jm4BzHjr56IvC
g5atj1oLBlgH6N/9aUIlP5gkw89O3hYJ0QIDAQAB
-----END RSA PUBLIC KEY-----
`;
