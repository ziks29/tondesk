import { isRGB } from '@tma.js/sdk-react';
import type { FC, ReactNode } from 'react';

import { RGB } from '@/components/RGB/RGB';
import { Link } from '@/components/Link/Link';
import { bem } from '@/css/bem';

import './DisplayData.css';

const [, e] = bem('display-data');

export type DisplayDataRow = { title: string } & (
  | { type: 'link'; value?: string }
  | { value: ReactNode }
);

export interface DisplayDataProps {
  header?: ReactNode;
  footer?: ReactNode;
  rows: DisplayDataRow[];
}

export const DisplayData: FC<DisplayDataProps> = ({ header, rows }) => (
  <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
    {header && (
      <div className="bg-slate-50/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
        {header}
      </div>
    )}
    <div className="divide-y divide-slate-100">
      {rows.map((item, idx) => {
        let valueNode: ReactNode;

        if (item.value === undefined) {
          valueNode = <i className="text-slate-400">empty</i>;
        } else {
          if ('type' in item) {
            valueNode = item.value ? <Link href={item.value} className="text-[#0088cc] hover:underline">Open</Link> : <i className="text-slate-400">empty</i>;
          } else if (typeof item.value === 'string') {
            valueNode = isRGB(item.value) ? (
              <RGB color={item.value} />
            ) : (
              <span className="break-all text-slate-700">{item.value}</span>
            );
          } else if (typeof item.value === 'boolean') {
            valueNode = (
              <div className={`h-5 w-5 rounded border ${item.value ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'} flex items-center justify-center`}>
                {item.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            );
          } else {
            valueNode = item.value;
          }
        }

        return (
          <div key={idx} className="p-4 flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{item.title}</span>
            <div className="text-sm">{valueNode}</div>
          </div>
        );
      })}
    </div>
  </div>
);
