// Cloudflare Pages Function: OCR relay
// POST /ocr {"image": base64} -> 转发到 ECS RapidOCR (HTTP)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.text();
    const upstream = await fetch("http://120.26.35.167:9005/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", ...CORS }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }
}
