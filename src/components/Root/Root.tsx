'use client';

import { type PropsWithChildren, useEffect } from 'react';
import {
  initData,
  miniApp,
  useLaunchParams,
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
  const lp = useLaunchParams();
  const { isDarkMode } = useTheme();
  const initDataUser = useSignal(initData.user);

  // Set the user locale and theme class
  useEffect(() => {
    initDataUser && setLocale(initDataUser.language_code);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [initDataUser, isDarkMode]);

  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
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
