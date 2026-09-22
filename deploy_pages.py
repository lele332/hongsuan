# -*- coding: utf-8 -*-
"""泓算 GitHub Pages 上线：上传 docs 静态文件 + 启用 Pages + 轮询验证"""
import base64
import subprocess
import sys
import time
import requests

GH = "C:\\Program Files\\GitHub CLI\\gh.exe"
LOCAL = {
    "docs/index.html": r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\app\web\index.html",
    "docs/libs/docx.umd.js": r"D:\植物\2026-09-22-17-48-53\桥涵水文项目\app\web\libs\docx.umd.js",
}
OWNER, REPO, BRANCH = "lele332", "hongsuan", "main"
API = "https://api.github.com"
LOG = r"D:\植物\2026-09-22-17-48-53\pages_deploy.txt"

def out(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def main():
    open(LOG, "w").close()
    tok = subprocess.run([GH, "auth", "token"], capture_output=True, text=True).stdout.strip()
    if not tok:
        out("FATAL: no token"); sys.exit(1)
    H = {"Authorization": f"token {tok}", "Accept": "application/vnd.github+json", "User-Agent": "hongsuan-pages"}

    # base commit
    ref = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}", headers=H)
    base_commit = ref.json()["object"]["sha"]
    base_tree = requests.get(f"{API}/repos/{OWNER}/{REPO}/git/commits/{base_commit}", headers=H).json()["tree"]["sha"]
    out(f"base: {base_commit[:10]}")

    # blobs + tree
    items = []
    for repo_path, local in LOCAL.items():
        with open(local, "rb") as f:
            content = base64.b64encode(f.read()).decode()
        rb = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/blobs", headers=H,
                           json={"content": content, "encoding": "base64"})
        if rb.status_code != 201:
            out(f"blob FAIL {repo_path}: {rb.status_code}"); sys.exit(1)
        items.append({"path": repo_path, "mode": "100644", "type": "blob", "sha": rb.json()["sha"]})
        out(f"blob ok: {repo_path}")
    rt = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/trees", headers=H,
                       json={"tree": items, "base_tree": base_tree})
    if rt.status_code != 201:
        out(f"tree FAIL: {rt.status_code} {rt.text[:200]}"); sys.exit(1)
    rc = requests.post(f"{API}/repos/{OWNER}/{REPO}/git/commits", headers=H,
                       json={"message": "docs: 线上版（GitHub Pages，no-cache）",
                             "tree": rt.json()["sha"], "parents": [base_commit]})
    if rc.status_code != 201:
        out(f"commit FAIL: {rc.status_code}"); sys.exit(1)
    rr = requests.patch(f"{API}/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", headers=H,
                        json={"sha": rc.json()["sha"], "force": True})
    out(f"push docs: {rr.status_code}")

    # 启用 Pages（/docs 目录）
    rp = requests.post(f"{API}/repos/{OWNER}/{REPO}/pages", headers=H,
                       json={"source": {"branch": BRANCH, "path": "/docs"}})
    out(f"pages enable: {rp.status_code} {rp.text[:150] if rp.status_code not in (201, 409) else 'ok'}")

    # 验证：raw 即时 + Pages 轮询
    raw_url = f"https://raw.githubusercontent.com/{OWNER}/{REPO}/{BRANCH}/docs/index.html"
    for _ in range(5):
        r = requests.get(raw_url, timeout=20)
        if r.status_code == 200 and "泓算" in r.text:
            out(f"raw verify OK ({len(r.text)} bytes, 含'泓算')")
            break
        time.sleep(3)
    else:
        out("raw verify FAILED"); sys.exit(1)

    pages_url = f"https://{OWNER}.github.io/{REPO}/"
    ok = False
    for i in range(8):
        try:
            r = requests.get(pages_url, timeout=20)
            if r.status_code == 200 and "泓算" in r.text:
                out(f"pages verify OK after {(i+1)*15}s")
                ok = True
                break
        except Exception:
            pass
        time.sleep(15)
    out("PAGES_LIVE" if ok else "PAGES_TIMEOUT（Pages 构建中，稍后自会生效）")
    out(f"URL: {pages_url}")

main()
