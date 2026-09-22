// ============================================================
// 经验频率计算 —— JTG C30-2015 式 6.2.3
// 连序系列：Pm = m/(n+1)
// 不连序系列（特大洪水）两种处理方法（教材《桥涵水文》第五章）：
//   方法一（独立处理）：特大 PM = M/(N+1)；实测 Pm = m/(n+1)；重复取小
//   方法二（条件概率）：实测期一般项
//     Pm = PM,l + (1 − PM,l)·(m − l)/(n − l + 1)
//     PM,l 为实测期内最后一个特大洪水的经验频率
// ============================================================

// 连序系列：输入按大到小排序的系列长度 n，返回各项经验频率（%）
export function empiricalContinuous(n: number): number[] {
  const out: number[] = [];
  for (let m = 1; m <= n; m++) out.push((100 * m) / (n + 1));
  return out;
}

export interface DiscontinuousInput {
  // 考证期 N 年内已定序位的特大洪水（M 为 N 年内从大到小序位）
  historical: Array<{ M: number }>;
  // 实测系列按大到小排序的流量（前 l 项为特大洪水，已在实测期内）
  measuredRank: number[]; // 序号 m = 1..n
  l: number;              // 实测系列中按特大处理的项数
  N: number;              // 考证期年数
}

export interface FreqPoint {
  kind: "historical" | "measured";
  rank: number;
  p: number; // 经验频率 %
}

// 方法一（独立处理法）
export function empiricalMethodA(input: DiscontinuousInput): FreqPoint[] {
  const out: FreqPoint[] = [];
  for (const h of input.historical) {
    out.push({ kind: "historical", rank: h.M, p: (100 * h.M) / (input.N + 1) });
  }
  const n = input.measuredRank.length;
  for (let m = 1; m <= n; m++) {
    out.push({ kind: "measured", rank: m, p: (100 * m) / (n + 1) });
  }
  return out;
}

// 方法二（统一样本法 / 条件概率法）
// 特大洪水 PM = M/(N+1)；实测期一般洪水（m = l+1..n）：
//   Pm = a/(N+1) + (1 − a/(N+1))·(m − l)/(n − l + 1)
// 来源：《水利水电工程设计洪水计算规范》统一样本法（与百度百科、
// 干旱区地理 2004 论文形式一致；土木在线算例 T3 中的 5.81% 即 a/(N+1) = 5/86）
export function empiricalMethodB(input: DiscontinuousInput): FreqPoint[] {
  const out: FreqPoint[] = [];
  for (const h of input.historical) {
    out.push({ kind: "historical", rank: h.M, p: (100 * h.M) / (input.N + 1) });
  }
  const n = input.measuredRank.length;
  const l = input.l;
  const a = input.historical.length;
  const pA = (100 * a) / (input.N + 1); // 全部 a 项特大之后的累计频率
  for (let m = l + 1; m <= n; m++) {
    const p = pA + (1 - pA / 100) * ((100 * (m - l)) / (n - l + 1));
    out.push({ kind: "measured", rank: m, p });
  }
  return out;
}
