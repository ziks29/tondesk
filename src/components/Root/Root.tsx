'use client';

import { type PropsWithChildren, useEffect } from 'react';
import {
  initData,
  useSignal,
} from '@tma.js/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { useDidMount } from '@/hooks/useDidMount';
import { setLocale } from '@/core/i18n/locale';
import { useTheme } from '@/core/theme/provider';

import './styles.css';

function RootInner({ children }: PropsWithChildren) {
  const { isDarkMode } = useTheme();
  const initDataUser = useSignal(initData.user);
  const manifestUrl =
    typeof window === 'undefined'
      ? '/api/tonconnect-manifest'
      : `${window.location.origin}/api/tonconnect-manifest`;

  // Set the user locale
  useEffect(() => {
    initDataUser && setLocale(initDataUser.language_code);
  }, [initDataUser]);

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        modals: 'all',
        notifications: 'all',
        returnStrategy: 'back',
      }}
    >
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </TonConnectUIProvider>
  );
}

export function Root(props: PropsWithChildren) {
  // Unfortunately, Telegram Mini Apps does not allow us to use all features of
  // the Server Side Rendering. That's why we are showing loader on the server
  // side.
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : (
    <div className="root__loading">Loading</div>
  );
}
