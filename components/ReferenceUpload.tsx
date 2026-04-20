'use client';

import { useRef, useState } from 'react';

interface Props {
  referenceBase64: string | null;
  referenceMime: string;
  useReference: boolean;
  onUpload: (base64: string, mime: string) => void;
  onRemove: () => void;
  onToggleReference: (val: boolean) => void;
}

export default function ReferenceUpload({
  referenceBase64,
  referenceMime,
  useReference,
  onUpload,
  onRemove,
  onToggleReference,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpload(dataUrl.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
          风格参考图
        </span>
        {referenceBase64 && (
          <button
            onClick={onRemove}
            className="text-[11px] flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <i className="ri-delete-bin-line text-xs" />
            移除
          </button>
        )}
      </div>

      {/* 上传区 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="relative cursor-pointer rounded-2xl overflow-hidden border transition-all duration-200 group"
        style={{
          borderColor: dragging ? 'var(--accent)' : referenceBase64 ? 'var(--border)' : 'rgba(59,130,246,0.3)',
          borderStyle: referenceBase64 ? 'solid' : 'dashed',
          background: 'var(--card)',
        }}
      >
        {referenceBase64 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`data:${referenceMime};base64,${referenceBase64}`}
            alt="风格参考"
            className="w-full object-cover"
            style={{ maxHeight: '180px' }}
          />
        ) : (
          <div className="h-36 flex flex-col items-center justify-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <i className="ri-upload-cloud-2-line text-lg" style={{ color: '#60a5fa' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>上传参考图</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>拖拽或点击选择</p>
            </div>
          </div>
        )}

        {/* Hover overlay（已有图时才显示替换提示）*/}
        {referenceBase64 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(8,8,8,0.72)', backdropFilter: 'blur(4px)' }}
          >
            <i className="ri-repeat-2-line text-xl text-white" />
            <span className="text-xs text-zinc-300">替换参考图</span>
          </div>
        )}

        {dragging && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: '2px solid var(--accent)' }}
          />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 垫图开关 */}
      <div
        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 mt-0.5"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          opacity: referenceBase64 ? 1 : 0.4,
          pointerEvents: referenceBase64 ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-medium" style={{ color: 'var(--text)' }}>垫图生成</span>
          <span className="text-[10px] leading-tight" style={{ color: 'var(--text-dim)' }}>
            生图时将参考图发给模型
          </span>
        </div>
        <button
          role="switch"
          aria-checked={useReference}
          onClick={() => onToggleReference(!useReference)}
          className="relative flex-shrink-0 rounded-full transition-colors duration-200"
          style={{
            background: useReference ? '#2563eb' : 'var(--border)',
            width: '40px',
            height: '22px',
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: useReference ? 'translateX(18px)' : 'translateX(0)' }}
          />
        </button>
      </div>

      {!referenceBase64 && (
        <p className="text-[11px]" style={{ color: '#60a5fa' }}>
          <i className="ri-information-line mr-1" />
          需要先上传参考图才能开始分析
        </p>
      )}
    </div>
  );
}
