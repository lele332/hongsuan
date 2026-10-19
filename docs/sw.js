/* 泓算 Service Worker：预缓存应用外壳 + 运行时缓存（Workbox 风格策略的轻量实现）
 * 更新方式：改代码时把 CACHE 版本号 +1，旧缓存自动清理。
 */
const CACHE = "hongsuan-v1-0-36-b1903c3";
const PRECACHE = [
  "./",
  "index.html",
  "app.js",
  "chart_echarts.js",
  "onboarding.js",
  "build-info.js",
  "error_report.js",
  "feedback.js",
  "tracking.js",
  "report_fie.js",
  "history.js",
  "download.js",
  "demo/demo_data.js",
  "demo/demo_table.jpg",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "libs/echarts.min.js",
  "libs/driver.min.js",
  "libs/driver.min.css",
  "libs/dexie.min.js",
  "share_card.js",
  "assets/hongsuan-qr.png",
  "libs/jszip.min.js",
  "libs/xlsx.full.min.js",
  "libs/pdf.min.js",
  "libs/pdf.worker.min.js",
  "libs/docx.umd.js",
  "libs/tesseract/tesseract.min.js",
  "libs/leaflet/leaflet.js",
  "libs/leaflet/leaflet.css",
  "libs/leaflet/china_provinces.js",
  "libs/leaflet/sp_contours.js",
  "libs/leaflet/atlas_h1p_60min.js",
  "libs/leaflet/atlas_p3_params.js",
  "libs/leaflet/sp1_clean.png",
  "libs/leaflet/sp4_clean.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部请求（Umami 等）直连，不缓存

  // 页面导航：网络优先（保证内容最新），失败时回退到缓存（网络抖动不再 ERR_FAILED）
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("index.html", copy));
          }
          return res;
        })
        .catch(() =>
          caches.match("index.html")
            .then((hit) => hit || caches.match("./"))
            .then((hit) => hit || Response.error())
        )
    );
    return;
  }

  // 静态资源：缓存优先（含首次在线使用后才缓存的 OCR 大文件）
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
