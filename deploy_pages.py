# -*- coding: utf-8 -*-
"""泓算 GitHub Pages 发布：上传网页版静态文件、启用 Pages、轮询验证。

默认执行真实发布；先用 --dry-run 校验本地产物完整性。
"""
from __future__ import annotations

import argparse
import base64
import shutil
import subprocess
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
APP_WEB = ROOT / "app" / "web"
WORK = ROOT / "work"
LOG = WORK / "pages_deploy.txt"
OWNER, REPO, BRANCH = "lele332", "hongsuan", "main"
API = "https://api.github.com"

LOCAL = {
    "docs/index.html": APP_WEB / "index.html",
    "docs/app.js": APP_WEB / "app.js",
    "docs/libs/docx.umd.js": APP_WEB / "libs" / "docx.umd.js",
}


def out(msg: str) -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg, flush=True)


def find_gh() -> str:
    found = shutil.which("gh")
    if found:
        return found
    fallback = Path(r"C:\Program Files\GitHub CLI\gh.exe")
    if fallback.is_file():
        return str(fallback)
    raise RuntimeError("未找到 GitHub CLI（gh.exe）")


def validate_local() -> None:
    missing = [f"{repo_path} -> {local}" for repo_path, local in LOCAL.items() if not local.is_file()]
    if missing:
        raise FileNotFoundError("缺少 Pages 发布文件：\n" + "\n".join(missing))
    app_root = APP_WEB.resolve()
    for repo_path, local in LOCAL.items():
        resolved = local.resolve()
        if app_root not in resolved.parents and resolved != app_root:
            raise RuntimeError(f"发布文件越出 app/web：{repo_path} -> {resolved}")
        out(f"local ok: {repo_path} ({resolved.stat().st_size} bytes)")


def gh_token(gh: str) -> str:
    proc = subprocess.run([gh, "auth", "token"], capture_output=True, text=True, check=False)
    token = proc.stdout.strip()
    if proc.returncode != 0 or not token:
        raise RuntimeError("GitHub CLI 未登录或无法获取 token：" + proc.stderr.strip())
    return token


def upload_tree(token: str) -> str:
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "hongsuan-pages",
    }

    ref = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}", headers=headers, timeout=30)
    if ref.status_code != 200:
        raise RuntimeError(f"读取分支失败：HTTP {ref.status_code} {ref.text[:200]}")
    base_commit = ref.json()["object"]["sha"]
    commit = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/commits/{base_commit}", headers=headers, timeout=30)
    if commit.status_code != 200:
        raise RuntimeError(f"读取基础提交失败：HTTP {commit.status_code}")
    base_tree = commit.json()["tree"]["sha"]
    out(f"base: {base_commit[:10]}")

    items = []
    for repo_path, local in LOCAL.items():
        payload = base64.b64encode(local.read_bytes()).decode("ascii")
        blob = requests.post(
            f"{API}/repos/{OWNER}/{REPO}/git/blobs",
            headers=headers,
            json={"content": payload, "encoding": "base64"},
            timeout=30,
        )
        if blob.status_code != 201:
            raise RuntimeError(f"创建 blob 失败 {repo_path}：HTTP {blob.status_code} {blob.text[:200]}")
        items.append({"path": repo_path, "mode": "100644", "type": "blob", "sha": blob.json()["sha"]})
        out(f"blob ok: {repo_path}")

    tree = requests.post(
        f"{API}/repos/{OWNER}/{REPO}/git/trees",
        headers=headers,
        json={"tree": items, "base_tree": base_tree},
        timeout=30,
    )
    if tree.status_code != 201:
        raise RuntimeError(f"创建 tree 失败：HTTP {tree.status_code} {tree.text[:200]}")

    commit_res = requests.post(
        f"{API}/repos/{OWNER}/{REPO}/git/commits",
        headers=headers,
        json={"message": "docs: 泓算 v0.8.0（GitHub Pages）", "tree": tree.json()["sha"], "parents": [base_commit]},
        timeout=30,
    )
    if commit_res.status_code != 201:
        raise RuntimeError(f"创建 commit 失败：HTTP {commit_res.status_code}")
    new_commit = commit_res.json()["sha"]

    push = requests.patch(
        f"{API}/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}",
        headers=headers,
        json={"sha": new_commit, "force": True},
        timeout=30,
    )
    if push.status_code != 200:
        raise RuntimeError(f"推送分支失败：HTTP {push.status_code} {push.text[:200]}")
    out(f"push docs: {push.status_code} ({new_commit[:10]})")
    return new_commit


def enable_pages(token: str) -> None:
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "hongsuan-pages",
    }
    res = requests.post(
        f"{API}/repos/{OWNER}/{REPO}/pages",
        headers=headers,
        json={"source": {"branch": BRANCH, "path": "/docs"}},
        timeout=30,
    )
    if res.status_code in (201, 409):
        out(f"pages enable: ok ({res.status_code})")
    else:
        out(f"pages enable: HTTP {res.status_code} {res.text[:200]}")


def verify_online() -> None:
    raw_url = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/docs/index.html"
    for _ in range(5):
        res = requests.get(raw_url, timeout=20)
        if res.status_code == 200 and "泓算" in res.text and 'src="app.js"' in res.text:
            out(f"raw verify OK ({len(res.text)} bytes)")
            break
        time.sleep(3)
    else:
        raise RuntimeError("raw verify FAILED")

    app_js = requests.get(f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/docs/app.js", timeout=20)
    if app_js.status_code != 200 or len(app_js.content) < 40960:
        raise RuntimeError(f"app.js raw verify FAILED: HTTP {app_js.status_code}, {len(app_js.content)} bytes")
    out(f"app.js raw verify OK ({len(app_js.content)} bytes)")

    pages_url = f"https://{OWNER}.github.io/{REPO}/"
    ok = False
    for i in range(8):
        try:
            res = requests.get(pages_url, timeout=20)
            if res.status_code == 200 and "泓算" in res.text:
                out(f"pages verify OK after {(i + 1) * 15}s")
                ok = True
                break
        except requests.RequestException:
            pass
        time.sleep(15)
    out("PAGES_LIVE" if ok else "PAGES_TIMEOUT（Pages 构建中，稍后自会生效）")
    out(f"URL: {pages_url}")
    if not ok:
        sys.exit(2)


def main() -> None:
    parser = argparse.ArgumentParser(description="发布泓算网页版到 GitHub Pages")
    parser.add_argument("--dry-run", action="store_true", help="只校验本地产物，不访问 GitHub")
    args = parser.parse_args()

    WORK.mkdir(parents=True, exist_ok=True)
    LOG.write_text("", encoding="utf-8")
    validate_local()
    if args.dry_run:
        out("DRY_RUN_OK")
        return

    token = gh_token(find_gh())
    upload_tree(token)
    enable_pages(token)
    verify_online()


if __name__ == "__main__":
    main()
