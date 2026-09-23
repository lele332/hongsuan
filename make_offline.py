# -*- coding: utf-8 -*-
"""生成泓算 v0.10.1 单文件离线版：内联 docx 与 app.js，断网双击即用。"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "app" / "web" / "index.html"
LIB = ROOT / "app" / "web" / "libs" / "docx.umd.js"
APP_JS = ROOT / "app" / "web" / "app.js"
OUT_DIR = ROOT / "dist" / "泓算离线版-v0.10.1"
OUT = OUT_DIR / "泓算-v0.10.1-离线版.html"
VERSION = "0.10.1"


def inline_script(tag: str, code: str, comment: str, html: str) -> str:
    if tag not in html:
        raise RuntimeError(f"未找到待内联标签：{tag}")
    if "</script" in code.lower():
        code = code.replace("</script", "<\\/script")
    return html.replace(
        tag,
        f"<script>\n/* {comment} — 已内联，离线可用 */\n{code}\n</script>",
        1,
    )


def main() -> None:
    html = SRC.read_text(encoding="utf-8")
    lib = LIB.read_text(encoding="utf-8")
    app_js = APP_JS.read_text(encoding="utf-8")

    html = inline_script(
        '<script src="libs/docx.umd.js"></script>',
        lib,
        "docx 9.5.1 UMD",
        html,
    )
    html = inline_script(
        '<script src="app.js"></script>',
        app_js,
        "泓算 v0.8.1 计算内核与界面",
        html,
    )
    html = re.sub(
        r"<title>泓算 · 桥涵设计流量推求 v[\d.]+</title>",
        f"<title>泓算 · 桥涵设计流量推求 v{VERSION}（离线版）</title>",
        html,
        count=1,
    )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    external = re.findall(r'(?:src|href)\s*=\s*["\'](?:https?://|libs/|app\.js)', html)
    if external:
        raise RuntimeError(f"离线版仍存在外部引用：{external}")
    print(f"OK: {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
    print("remaining external refs: []")


if __name__ == "__main__":
    main()
