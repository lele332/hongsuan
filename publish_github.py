# -*- coding: utf-8 -*-
"""泓算 → GitHub（v2）：空 repo 先用 contents API 初始化，再走 Git Data API 全量提交"""
import base64
import os
import subprocess
import sys
import requests

GH = "C:\\Program Files\\GitHub CLI\\gh.exe"
ROOT = r"D:\植物\2026-09-22-17-48-53\桥涵水文项目"
OWNER = "lele332"
REPO = "hongsuan"
BRANCH = "main"
API = "https://api.github.com"

FILES = [
    ("README.md", "README.md"),
    ("LICENSE", "LICENSE"),
    ("app/README.md", "app/README.md"),
    ("app/package.json", "app/package.json"),
    ("app/tsconfig.json", "app/tsconfig.json"),
    ("app/src/core/phi.ts", "app/src/core/phi.ts"),
    ("app/src/core/stats.ts", "app/src/core/stats.ts"),
    ("app/src/core/empirical.ts", "app/src/core/empirical.ts"),
    ("app/src/core/designflood.ts", "app/src/core/designflood.ts"),
    ("app/src/core/bayes.ts", "app/src/core/bayes.ts"),
    ("app/src/core/methodB.ts", "app/src/core/methodB.ts"),
    ("app/src/core/methodC.ts", "app/src/core/methodC.ts"),
    ("app/src/tests/phi.test.ts", "app/src/tests/phi.test.ts"),
    ("app/src/tests/cases.test.ts", "app/src/tests/cases.test.ts"),
    ("app/src/tests/discontinuous.test.ts", "app/src/tests/discontinuous.test.ts"),
    ("app/src/tests/bayes.test.ts", "app/src/tests/bayes.test.ts"),
    ("app/src/tests/methodB.test.ts", "app/src/tests/methodB.test.ts"),
    ("app/src/tests/methodC.test.ts", "app/src/tests/methodC.test.ts"),
    ("app/web/index.html", "app/web/index.html"),
    ("app/web/libs/docx.umd.js", "app/web/libs/docx.umd.js"),
    ("app/cross_verify.py", "app/cross_verify.py"),
    ("app/bayes_cross.py", "app/bayes_cross.py"),
    ("app/dump_for_verify.ts", "app/dump_for_verify.ts"),
    ("app/dump_bayes.ts", "app/dump_bayes.ts"),
    ("app/test_output.txt", "app/test_output.txt"),
    ("交接文档.md", "docs/交接文档.md"),
    ("参考资料/计算正确性验证报告.md", "docs/计算正确性验证报告.md"),
    ("参考资料/教材与例题资料.md", "docs/教材与例题资料.md"),
]

LOG = r"D:\植物\2026-09-22-17-48-53\gh_publish.txt"

def out(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def main():
    open(LOG, "w").close()
    tok = subprocess.run([GH, "auth", "token"], capture_output=True, text=True).stdout.strip()
    if not tok:
        out("FATAL: gh auth token 为空"); sys.exit(1)
    H = {"Authorization": f"token {tok}", "Accept": "application/vnd.github+json", "User-Agent": "hongsuan-publisher"}

    # 0) 若仓库不存在则创建（auto_init 避免空 repo 409）
    r = requests.get(f"{API}/repos/{OWNER}/{REPO}", headers=H)
    if r.status_code == 404:
        r = requests.post(f"{API}/user/repos", headers=H,
                          json={"name": REPO, "description": "泓算 · 面向学生与青年工程师的公路桥涵水文计算工具（JTG C30-2015）",
                                "private": False, "auto_init": True})
        out(f"create repo: {r.status_code}")
        if r.status_code not in (201,):
            out(r.text[:300]); sys.exit(1)
    else:
        out(f"repo exists: {r.status_code}")

    # 1) 取 main 的 base commit（空仓库则用 contents API 初始化）
    ref = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}", headers=H)
    parents, base_tree = [], None
    if ref.status_code == 200:
        base_commit = ref.json()["object"]["sha"]
        parents = [base_commit]
        t = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/commits/{base_commit}", headers=H).json()
        base_tree = t["tree"]["sha"]
        out(f"base commit: {base_commit[:10]}, tree: {base_tree[:10]}")
    else:
        out("no branch — initializing via contents API")
        c = base64.b64encode("# 泓算\n".encode()).decode()
        r0 = requests.put(f"{API}/repos/{OWNER}/{REPO}/contents/.init", headers=H,
                          json={"message": "init", "content": c})
        out(f"init put: {r0.status_code}")
        if r0.status_code not in (201,):
            out(r0.text[:300]); sys.exit(1)
        ref = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}", headers=H)
        base_commit = ref.json()["object"]["sha"]
        parents = [base_commit]
        t = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/commits/{base_commit}", headers=H).json()
        base_tree = t["tree"]["sha"]
        out(f"initialized base: {base_commit[:10]}")

    # 2) blobs
    tree_items = []
    for local, repo_path in FILES:
        full = os.path.join(ROOT, local)
        if not os.path.exists(full):
            out(f"MISSING: {local}"); sys.exit(1)
        with open(full, "rb") as f:
            content = base64.b64encode(f.read()).decode()
        rb = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/blobs", headers=H,
                           json={"content": content, "encoding": "base64"})
        if rb.status_code != 201:
            out(f"blob FAIL {repo_path}: {rb.status_code} {rb.text[:200]}"); sys.exit(1)
        tree_items.append({"path": repo_path, "mode": "100644", "type": "blob", "sha": rb.json()["sha"]})
        out(f"blob ok: {repo_path}")

    # 3) tree（带 base_tree，避免删掉已有文件）
    payload = {"tree": tree_items}
    if base_tree:
        payload["base_tree"] = base_tree
    rt = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/trees", headers=H, json=payload)
    if rt.status_code != 201:
        out(f"tree FAIL: {rt.status_code} {rt.text[:300]}"); sys.exit(1)
    tree_sha = rt.json()["sha"]
    out(f"tree ok: {tree_sha[:10]} ({len(tree_items)} files)")

    # 4) commit
    rc = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/commits", headers=H,
                       json={"message": "泓算 v0.5.0：设计流量推求三方法 + 贝叶斯线型比选 + Word 计算书（40 测试全过）",
                             "tree": tree_sha, "parents": parents})
    if rc.status_code != 201:
        out(f"commit FAIL: {rc.status_code} {rc.text[:300]}"); sys.exit(1)
    commit_sha = rc.json()["sha"]
    out(f"commit ok: {commit_sha[:10]}")

    # 5) 更新 ref
    rr = requests.patch(f"{API}/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", headers=H,
                        json={"sha": commit_sha, "force": True})
    out(f"ref update: {rr.status_code}")
    if rr.status_code != 200:
        out(rr.text[:300]); sys.exit(1)
    # 验证
    chk = requests.get(f"{API}/repos/{OWNER}/{REPO}/contents/app/src/core/phi.ts", headers=H)
    out(f"verify phi.ts reachable: {chk.status_code}, size={chk.json().get('size') if chk.status_code==200 else '?'}")
    out(f"DONE https://github.com/{OWNER}/{REPO}")

main()
