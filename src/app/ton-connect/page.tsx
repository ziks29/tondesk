'use client';

import { openLink } from '@tma.js/sdk-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

import { DisplayData } from '@/components/DisplayData/DisplayData';
import { Page } from '@/components/Page';
import { bem } from '@/css/bem';

import './TONConnectPage.css';

const [, e] = bem('ton-connect-page');

export default function TONConnectPage() {
  const wallet = useTonWallet();

  if (!wallet) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">TON Connect</h1>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              To display the data related to the TON Connect, it is required
              to connect your wallet
            </p>
          </div>
          <TonConnectButton />
        </div>
      </Page>
    );
  }

  const {
    account: { chain, publicKey, address },
    device: { appName, appVersion, maxProtocolVersion, platform, features },
  } = wallet;

  return (
    <Page>
      <div className="p-4 space-y-6">
        {'imageUrl' in wallet && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-3xl border border-slate-200 bg-white/50 backdrop-blur-xl">
            <img
              src={wallet.imageUrl}
              alt="Provider logo"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">{wallet.name}</h3>
              <p className="text-xs text-slate-500">{wallet.appName}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openLink(wallet.aboutUrl)}
                className="px-4 py-2 text-xs font-semibold text-[#0088cc] rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors"
              >
                About wallet
              </button>
              <TonConnectButton />
            </div>
          </div>
        )}
        <DisplayData
          header="Account"
          rows={[
            { title: 'Address', value: address },
            { title: 'Chain', value: chain },
            { title: 'Public Key', value: publicKey },
          ]}
        />
        <DisplayData
          header="Device"
          rows={[
            { title: 'App Name', value: appName },
            { title: 'App Version', value: appVersion },
            { title: 'Max Protocol Version', value: maxProtocolVersion },
            { title: 'Platform', value: platform },
            {
              title: 'Features',
              value: features
                .map((f) => (typeof f === 'object' ? f.name : undefined))
                .filter((v) => v)
                .join(', '),
            },
          ]}
        />
      </div>
    </Page>
  );
}
