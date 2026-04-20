'use client';

interface Props {
  keyword: string;
  imageBase64: string;
  mimeType: string;
  onBack: () => void;
}

export default function ImageResult({ keyword, imageBase64, mimeType, onBack }: Props) {
  const handleDownload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${keyword || 'icon'}-2k.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        },
        'image/jpeg',
        0.95
      );
    };
    img.src = `data:${mimeType};base64,${imageBase64}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[520px] mx-auto">
      {/* 1:1 正方形预览 */}
      <div
        className="relative w-full rounded-2xl overflow-hidden group"
        style={{
          aspectRatio: '1 / 1',
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:${mimeType};base64,${imageBase64}`}
          alt={keyword}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Hover 遮罩 */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }}
        >
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <i className="ri-download-2-line" />
            下载 2K
          </button>
        </div>

        {/* 尺寸 badge */}
        <div
          className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          2048 × 2048
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
        >
          <i className="ri-download-2-line" />
          下载 JPG 2K
        </button>

        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          title="返回编辑提示词"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          <i className="ri-edit-2-line" />
          编辑提示词
        </button>
      </div>
    </div>
  );
}
