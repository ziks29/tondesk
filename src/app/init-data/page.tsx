/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo } from 'react';
import {
  initData,
  type User,
  useSignal,
  useRawInitData,
} from '@tma.js/sdk-react';

import {
  DisplayData,
  type DisplayDataRow,
} from '@/components/DisplayData/DisplayData';
import { Page } from '@/components/Page';

function getUserRows(user: User): DisplayDataRow[] {
  return Object.entries(user).map(([title, value]) => ({ title, value }));
}

export default function InitDataPage() {
  const initDataRaw = useRawInitData();
  const initDataState = useSignal(initData.state);

  const initDataRows = useMemo<DisplayDataRow[] | undefined>(() => {
    if (!initDataState || !initDataRaw) {
      return;
    }
    return [
      { title: 'raw', value: initDataRaw },
      ...Object.entries(initDataState).reduce<DisplayDataRow[]>(
        (acc, [title, value]) => {
          if (value instanceof Date) {
            acc.push({ title, value: value.toISOString() });
          } else if (!value || typeof value !== 'object') {
            acc.push({ title, value });
          }
          return acc;
        },
        [],
      ),
    ];
  }, [initDataState, initDataRaw]);

  const userRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.user
      ? getUserRows(initDataState.user)
      : undefined;
  }, [initDataState]);

  const receiverRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.receiver
      ? getUserRows(initDataState.receiver)
      : undefined;
  }, [initDataState]);

  const chatRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return !initDataState?.chat
      ? undefined
      : Object.entries(initDataState.chat).map(([title, value]) => ({
          title,
          value,
        }));
  }, [initDataState]);

  if (!initDataRows) {
    return (
      <Page>
        <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <img
            alt="Telegram sticker"
            src="https://xelene.me/telegram.gif"
            className="w-36 h-36"
          />
          <h1 className="text-xl font-bold">Oops</h1>
          <p className="text-sm text-slate-500">Application was launched with missing init data</p>
        </div>
      </Page>
    );
  }
  return (
    <Page>
      <div className="p-4 space-y-2">
        <DisplayData header={'Init Data'} rows={initDataRows} />
        {userRows && <DisplayData header={'User'} rows={userRows} />}
        {receiverRows && (
          <DisplayData header={'Receiver'} rows={receiverRows} />
        )}
        {chatRows && <DisplayData header={'Chat'} rows={chatRows} />}
      </div>
    </Page>
  );
}
