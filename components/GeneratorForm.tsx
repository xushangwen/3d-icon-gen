'use client';

import { useRef } from 'react';

interface Props {
  onAnalyze: (keyword: string) => void;
  analyzing: boolean;
}

const EXAMPLES = ['极速响应', '安全加密', '数据分析', '智能推荐', '云端存储'];

export default function GeneratorForm({ onAnalyze, analyzing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const kw = inputRef.current?.value.trim();
    if (kw) onAnalyze(kw);
  };

  const handleExample = (kw: string) => {
    if (inputRef.current) inputRef.current.value = kw;
    if (!analyzing) onAnalyze(kw);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
          关键词
        </span>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 border transition-colors"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <i className="ri-search-line flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="描述你想要的概念，如：极速响应"
            disabled={analyzing}
            className="flex-1 bg-transparent text-sm disabled:opacity-50"
            style={{ color: 'var(--text)', fontFamily: 'inherit' }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleExample(ex)}
              disabled={analyzing}
              className="text-[11px] px-2.5 py-1 rounded-full border transition-all disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={analyzing}
        className="w-full rounded-2xl py-3.5 font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: analyzing
            ? 'var(--card)'
            : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          border: analyzing ? '1px solid var(--border)' : 'none',
          color: analyzing ? 'var(--text-muted)' : 'white',
        }}
      >
        {analyzing ? (
          <span className="flex items-center justify-center gap-2.5">
            <span
              className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
            分析中…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <i className="ri-search-eye-line" />
            分析关键词
          </span>
        )}
      </button>
    </form>
  );
}
