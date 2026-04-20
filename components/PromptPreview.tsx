'use client';

import { useState, useEffect } from 'react';
import { AnalyzeResult } from '@/lib/gemini';

interface Props {
  analysis: AnalyzeResult;
  selectedOptionId: string;
  editablePrompt: string;
  onPromptChange: (prompt: string) => void;
  onSelectOption: (id: string) => void;
  onGenerate: () => void;
  generating: boolean;
}

// 根据自定义元素 + 颜色字符串构建完整提示词
function buildCustomElementPrompt(element: string, analysis: AnalyzeResult, colorsStr: string): string {
  const base = analysis.secondary_elements[0] || '';
  const decos = analysis.secondary_elements.slice(1).filter(Boolean).join('. ');

  return [
    `A ${element} icon,`,
    `rendered in 3D icon style — clean simplified geometric form, flat icon aesthetic in 3D, NOT photorealistic, smooth surfaces with no fine texture detail.`,
    `Each distinct structural component uses a DIFFERENT color from the palette: ${colorsStr}.`,
    `Clear color-blocking between parts, smooth surfaces.`,
    base ? `Placed on ${base}.` : '',
    decos ? `${decos} surrounding the scene.` : '',
    `Soft studio key light from top-back-right, subtle ambient fill below.`,
    `Pure white background #FFFFFF.`,
    `Isometric 30° elevated 3/4 view.`,
    `3D product icon render, crisp clean edges suitable for PNG cutout.`,
    `No text, no letters, no watermarks. 2048x2048.`,
  ].filter(Boolean).join(' ');
}

export default function PromptPreview({
  analysis,
  selectedOptionId,
  editablePrompt,
  onPromptChange,
  onSelectOption,
  onGenerate,
  generating,
}: Props) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customElementText, setCustomElementText] = useState('');
  // 激活色板：从 analysis 初始化，用户可删减
  const [activePalette, setActivePalette] = useState<string[]>(analysis.color_palette || []);

  // analysis 更新（重新分析）时重置色板
  useEffect(() => {
    setActivePalette(analysis.color_palette || []);
    setIsCustomMode(false);
    setCustomElementText('');
  }, [analysis]);

  // 将激活色板注入提示词字符串（替换原始色板字符串）
  const injectPalette = (prompt: string, palette: string[]): string => {
    if (!analysis.color_palette?.length || !palette.length) return prompt;
    const originalStr = analysis.color_palette.join(' / ');
    const newStr = palette.join(' / ');
    return prompt.includes(originalStr) ? prompt.replace(originalStr, newStr) : prompt;
  };

  const activeColorsStr = activePalette.length > 0 ? activePalette.join(' / ') : analysis.color_hint;

  // 删除某个颜色
  const handleRemoveColor = (idx: number) => {
    const newPalette = activePalette.filter((_, i) => i !== idx);
    setActivePalette(newPalette);
    const newColorsStr = newPalette.length > 0 ? newPalette.join(' / ') : analysis.color_hint;
    if (isCustomMode && customElementText.trim()) {
      onPromptChange(buildCustomElementPrompt(customElementText.trim(), analysis, newColorsStr));
    } else {
      onPromptChange(injectPalette(editablePrompt, newPalette));
    }
  };

  // 切换预设选项：退出自定义模式，并注入激活色板
  const handleSelectPreset = (id: string) => {
    setIsCustomMode(false);
    const option = analysis.concept_options.find((o) => o.id === id);
    if (!option) return;
    onSelectOption(id);
    onPromptChange(injectPalette(option.full_prompt, activePalette));
  };

  // 自定义元素或色板变化时重新构建提示词
  useEffect(() => {
    if (!isCustomMode || !customElementText.trim()) return;
    onPromptChange(buildCustomElementPrompt(customElementText.trim(), analysis, activeColorsStr));
  }, [customElementText, isCustomMode, activePalette]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentOption = isCustomMode ? null : analysis.concept_options.find((o) => o.id === selectedOptionId);
  const zhDesc = currentOption?.full_prompt_zh ?? (isCustomMode ? '' : analysis.full_prompt_zh);

  return (
    <div className="flex flex-col gap-5 w-full max-w-[600px] mx-auto">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          <i className="ri-search-eye-line text-sm" style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>分析完成，确认提示词后生成</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>选择主体方案 · 可编辑提示词 · 点击生成</p>
        </div>
      </div>

      {/* 概念决策 */}
      {analysis.concept_rationale && (
        <div
          className="text-[12px] leading-relaxed px-3.5 py-2.5 rounded-xl italic"
          style={{ background: 'rgba(37,99,235,0.07)', color: '#93c5fd', border: '1px solid rgba(37,99,235,0.15)' }}
        >
          <i className="ri-lightbulb-flash-line mr-1.5 not-italic" />
          {analysis.concept_rationale}
        </div>
      )}

      {/* 风格提取 */}
      {analysis.style_extracted && (
        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
            从参考图提取的风格
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {analysis.style_extracted}
          </p>
          {/* 多色板色块预览 + 删除 */}
          {analysis.color_palette?.length > 0 ? (
            <div className="pt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  提取色板
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                  {activePalette.length}/{analysis.color_palette.length} 启用 · 点击 × 移除
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.color_palette.map((entry, i) => {
                  const hexMatch = entry.match(/#([0-9A-Fa-f]{3,8})/);
                  const hex = hexMatch ? hexMatch[0] : null;
                  const label = entry.split(' — ')[0].trim();
                  const isActive = activePalette.includes(entry);
                  return (
                    <div
                      key={i}
                      className="group flex items-center gap-1.5 rounded-full px-2 py-1 transition-all"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? 'var(--border)' : 'rgba(255,255,255,0.06)'}`,
                        opacity: isActive ? 1 : 0.38,
                      }}
                    >
                      {hex && (
                        <span
                          className="inline-block w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                          style={{ background: hex, filter: isActive ? 'none' : 'grayscale(1)' }}
                        />
                      )}
                      <span className="text-[10px]" style={{ color: isActive ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                        {label}
                      </span>
                      {isActive ? (
                        <button
                          onClick={() => handleRemoveColor(activePalette.indexOf(entry))}
                          disabled={generating || activePalette.length <= 1}
                          className="ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                          style={{ color: 'var(--text-dim)' }}
                          title="移除此颜色"
                        >
                          <i className="ri-close-line text-[10px]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const newPalette = [...activePalette, entry];
                            setActivePalette(newPalette);
                            const newColorsStr = newPalette.join(' / ');
                            if (isCustomMode && customElementText.trim()) {
                              onPromptChange(buildCustomElementPrompt(customElementText.trim(), analysis, newColorsStr));
                            } else {
                              onPromptChange(injectPalette(editablePrompt, newPalette));
                            }
                          }}
                          disabled={generating}
                          className="ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-dim)' }}
                          title="重新启用此颜色"
                        >
                          <i className="ri-add-line text-[10px]" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : analysis.color_hint ? (
            <p className="text-[11px] pt-1" style={{ color: 'var(--text-dim)' }}>
              <span className="font-medium" style={{ color: 'var(--text-muted)' }}>色调：</span>
              {analysis.color_hint}
            </p>
          ) : null}
        </div>
      )}

      {/* ── 主体元素选择 chips ── */}
      {analysis.concept_options.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
            选择主体方案
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.concept_options.map((option) => {
              const isSelected = !isCustomMode && option.id === selectedOptionId;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectPreset(option.id)}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all disabled:opacity-50"
                  style={{
                    background: isSelected ? 'rgba(37,99,235,0.15)' : 'var(--card)',
                    color: isSelected ? '#60a5fa' : 'var(--text-muted)',
                    border: isSelected ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  {isSelected && <i className="ri-check-line text-xs" />}
                  <span className="text-[10px] opacity-50 mr-0.5">{option.id}</span>
                  {option.label_zh}
                </button>
              );
            })}

            {/* 自定义 chip */}
            <button
              onClick={() => setIsCustomMode(true)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all disabled:opacity-50"
              style={{
                background: isCustomMode ? 'rgba(124,58,237,0.15)' : 'var(--card)',
                color: isCustomMode ? '#a78bfa' : 'var(--text-muted)',
                border: isCustomMode ? '1px solid rgba(124,58,237,0.4)' : '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (!isCustomMode) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)';
                  (e.currentTarget as HTMLElement).style.color = '#a78bfa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCustomMode) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                }
              }}
            >
              {isCustomMode ? <i className="ri-check-line text-xs" /> : <i className="ri-edit-line text-xs" />}
              自定义
            </button>
          </div>

          {/* 自定义主体输入框 */}
          {isCustomMode && (
            <div className="flex flex-col gap-1.5 mt-0.5">
              <input
                type="text"
                value={customElementText}
                onChange={(e) => setCustomElementText(e.target.value)}
                placeholder="输入主体元素，如：秒表、火箭、盾牌、漏斗..."
                disabled={generating}
                autoFocus
                className="w-full text-[12px] rounded-xl px-3.5 py-2.5 border transition-colors disabled:opacity-50"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text)',
                  borderColor: 'rgba(124,58,237,0.35)',
                  outline: 'none',
                  fontFamily: 'var(--font-space-grotesk), monospace',
                }}
                onFocus={(e) => { (e.currentTarget).style.borderColor = 'rgba(124,58,237,0.6)'; }}
                onBlur={(e) => { (e.currentTarget).style.borderColor = 'rgba(124,58,237,0.35)'; }}
              />
              {customElementText.trim() && (
                <p className="text-[10px] px-1" style={{ color: 'var(--text-dim)' }}>
                  <i className="ri-sparkling-2-line mr-1" />
                  提示词已自动构建，可在下方编辑区调整细节
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 可编辑提示词 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
            完整提示词（可编辑）
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            {editablePrompt.length} chars
          </span>
        </div>
        <textarea
          value={editablePrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={generating}
          rows={6}
          className="w-full text-[12px] leading-relaxed rounded-xl px-4 py-3 resize-none border transition-colors disabled:opacity-50"
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
            fontFamily: 'var(--font-space-grotesk), monospace',
            outline: 'none',
          }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.5)'; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
        />

        {/* 中文说明 */}
        {zhDesc && (
          <div
            className="text-[11px] leading-relaxed px-3.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
          >
            <span className="font-medium mr-1.5" style={{ color: 'var(--text-muted)' }}>中文说明</span>
            {zhDesc}
          </div>
        )}
      </div>

      {/* 生成按钮 */}
      <button
        onClick={onGenerate}
        disabled={generating || !editablePrompt.trim()}
        className="w-full rounded-2xl py-3.5 font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: generating
            ? 'var(--card)'
            : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          border: generating ? '1px solid var(--border)' : 'none',
          color: generating ? 'var(--text-muted)' : 'white',
        }}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2.5">
            <span
              className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
            生成中…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <i className="ri-image-ai-line" />
            生成图像
          </span>
        )}
      </button>
    </div>
  );
}
