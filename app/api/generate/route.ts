import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

// 垫图模式：参考图锁定风格，只替换中心主体元素，底座/装饰/背景完全继承
const STYLE_ANCHOR_WITH_REF =
  'Use the reference image as a STRICT STYLE TEMPLATE. ' +
  'KEEP EXACTLY AS-IS from the reference: base/pedestal platform, all floating decorative elements (rings, spheres, sparkles), ' +
  'lighting setup, shadow style, material finish, color palette, and camera perspective. ' +
  'REPLACE ONLY the center main object with the one described in the prompt below. ' +
  'Background must be pure white #FFFFFF — remove any scene or environment from the reference if present. ' +
  'Now generate: ';

// 无垫图模式：纯粹按 prompt 描述生成，prompt 自带完整风格描述
const STYLE_ANCHOR_NO_REF =
  'Generate a high-quality photorealistic 3D product icon. ' +
  'Pure white background #FFFFFF only. No text, no letters, no watermarks. ' +
  'Follow the prompt exactly: ';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_prompt, referenceImageBase64, referenceImageMime, useReference } = body;

    if (!full_prompt?.trim()) {
      return NextResponse.json({ error: '缺少生成 Prompt' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

    // 构建 parts：是否垫图由前端开关决定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];

    if (useReference && referenceImageBase64) {
      const refMime = referenceImageMime ?? 'image/png';
      parts.push({ inlineData: { mimeType: refMime, data: referenceImageBase64 } });
      parts.push({ text: STYLE_ANCHOR_WITH_REF + full_prompt });
    } else {
      parts.push({ text: STYLE_ANCHOR_NO_REF + full_prompt });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (model as any).generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['image'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2K',
        },
      },
    });

    const resParts = result.response.candidates?.[0]?.content?.parts ?? [];
    const imgPart = resParts.find(
      (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData
    );

    if (!imgPart?.inlineData) {
      return NextResponse.json({ error: '图片生成失败，模型未返回图像' }, { status: 500 });
    }

    return NextResponse.json({
      imageBase64: imgPart.inlineData.data,
      mimeType: imgPart.inlineData.mimeType,
    });
  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json({ error: '图片生成失败，请重试' }, { status: 500 });
  }
}
