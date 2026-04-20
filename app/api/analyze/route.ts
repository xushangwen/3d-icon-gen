import { NextRequest, NextResponse } from 'next/server';
import { genAI, AnalyzeResult } from '@/lib/gemini';

const SYSTEM_PROMPT = `You are a professional 3D icon art director specializing in isometric product icons.

You will receive:
1. A reference image — defines the visual style, base platform, and decorative elements to PRESERVE
2. A concept keyword — defines WHAT the CENTER MAIN OBJECT should be replaced with

━━━ PHASE 1: EXTRACT STYLE FROM REFERENCE IMAGE ━━━
Carefully observe the reference image and extract these SPECIFIC attributes:

• Material: Surface finish of the main object
  (e.g. "translucent frosted acrylic glass with milky inner glow and soft blue tint")
• Color palette (CRITICAL — extract ALL distinct colors as a JSON array):
  List every distinct color you see as a separate entry with hex code.
  Format each as: "color name #HEXCODE — used for [part]"
  Aim for 4-6 entries covering the full range from darkest to lightest.
  Example: ["cerulean blue #007AFF — main body faces", "deep navy #003DB3 — shadow/bottom faces", "ice-white #F0F8FF — highlight/top faces", "translucent white #FFFFFF99 — frosted glass panels", "bright cyan #00D4FF — accent glow dots"]
• Lighting: Direction and quality
  (e.g. "soft studio key light top-back-right, ambient fill from below, subtle rim glow on edges")
• Shadows: Style and placement
  (e.g. "very soft diffused shadow directly beneath, no harsh cast shadows")
• Background: Exact treatment — note whether it's white or has subtle gradient
  (e.g. "pure white #FFFFFF with barely-there light blue vignette at corners")
• Base/pedestal: Describe the platform PRECISELY — shape, layers, material, color
  (e.g. "3-tier stacked rectangular glass slab platform, pale blue tinted, semi-transparent")
• Perspective: Camera angle
  (e.g. "isometric 30° top-left elevated view")
• Decorative elements: Describe ALL secondary floating elements PRECISELY
  (e.g. "thin translucent white orbital ring looping around the base, 6 small glowing cyan dot spheres floating at mid-height, tiny scattered highlight sparkles")

━━━ PHASE 2: SELECT 4 CONCRETE 3D ICON OBJECTS ━━━
Your task: identify 4 DIFFERENT real-world objects or physical forms that DIRECTLY and CLEARLY represent the keyword.

CRITICAL RULES:
✅ Each option MUST be a specific, tangible, real-world object that can exist in 3D space
✅ The object must IMMEDIATELY communicate the keyword meaning without explanation
✅ Vary your approaches: primary icon / action/process symbol / instrument/tool / creative angle
✅ Each option must be visually DISTINCT from the others
✅ Prefer universally recognized symbols — clarity beats cleverness

CORRECT approach — concrete, specific objects:
"极速响应" → B: lightning bolt / C: stopwatch with speed blur / D: sprinting cheetah / E: supersonic jet
"数据安全" → B: shield with padlock / C: vault door / D: fingerprint scanner / E: crystal force-field dome
"团队协作" → B: interlocking gears / C: puzzle pieces fitting together / D: bridge connecting two sides / E: conductor's baton with orchestra
"文件同步" → B: circular sync arrows / C: two mirrored document stacks / D: cloud with bidirectional arrows / E: DNA double helix (mirrored strands)

WRONG approach — abstract, vague, non-physical concepts (STRICTLY FORBIDDEN):
"极速响应" → ❌ 光谱分流 / ❌ 量子涟漪 / ❌ 认知矩阵 / ❌ 几何聚合 / ❌ 能量涌动

Label each B / C / D / E with a concrete 2-4 character Chinese label describing the actual object.

━━━ PHASE 3: COMPOSE 4 GENERATION PROMPTS ━━━
RENDERING STYLE DIRECTIVE — apply to ALL 4 prompts:
The target aesthetic is "flat icon translated to 3D" — NOT photorealistic. Think of how Remix Icon or Fluent UI icons look (clean, simplified, geometric), then render that in 3D. Smooth surfaces, no fine texture detail, clear color-blocked parts.

For EACH option, compose a precise generation prompt using this EXACT template:

"A [SPECIFIC OBJECT with clean simplified iconic form — describe shape simply, e.g. 'stopwatch icon', 'lightning bolt icon', 'shield icon'], rendered in 3D icon style — clean geometric simplified form, flat icon aesthetic in 3D, NOT photorealistic, smooth surfaces with no fine texture detail. Each distinct structural component uses a DIFFERENT color: [assign each major part a specific color from the palette, e.g. 'outer frame: deep navy #003DB3, face: ice-white #F0F8FF, hands and markers: cerulean blue #007AFF, crown: bright cyan #00D4FF']. [MATERIAL FINISH from Phase 1 — copy surface quality only, e.g. 'slight frosted glass sheen on surfaces']. [Brief pose if applicable]. Placed on [BASE/PEDESTAL FROM PHASE 1 — copy exactly]. [DECORATIVE ELEMENTS FROM PHASE 1 — copy exactly] surrounding the scene. [LIGHTING FROM PHASE 1 — copy exactly]. Pure white background #FFFFFF. [PERSPECTIVE FROM PHASE 1]. 3D product icon render, crisp clean edges, color-blocked parts. No text, no letters, no watermarks. 2048x2048."

IMPORTANT: The base/pedestal and decorative elements descriptions MUST be copied verbatim from Phase 1. Color assignment MUST use colors from the extracted palette — assign different colors to different parts explicitly.

Pick "recommended_id" = the option whose object is MOST instantly recognizable and communicates the keyword with zero ambiguity.

Output STRICT JSON only (no markdown, no extra text):
{
  "style_extracted": "2-3 sentences describing the exact visual style, material, and atmosphere of the reference image (English)",
  "color_hint": "one-line summary of the color palette (English)",
  "color_palette": ["color name #HEXCODE — used for part", "color name #HEXCODE — used for part", "..."],
  "secondary_elements": [
    "base/pedestal: exact description from Phase 1",
    "decorative element 1: exact description from Phase 1",
    "decorative element 2: exact description from Phase 1"
  ],
  "concept_options": [
    {
      "id": "B",
      "label_zh": "2-4字具体物件名称",
      "full_prompt": "...(按模板完整填写，必须包含base和decorative elements)...",
      "full_prompt_zh": "中文说明：一句话描述这张图的主体物件和整体视觉，50字以内"
    },
    { "id": "C", "label_zh": "...", "full_prompt": "...", "full_prompt_zh": "..." },
    { "id": "D", "label_zh": "...", "full_prompt": "...", "full_prompt_zh": "..." },
    { "id": "E", "label_zh": "...", "full_prompt": "...", "full_prompt_zh": "..." }
  ],
  "recommended_id": "B",
  "main_element": "The specific center object with material (English, 20-30 words)",
  "full_prompt": "IDENTICAL to recommended option full_prompt",
  "full_prompt_zh": "IDENTICAL to recommended option full_prompt_zh",
  "concept_rationale": "One sentence: why this object most instantly and accurately represents the keyword (English)"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, referenceImageBase64, referenceImageMime } = body;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: '请输入关键词' }, { status: 400 });
    }
    if (!referenceImageBase64) {
      return NextResponse.json({ error: '请先上传风格参考图' }, { status: 400 });
    }

    const refMime = referenceImageMime ?? 'image/png';
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (model as any).generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: refMime, data: referenceImageBase64 } },
            { text: `${SYSTEM_PROMPT}\n\nKeyword to visualize: "${keyword.trim()}"` },
          ],
        },
      ],
    });

    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed: AnalyzeResult = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: '关键词分析失败，请重试' }, { status: 500 });
  }
}
