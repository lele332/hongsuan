/* 泓算 · 手机键盘适配（visualViewport，2026-10-29）
 * 问题：键盘弹起时固定的底部导航条/抽屉悬在键盘上方遮住输入框。
 * 方案：键盘弹出（视口高度骤减 >120px）时给 body 加 hs-kb-open，
 *       CSS 隐藏底部导航/抽屉；失焦或键盘收起后自动恢复。
 */
(function () {
  "use strict";
  var vv = window.visualViewport;
  if (!vv) return;
  var kbOpen = false;
  function closeDrawer() {
    var d = document.getElementById("hsMobileDrawer");
    if (d && d.classList.contains("open")) d.classList.remove("open");
  }
  function update() {
    var overlap = window.innerHeight - vv.height - vv.offsetTop;
    var nowOpen = overlap > 120;
    if (nowOpen === kbOpen) return;
    kbOpen = nowOpen;
    document.body.classList.toggle("hs-kb-open", kbOpen);
    if (kbOpen) closeDrawer();
  }
  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();
})();
