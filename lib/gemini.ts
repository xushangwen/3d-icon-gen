import { GoogleGenerativeAI } from '@google/generative-ai';

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ConceptOption {
  id: string;          // "B" | "C" | "D" | "E"
  label_zh: string;    // 中文简短标签，如"玻璃秒表"
  full_prompt: string; // 英文生图 prompt
  full_prompt_zh: string; // 中文说明（50字以内）
}

export interface AnalyzeResult {
  style_extracted: string;
  color_hint: string;
  color_palette: string[];           // 从参考图提取的多色板，含 hex，如 ["cerulean blue #007AFF", "ice-white #F0F8FF"]
  secondary_elements: string[];
  concept_options: ConceptOption[];  // 4个创意选项
  recommended_id: string;            // 推荐的默认选项
  // 快捷字段（来自 recommended_id 对应的选项）
  main_element: string;
  full_prompt: string;
  full_prompt_zh: string;
  concept_rationale: string;
}
