# -*- coding: utf-8 -*-
"""生成泓算单文件离线版：把 docx.umd.js 内联进 index.html，断网环境双击即用。

产物：桌面/泓算离线版/泓算.html（单文件，零外部请求）
"""
import os

ROOT = r"D:\植物\2026-09-22-17-48-53\桥涵水文项目"
SRC = os.path.join(ROOT, "app", "web", "index.html")
LIB = os.path.join(ROOT, "app", "web", "libs", "docx.umd.js")
OUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "泓算离线版")
OUT = os.path.join(OUT_DIR, "泓算.html")
LOG = os.path.join(r"D:\植物\2026-09-22-17-48-53", "offline_build.txt")

lines = []

with open(SRC, encoding="utf-8") as f:
    html = f.read()
with open(LIB, encoding="utf-8") as f:
    lib = f.read()

# 内联安全检查：库内不得含 </script（已验证为 0，出现则须转义）
n_script_break = lib.lower().count("</script")
if n_script_break:
    lib = lib.replace("</script", "<\\/script")
lines.append(f"lib </script occurrences: {n_script_break} (escaped)")

TAG = '<script src="libs/docx.umd.js"></script>'
assert TAG in html, "未找到 docx script 标签"
html = html.replace(TAG, "<script>\n/* docx 9.5.1 UMD — 已内联，离线可用 */\n" + lib + "\n</script>")

# 标题标注离线版（仅 title 一处，兼容 v0.5.x / v0.6）
import re as _re
html = _re.sub(r"<title>泓算 · 桥涵设计流量推求 v[\d.]+</title>",
               "<title>泓算 · 桥涵设计流量推求 v0.6（离线版）</title>", html, count=1)

os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
lines.append(f"OK: {OUT} ({len(html)/1024:.0f} KB)")

# 自检：不再有任何外部资源引用
import re
ext = re.findall(r'(?:src|href)\s*=\s*["\'](?:https?://|libs/)', html)
lines.append(f"remaining external refs: {ext}")

with open(LOG, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("\n".join(lines))
