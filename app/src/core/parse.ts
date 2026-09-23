// ============================================================
// 流量系列文本解析 —— 系列输入统一入口（UI 与测试共用，杜绝双份实现）
// 规则：按空白/中英文逗号/中英文分号切分；容忍多余分隔符；
//       无效 token（非数值、≤0、NaN/Infinity）不计入系列但逐条报告。
// 返回 ignored 让界面明示"已忽略 N 个值"（v0.7 曾静默过滤，评估报告坑1）。
// ============================================================

export interface ParsedSeries {
  values: number[];   // 有效流量（保持输入顺序，未排序）
  ignored: string[];  // 被忽略的原始 token（逐条，供界面提示）
}

export function parseSeries(text: string): ParsedSeries {
  if (typeof text !== "string") throw new Error("系列输入必须为字符串");
  const tokens = text.split(/[\s,，;；]+/).filter(Boolean);
  const values: number[] = [];
  const ignored: string[] = [];
  for (const tok of tokens) {
    const v = Number(tok);
    if (Number.isFinite(v) && v > 0) values.push(v);
    else ignored.push(tok);
  }
  return { values, ignored };
}

// 特大洪水补充输入复用同一解析（语义相同：都是"一串正数流量"）
export function parseFloodValues(text: string): ParsedSeries {
  return parseSeries(text);
}
