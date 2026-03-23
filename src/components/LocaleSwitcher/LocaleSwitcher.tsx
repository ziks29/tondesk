'use client';

import { useLocale } from 'next-intl';
import { FC } from 'react';

import { localesMap } from '@/core/i18n/config';
import { setLocale } from '@/core/i18n/locale';
import { Locale } from '@/core/i18n/types';

export const LocaleSwitcher: FC = () => {
  const locale = useLocale();

  const onChange = (value: string) => {
    const locale = value as Locale;
    setLocale(locale);
  };

  return (
    <select
      value={locale}
      onChange={({ target }) => onChange(target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2 text-sm outline-none transition-all focus:border-[#0088cc] focus:ring-4 focus:ring-[#0088cc]/10"
    >
      {localesMap.map((locale) => (
        <option key={locale.key} value={locale.key}>{locale.title}</option>
      ))}
    </select>
  );
};
