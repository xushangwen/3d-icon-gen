'use client';

import { useState } from 'react';
import GeneratorForm from '@/components/GeneratorForm';
import ImageResult from '@/components/ImageResult';
import PromptPreview from '@/components/PromptPreview';
import ReferenceUpload from '@/components/ReferenceUpload';
import HistoryStrip from '@/components/HistoryStrip';
import { AnalyzeResult } from '@/lib/gemini';

type Phase = 'idle' | 'analyzing' | 'analyzed' | 'generating' | 'done' | 'error';

export interface HistoryItem {
  id: string;
  keyword: string;
  imageBase64: string;
  mimeType: string;
  analysis: AnalyzeResult;
  timestamp: number;
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [keyword, setKeyword] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 参考图（无默认，用户必须上传）
  const [refBase64, setRefBase64] = useState<string | null>(null);
  const [refMime, setRefMime] = useState('image/png');
  const [useReference, setUseReference] = useState(true);

  const handleAnalyze = async (kw: string) => {
    if (!refBase64) return;
    setPhase('analyzing');
    setError(null);
    setImageBase64(null);
    setAnalysis(null);
    setKeyword(kw);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw, referenceImageBase64: refBase64, referenceImageMime: refMime }),
      });
      const data: AnalyzeResult = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || '分析失败');

      setAnalysis(data);
      setSelectedOptionId(data.recommended_id);
      setEditablePrompt(data.full_prompt);
      setPhase('analyzed');
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试');
      setPhase('error');
    }
  };

  const handleSelectOption = (id: string) => {
    if (!analysis) return;
    const option = analysis.concept_options.find((o) => o.id === id);
    if (!option) return;
    setSelectedOptionId(id);
    setEditablePrompt(option.full_prompt);
  };

  const handleGenerate = async () => {
    if (!editablePrompt.trim()) return;
    setPhase('generating');
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_prompt: editablePrompt,
          referenceImageBase64: refBase64,
          referenceImageMime: refMime,
          useReference,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');

      setImageBase64(data.imageBase64);
      setMimeType(data.mimeType);
      setPhase('done');

      if (analysis) {
        setHistory((prev) =>
          [
            {
              id: `${Date.now()}`,
              keyword,
              imageBase64: data.imageBase64,
              mimeType: data.mimeType,
              analysis,
              timestamp: Date.now(),
            },
            ...prev,
          ].slice(0, 20)
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setPhase('error');
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setKeyword(item.keyword);
    setAnalysis(item.analysis);
    setSelectedOptionId(item.analysis.recommended_id);
    setEditablePrompt(item.analysis.full_prompt);
    setImageBase64(item.imageBase64);
    setMimeType(item.mimeType);
    setError(null);
    setPhase('done');
  };

  const isFormBusy = phase === 'analyzing' || phase === 'generating';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
          >
            <i className="ri-cube-2-fill text-white text-sm" />
          </div>
          <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            3D Icon Gen
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>1:1 · 2048 × 2048</span>
          <div className="h-4 w-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>by QY.Studio</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── 左侧控制面板 ── */}
        <aside
          className="w-80 flex-shrink-0 flex flex-col gap-6 p-6 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          <div className="space-y-1 pt-1">
            <h1 className="text-lg font-semibold leading-snug">关键词 → 3D 图标</h1>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              上传风格参考图，输入概念关键词，AI 生成等轴测 3D 图标
            </p>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }} />

          <ReferenceUpload
            referenceBase64={refBase64}
            referenceMime={refMime}
            useReference={useReference}
            onUpload={(b64, mime) => { setRefBase64(b64); setRefMime(mime); }}
            onRemove={() => { setRefBase64(null); setRefMime('image/png'); }}
            onToggleReference={setUseReference}
          />

          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* 关键词输入：未上传参考图时禁用 */}
          <div style={{ opacity: refBase64 ? 1 : 0.4, pointerEvents: refBase64 ? 'auto' : 'none' }}>
            <GeneratorForm
              onAnalyze={handleAnalyze}
              analyzing={isFormBusy}
            />
          </div>

          <div
            className="mt-auto rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: 'var(--card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-2">
              <i className="ri-information-line flex-shrink-0 mt-0.5" />
              <span>参考图越清晰，风格匹配越精准。建议上传与目标风格相近的 3D 图标截图。</span>
            </div>
          </div>
        </aside>

        {/* ── 右侧输出区 ── */}
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          <div className="flex flex-col gap-8 p-8">

            {/* 未上传参考图 */}
            {!refBase64 && (
              <div
                className="flex flex-col items-center justify-center gap-5 rounded-2xl w-full max-w-[520px] mx-auto"
                style={{ minHeight: '420px', border: '1px dashed rgba(59,130,246,0.25)' }}
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <i className="ri-image-add-line text-3xl" style={{ color: '#60a5fa' }} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>请先上传风格参考图</p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>AI 会提取参考图的风格并应用到生成结果</p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{ border: '1px dashed rgba(59,130,246,0.3)', color: 'var(--text-dim)' }}
                >
                  <i className="ri-arrow-left-s-line" />
                  在左侧上传参考图
                </div>
              </div>
            )}

            {/* 有参考图但 idle */}
            {refBase64 && phase === 'idle' && (
              <div
                className="flex flex-col items-center justify-center gap-5 rounded-2xl w-full max-w-[520px] mx-auto"
                style={{ minHeight: '420px', border: '1px dashed var(--border)' }}
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <i className="ri-search-eye-line text-3xl" style={{ color: 'var(--text-dim)' }} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>输入关键词后点击「分析关键词」</p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>AI 将提取风格并生成 4 个创意方案供选择</p>
                </div>
              </div>
            )}

            {/* error */}
            {phase === 'error' && error && (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-2xl w-full max-w-[520px] mx-auto"
                style={{ minHeight: '260px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <i className="ri-error-warning-line text-red-500 text-xl" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-red-400">失败</p>
                  <p className="text-xs max-w-60 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{error}</p>
                </div>
                <button
                  onClick={() => setPhase('idle')}
                  className="text-xs px-4 py-2 rounded-xl border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  重新开始
                </button>
              </div>
            )}

            {/* analyzing */}
            {phase === 'analyzing' && (
              <div
                className="flex flex-col items-center justify-center gap-6 rounded-2xl w-full max-w-[520px] mx-auto"
                style={{ minHeight: '420px', border: '1px solid var(--border)', background: 'var(--card)' }}
              >
                <LoadingSpinner />
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-medium text-white">解析语义并提取风格…</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI 正在观察参考图，生成 4 个创意方案</p>
                </div>
              </div>
            )}

            {/* analyzed → PromptPreview */}
            {(phase === 'analyzed' || phase === 'generating') && analysis && (
              <PromptPreview
                analysis={analysis}
                selectedOptionId={selectedOptionId}
                editablePrompt={editablePrompt}
                onPromptChange={setEditablePrompt}
                onSelectOption={handleSelectOption}
                onGenerate={handleGenerate}
                generating={phase === 'generating'}
              />
            )}

            {/* done → ImageResult */}
            {phase === 'done' && imageBase64 && mimeType && (
              <ImageResult
                keyword={keyword}
                imageBase64={imageBase64}
                mimeType={mimeType}
                onBack={() => setPhase('analyzed')}
              />
            )}

            {/* 历史记录 */}
            {history.length > 0 && (
              <HistoryStrip
                items={history}
                currentId={history.find((h) => h.imageBase64 === imageBase64)?.id ?? null}
                onSelect={handleSelectHistory}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <div
        className="absolute w-24 h-24 rounded-full border-2 border-blue-500/20"
        style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
      />
      <div
        className="absolute w-16 h-16 rounded-full border-2 border-blue-500/30"
        style={{ animation: 'pulse-ring 2s ease-in-out infinite 0.3s' }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
      >
        <i className="ri-sparkling-2-fill text-white text-lg" />
      </div>
    </div>
  );
}
