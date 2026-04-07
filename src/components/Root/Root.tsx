'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  isTMA,
  initData,
  useSignal,
} from '@tma.js/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { usePathname } from 'next/navigation';

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
  const didMount = useDidMount();
  const pathname = usePathname();
  const [tmaReady, setTmaReady] = useState(false);

  const isWebPage = pathname === '/web' || pathname?.startsWith('/web/');

  useEffect(() => {
    if (isWebPage || process.env.NODE_ENV !== 'production') {
      setTmaReady(true);
      return;
    }
    isTMA('complete').then((result) => {
      if (!result) {
        window.location.replace('/web');
      } else {
        setTmaReady(true);
      }
    }).catch(() => {
      window.location.replace('/web');
    });
  }, [isWebPage]);

  // Landing page: render children with no TMA/TonConnect providers
  if (isWebPage) {
    return <>{props.children}</>;
  }

  if (!didMount || !tmaReady) {
    return <div className="root__loading">Loading</div>;
  }

  return (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  );
}
