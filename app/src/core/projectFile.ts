// ============================================================
// 工程文件（项目文件）导入/导出 —— JTG C30 计算书前置：项目名/桥位/计算人/复核人
// Schema：hongsuan-project@1
//   { schema, savedAt, appVersion, project: {name, bridgeSite, engineer, reviewer, note},
//     state: <collectInputs() 同构> }
// 校验响亮失败；状态字段由 UI 层透传（本模块只校验容器与项目信息）。
// ============================================================

export const PROJECT_SCHEMA = "hongsuan-project@1";

export interface ProjectInfo {
  name: string;      // 项目名
  bridgeSite: string; // 桥位/断面
  engineer: string;  // 计算人
  reviewer: string;  // 复核人
  note: string;      // 备注
}

export interface ProjectFile {
  schema: string;
  savedAt: string;    // ISO 时间
  appVersion: string;
  project: ProjectInfo;
  state: Record<string, unknown>; // 界面状态（UI 层负责解释）
}

export function emptyProject(): ProjectInfo {
  return { name: "", bridgeSite: "", engineer: "", reviewer: "", note: "" };
}

export function buildProjectFile(
  project: ProjectInfo,
  state: Record<string, unknown>,
  appVersion: string,
): ProjectFile {
  const p = { ...emptyProject(), ...project };
  for (const k of Object.keys(p)) {
    if (typeof (p as Record<string, unknown>)[k] !== "string") throw new Error(`项目信息字段 ${k} 必须为字符串`);
  }
  return {
    schema: PROJECT_SCHEMA,
    savedAt: new Date().toISOString(),
    appVersion,
    project: p,
    state,
  };
}

export function parseProjectFile(json: unknown): ProjectFile {
  if (typeof json !== "object" || json === null) throw new Error("工程文件必须为 JSON 对象");
  const f = json as ProjectFile;
  if (f.schema !== PROJECT_SCHEMA) throw new Error(`工程文件 schema 不匹配：期望 ${PROJECT_SCHEMA}，收到 ${String(f.schema)}`);
  if (typeof f.savedAt !== "string" || !f.savedAt) throw new Error("工程文件缺少 savedAt");
  if (typeof f.appVersion !== "string" || !f.appVersion) throw new Error("工程文件缺少 appVersion");
  if (typeof f.project !== "object" || f.project === null) throw new Error("工程文件缺少 project 信息");
  for (const k of ["name", "bridgeSite", "engineer", "reviewer", "note"] as const) {
    if (typeof f.project[k] !== "string") throw new Error(`工程文件 project.${k} 必须为字符串`);
  }
  if (typeof f.state !== "object" || f.state === null) throw new Error("工程文件缺少 state");
  return f;
}

export function serializeProject(file: ProjectFile): string {
  return JSON.stringify(file, null, 2);
}
