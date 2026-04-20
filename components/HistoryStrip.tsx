'use client';

import { HistoryItem } from '@/app/page';

interface Props {
  items: HistoryItem[];
  currentId: string | null;
  onSelect: (item: HistoryItem) => void;
}

export default function HistoryStrip({ items, currentId, onSelect }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col gap-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          历史记录
        </span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--card)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
        >
          {items.length}
        </span>
      </div>

      {/* 横向滚动网格 */}
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => {
          const isActive = item.id === currentId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex-shrink-0 flex flex-col gap-1.5 group"
              style={{ width: '72px' }}
            >
              {/* 缩略图 */}
              <div
                className="relative w-[72px] h-[72px] rounded-xl overflow-hidden transition-all"
                style={{
                  border: isActive
                    ? '2px solid #3b82f6'
                    : '2px solid var(--border)',
                  outline: isActive ? '2px solid rgba(59,130,246,0.3)' : 'none',
                  outlineOffset: '1px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${item.mimeType};base64,${item.imageBase64}`}
                  alt={item.keyword}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {/* active 蒙层 */}
                {isActive && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(59,130,246,0.15)' }}
                  >
                    <i className="ri-eye-line text-white text-xs" />
                  </div>
                )}
              </div>

              {/* 关键词 */}
              <span
                className="text-[10px] text-center truncate w-full leading-tight"
                style={{ color: isActive ? '#60a5fa' : 'var(--text-dim)' }}
              >
                {item.keyword}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
