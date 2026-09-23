import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_SCHEMA, buildProjectFile, emptyProject, parseProjectFile, serializeProject,
} from "../core/projectFile.ts";

test("工程文件构建与序列化往返", () => {
  const f = buildProjectFile(
    { name: "测试项目", bridgeSite: "K3+685", engineer: "卓庆", reviewer: "", note: "" },
    { series: "1 2 3" },
    "0.10.0",
  );
  assert.equal(f.schema, PROJECT_SCHEMA);
  const parsed = parseProjectFile(JSON.parse(serializeProject(f)));
  assert.equal(parsed.project.name, "测试项目");
  assert.equal(parsed.project.bridgeSite, "K3+685");
  assert.equal((parsed.state as { series: string }).series, "1 2 3");
  assert.ok(parsed.savedAt && parsed.appVersion === "0.10.0");
});

test("工程文件拒绝坏数据", () => {
  assert.throws(() => parseProjectFile(null), /JSON 对象/);
  assert.throws(() => parseProjectFile({ schema: "other" }), /schema/);
  assert.throws(() => parseProjectFile({ schema: PROJECT_SCHEMA, savedAt: "", appVersion: "x", project: emptyProject(), state: {} }), /savedAt/);
  assert.throws(() => parseProjectFile({
    schema: PROJECT_SCHEMA, savedAt: "t", appVersion: "x",
    project: { name: 1, bridgeSite: "", engineer: "", reviewer: "", note: "" }, state: {},
  }), /project\.name/);
  assert.throws(() => parseProjectFile({
    schema: PROJECT_SCHEMA, savedAt: "t", appVersion: "x", project: emptyProject(),
  }), /state/);
});

test("项目信息字段非字符串响亮失败", () => {
  const bad = { name: 123, bridgeSite: "", engineer: "", reviewer: "", note: "" };
  assert.throws(
    () => buildProjectFile(bad as unknown as Parameters<typeof buildProjectFile>[0], {}, "0.10.0"),
    /必须为字符串/,
  );
});
