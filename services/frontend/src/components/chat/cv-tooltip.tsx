'use client';

import { useEffect, useState } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { getCvDetail, CvDetail } from '@/lib/api';

interface CvTooltipProps {
  cvId: string;
  children: React.ReactNode;
}

export function CvTooltip({ cvId, children }: CvTooltipProps) {
  const [detail, setDetail] = useState<CvDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await getCvDetail(cvId);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(null), 1500);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const copy = async (text: string | undefined, type: 'email' | 'phone') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
    } catch {}
  };

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root onOpenChange={(open) => open && !detail && fetchDetail()}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl"
          >
            {loading || !detail ? (
              <div className="space-y-3">
                <Skeleton width={140} height={16} />
                <Skeleton width={90} height={12} />
                <Skeleton count={2} height={10} />
                <div className="flex flex-wrap gap-1 pt-1">
                  <Skeleton width={60} height={20} borderRadius={8} />
                  <Skeleton width={70} height={20} borderRadius={8} />
                  <Skeleton width={55} height={20} borderRadius={8} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold text-gray-900 leading-tight">{detail.name}</div>
                  <div className="text-xs text-gray-500">{detail.role}</div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{detail.summary}</p>

                {detail.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {detail.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {(detail.email || detail.phone) && (
                  <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5">
                    {detail.email && (
                      <button
                        onClick={() => copy(detail.email, 'email')}
                        className="flex items-center justify-between text-xs text-gray-600 hover:text-blue-600 text-left"
                      >
                        <span className="truncate mr-2">{detail.email}</span>
                        <span className="shrink-0 text-[10px] font-medium text-gray-400">
                          {copied === 'email' ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                    )}
                    {detail.phone && (
                      <button
                        onClick={() => copy(detail.phone, 'phone')}
                        className="flex items-center justify-between text-xs text-gray-600 hover:text-blue-600 text-left"
                      >
                        <span className="truncate mr-2">{detail.phone}</span>
                        <span className="shrink-0 text-[10px] font-medium text-gray-400">
                          {copied === 'phone' ? 'Copied!' : 'Copy'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
